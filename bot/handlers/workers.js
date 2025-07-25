const { Markup } = require('telegraf');
const database = require('../config/database');
const cloudflareService = require('../services/cloudflare');
const githubService = require('../services/github');
const fs = require('fs-extra');

class WorkersHandler {
    // Deploy from Git
    async handleDeployGit(ctx) {
        const userId = ctx.from.id;
        
        database.updateUserStep(userId, 'deploy_git_name');
        
        await ctx.editMessageText(
            '🚀 *Deploy dari GitHub*\n\n📝 *Langkah 1/2*\nSilakan kirim nama worker:',
            { parse_mode: 'Markdown' }
        );
    }

    async handleDeployGitName(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);
        
        if (!user || user.currentStep !== 'deploy_git_name') {
            return;
        }

        const workerName = ctx.message.text.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        database.updateUserStep(userId, 'deploy_git_repo', { workerName });
        
        await ctx.reply(
            `✅ *Nama worker: ${workerName}*\n\n🔗 *Langkah 2/2*\nSilakan kirim link GitHub repository:\n\n*Format yang didukung:*\n- https://github.com/user/repo\n- github.com/user/repo\n- user/repo`,
            { parse_mode: 'Markdown' }
        );
    }

    async handleDeployGitRepo(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);
        
        if (!user || user.currentStep !== 'deploy_git_repo') {
            return;
        }

        const repoUrl = ctx.message.text.trim();
        const { workerName } = user.stepData;

        // Show loading message
        const loadingMsg = await ctx.reply('🔄 Cloning repository...');

        try {
            // Clone repository
            const cloneResult = await githubService.cloneRepository(repoUrl, workerName);
            
            if (!cloneResult.success) {
                await ctx.editMessageText(`❌ *Error cloning repository:*\n${cloneResult.error}`, {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                database.clearUserStep(userId);
                return;
            }

            await ctx.editMessageText('🔄 Processing repository...', {
                message_id: loadingMsg.message_id
            });

            const repoPath = cloneResult.path;

            // Check for wrangler.toml
            const wranglerConfig = await githubService.checkWranglerConfig(repoPath);
            
            let scriptContent;
            
            if (wranglerConfig.exists) {
                // Use wrangler.toml to find main script
                const mainScript = await githubService.findMainScript(repoPath);
                
                if (!mainScript.found) {
                    await ctx.editMessageText('❌ *Error: Main script not found in repository*', {
                        parse_mode: 'Markdown',
                        message_id: loadingMsg.message_id
                    });
                    await githubService.cleanup(repoPath);
                    database.clearUserStep(userId);
                    return;
                }
                
                scriptContent = mainScript.content;
            } else {
                // Try to find main script manually
                const mainScript = await githubService.findMainScript(repoPath);
                
                if (!mainScript.found) {
                    await ctx.editMessageText('❌ *Error: No main script found*\n\nSupported files: index.js, worker.js, src/index.js, src/worker.js', {
                        parse_mode: 'Markdown',
                        message_id: loadingMsg.message_id
                    });
                    await githubService.cleanup(repoPath);
                    database.clearUserStep(userId);
                    return;
                }
                
                scriptContent = mainScript.content;
            }

            await ctx.editMessageText('🔄 Deploying to Cloudflare...', {
                message_id: loadingMsg.message_id
            });

            // Deploy to Cloudflare
            const deployResult = await cloudflareService.deployWorker(
                user.apiToken,
                user.accountId,
                workerName,
                scriptContent
            );

            if (!deployResult.success) {
                await ctx.editMessageText(`❌ *Deploy failed:*\n${deployResult.error}`, {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                await githubService.cleanup(repoPath);
                database.clearUserStep(userId);
                return;
            }

            // Get subdomain for URL
            const subdomain = await cloudflareService.getWorkerSubdomain(user.apiToken, user.accountId, user.zoneId);

            const successMessage = `──────────────
✅ *Deploy Berhasil!*
🔹 Nama Worker: ${workerName}
🔹 Link: https://${workerName}.${subdomain}.workers.dev
──────────────`;

            await ctx.editMessageText(successMessage, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });

            // Cleanup
            await githubService.cleanup(repoPath);
            database.clearUserStep(userId);

        } catch (error) {
            console.error('Deploy git error:', error);
            await ctx.editMessageText(`❌ *Unexpected error:*\n${error.message}`, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });
            database.clearUserStep(userId);
        }
    }

    // Upload JS file
    async handleUploadJS(ctx) {
        const userId = ctx.from.id;
        
        database.updateUserStep(userId, 'upload_js_name');
        
        await ctx.editMessageText(
            '📂 *Upload File JS*\n\n📝 *Langkah 1/2*\nSilakan kirim nama worker:',
            { parse_mode: 'Markdown' }
        );
    }

    async handleUploadJSName(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);
        
        if (!user || user.currentStep !== 'upload_js_name') {
            return;
        }

        const workerName = ctx.message.text.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        database.updateUserStep(userId, 'upload_js_file', { workerName });
        
        await ctx.reply(
            `✅ *Nama worker: ${workerName}*\n\n📄 *Langkah 2/2*\nSilakan upload file .js atau paste kode JavaScript:`,
            { parse_mode: 'Markdown' }
        );
    }

    async handleUploadJSFile(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);
        
        if (!user || user.currentStep !== 'upload_js_file') {
            return;
        }

        const { workerName } = user.stepData;
        let scriptContent;

        // Check if it's a file upload
        if (ctx.message.document) {
            const file = ctx.message.document;
            
            if (!file.file_name.endsWith('.js')) {
                await ctx.reply('❌ *Error: File harus berformat .js*', {
                    parse_mode: 'Markdown'
                });
                return;
            }

            const loadingMsg = await ctx.reply('🔄 Processing file...');

            try {
                const fileLink = await ctx.telegram.getFileLink(file.file_id);
                const response = await fetch(fileLink.href);
                scriptContent = await response.text();

                await ctx.deleteMessage(loadingMsg.message_id);
            } catch (error) {
                await ctx.editMessageText(`❌ *Error reading file:*\n${error.message}`, {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                return;
            }
        } else if (ctx.message.text) {
            // Text content
            scriptContent = ctx.message.text.trim();
        } else {
            await ctx.reply('❌ *Error: Silakan upload file .js atau paste kode JavaScript*', {
                parse_mode: 'Markdown'
            });
            return;
        }

        // Validate JavaScript content
        if (!scriptContent || scriptContent.length < 10) {
            await ctx.reply('❌ *Error: Kode JavaScript terlalu pendek atau kosong*', {
                parse_mode: 'Markdown'
            });
            return;
        }

        const loadingMsg = await ctx.reply('🔄 Deploying to Cloudflare...');

        try {
            // Deploy to Cloudflare
            const deployResult = await cloudflareService.deployWorker(
                user.apiToken,
                user.accountId,
                workerName,
                scriptContent
            );

            if (!deployResult.success) {
                await ctx.editMessageText(`❌ *Deploy failed:*\n${deployResult.error}`, {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                database.clearUserStep(userId);
                return;
            }

            // Get subdomain for URL
            const subdomain = await cloudflareService.getWorkerSubdomain(user.apiToken, user.accountId, user.zoneId);

            const successMessage = `──────────────
✅ *Upload & Deploy Berhasil!*
🔹 Nama Worker: ${workerName}
🔹 Link: https://${workerName}.${subdomain}.workers.dev
──────────────`;

            await ctx.editMessageText(successMessage, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });

            database.clearUserStep(userId);

        } catch (error) {
            console.error('Upload JS error:', error);
            await ctx.editMessageText(`❌ *Unexpected error:*\n${error.message}`, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });
            database.clearUserStep(userId);
        }
    }

    // List workers
    async handleListWorkers(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);

        const loadingMsg = await ctx.editMessageText('🔄 Loading workers...');

        try {
            const result = await cloudflareService.listWorkers(user.apiToken, user.accountId);

            if (!result.success) {
                await ctx.editMessageText(`❌ *Error loading workers:*\n${result.error}`, {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                return;
            }

            const workers = result.workers;

            if (workers.length === 0) {
                await ctx.editMessageText('📜 *Daftar Workers*\n\n❌ Tidak ada worker ditemukan.', {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                return;
            }

            const subdomain = await cloudflareService.getWorkerSubdomain(user.apiToken, user.accountId, user.zoneId);

            let message = '📜 *Daftar Workers*\n\n';
            
            workers.forEach((worker, index) => {
                message += `──────────────\n`;
                message += `${index + 1}️⃣ Nama: ${worker.id}\n`;
                message += `🌐 Domain: https://${worker.id}.${subdomain}.workers.dev\n`;
            });
            
            message += '──────────────';

            await ctx.editMessageText(message, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });

        } catch (error) {
            console.error('List workers error:', error);
            await ctx.editMessageText(`❌ *Unexpected error:*\n${error.message}`, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });
        }
    }

    // Delete workers
    async handleDeleteWorker(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);

        const loadingMsg = await ctx.editMessageText('🔄 Loading workers...');

        try {
            const result = await cloudflareService.listWorkers(user.apiToken, user.accountId);

            if (!result.success) {
                await ctx.editMessageText(`❌ *Error loading workers:*\n${result.error}`, {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                return;
            }

            const workers = result.workers;

            if (workers.length === 0) {
                await ctx.editMessageText('🗑️ *Hapus Worker*\n\n❌ Tidak ada worker untuk dihapus.', {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                return;
            }

            // Create buttons for each worker
            const buttons = workers.map(worker => [
                Markup.button.callback(`❌ ${worker.id}`, `delete_${worker.id}`)
            ]);

            const keyboard = Markup.inlineKeyboard(buttons);

            await ctx.editMessageText('🗑️ *Hapus Worker*\n\nPilih worker yang ingin dihapus:', {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id,
                ...keyboard
            });

        } catch (error) {
            console.error('Delete worker list error:', error);
            await ctx.editMessageText(`❌ *Unexpected error:*\n${error.message}`, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });
        }
    }

    async handleDeleteWorkerConfirm(ctx, workerName) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);

        const loadingMsg = await ctx.editMessageText('🔄 Deleting worker...');

        try {
            const result = await cloudflareService.deleteWorker(user.apiToken, user.accountId, workerName);

            if (!result.success) {
                await ctx.editMessageText(`❌ *Error deleting worker:*\n${result.error}`, {
                    parse_mode: 'Markdown',
                    message_id: loadingMsg.message_id
                });
                return;
            }

            const successMessage = `──────────────
✅ *Worker Dihapus!*
🔹 Nama: ${workerName}
──────────────`;

            await ctx.editMessageText(successMessage, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });

        } catch (error) {
            console.error('Delete worker error:', error);
            await ctx.editMessageText(`❌ *Unexpected error:*\n${error.message}`, {
                parse_mode: 'Markdown',
                message_id: loadingMsg.message_id
            });
        }
    }
}

module.exports = new WorkersHandler();