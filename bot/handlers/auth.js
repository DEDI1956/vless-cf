const { Markup } = require('telegraf');
const database = require('../config/database');
const cloudflareService = require('../services/cloudflare');

class AuthHandler {
    async handleStart(ctx) {
        const welcomeMessage = `⚡ *Selamat datang di BOT CLOUDFLARE!*

🔹 *Tujuan Bot*: Deploy & kelola Cloudflare Workers dari GitHub atau File JS.
🔹 *Peraturan Bot*:
- Gunakan dengan bijak.
- Tidak untuk aktivitas ilegal.
🔹 *Risiko*:
- Segala risiko ditanggung pengguna sendiri.`;

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback('✅ Saya Setuju', 'agree')
        ]);

        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }

    async handleAgree(ctx) {
        const userId = ctx.from.id;
        
        database.updateUserStep(userId, 'waiting_api_token');
        
        await ctx.editMessageText(
            '🔑 *Langkah 1/3: API Token*\n\nSilakan kirim API Token Cloudflare Anda:',
            { parse_mode: 'Markdown' }
        );
    }

    async handleApiToken(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);
        
        if (!user || user.currentStep !== 'waiting_api_token') {
            return;
        }

        const apiToken = ctx.message.text.trim();
        
        // Show loading message
        const loadingMsg = await ctx.reply('🔄 Memvalidasi token...');
        
        // Validate token
        const validation = await cloudflareService.validateToken(apiToken);
        
        await ctx.deleteMessage(loadingMsg.message_id);
        
        if (!validation.success) {
            await ctx.reply(
                `❌ *Token tidak valid!*\n\nError: ${validation.error}\n\nSilakan kirim token yang benar:`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Save token and user info
        database.setUser(userId, {
            apiToken: apiToken,
            email: validation.email,
            cloudflareUserId: validation.id
        });

        database.updateUserStep(userId, 'waiting_account_id');

        await ctx.reply(
            '✅ *Token valid!*\n\n🔑 *Langkah 2/3: Account ID*\n\nSilakan kirim Account ID Cloudflare Anda:',
            { parse_mode: 'Markdown' }
        );
    }

    async handleAccountId(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);
        
        if (!user || user.currentStep !== 'waiting_account_id') {
            return;
        }

        const accountId = ctx.message.text.trim();
        
        database.setUser(userId, { accountId: accountId });
        database.updateUserStep(userId, 'waiting_zone_id');

        await ctx.reply(
            '✅ *Account ID tersimpan!*\n\n🌐 *Langkah 3/3: Zone ID*\n\nSilakan kirim Zone ID Cloudflare Anda:',
            { parse_mode: 'Markdown' }
        );
    }

    async handleZoneId(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);
        
        if (!user || user.currentStep !== 'waiting_zone_id') {
            return;
        }

        const zoneId = ctx.message.text.trim();
        
        database.setUser(userId, { zoneId: zoneId });
        database.clearUserStep(userId);

        const updatedUser = database.getUser(userId);

        const successMessage = `🔐 *Login Berhasil!*

*Data Akun:*
──────────────
📧 Email: ${updatedUser.email}
🆔 Account ID: ${updatedUser.accountId}
🌐 Zone ID: ${updatedUser.zoneId}
──────────────

Silakan pilih fitur:`;

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('🚀 DeployGit', 'deploy_git'),
                Markup.button.callback('📂 UploadJS', 'upload_js')
            ],
            [
                Markup.button.callback('📜 ListWrk', 'list_workers'),
                Markup.button.callback('🗑️ DelWrk', 'delete_worker')
            ]
        ]);

        await ctx.reply(successMessage, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }

    checkAuth(ctx, next) {
        const userId = ctx.from.id;
        
        if (!database.isUserLoggedIn(userId)) {
            ctx.reply(
                '❌ *Anda belum login!*\n\nSilakan ketik /start untuk memulai proses login.',
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        return next();
    }

    async showMainMenu(ctx) {
        const userId = ctx.from.id;
        const user = database.getUser(userId);

        if (!user) {
            return ctx.reply('❌ Sesi tidak ditemukan. Ketik /start untuk memulai.');
        }

        const menuMessage = `🔐 *Menu Utama*

*Data Akun:*
──────────────
📧 Email: ${user.email}
🆔 Account ID: ${user.accountId}
🌐 Zone ID: ${user.zoneId}
──────────────

Silakan pilih fitur:`;

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('🚀 DeployGit', 'deploy_git'),
                Markup.button.callback('📂 UploadJS', 'upload_js')
            ],
            [
                Markup.button.callback('📜 ListWrk', 'list_workers'),
                Markup.button.callback('🗑️ DelWrk', 'delete_worker')
            ]
        ]);

        await ctx.reply(menuMessage, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }
}

module.exports = new AuthHandler();