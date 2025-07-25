require('dotenv').config();
const { Telegraf } = require('telegraf');
const database = require('./config/database');
const authHandler = require('./handlers/auth');
const workersHandler = require('./handlers/workers');
const githubService = require('./services/github');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.').catch(console.error);
});

// Start command
bot.start(authHandler.handleStart);

// Callback query handlers
bot.action('agree', authHandler.handleAgree);
bot.action('deploy_git', authHandler.checkAuth, workersHandler.handleDeployGit);
bot.action('upload_js', authHandler.checkAuth, workersHandler.handleUploadJS);
bot.action('list_workers', authHandler.checkAuth, workersHandler.handleListWorkers);
bot.action('delete_worker', authHandler.checkAuth, workersHandler.handleDeleteWorker);

// Handle delete worker confirmation
bot.action(/^delete_(.+)$/, authHandler.checkAuth, (ctx) => {
    const workerName = ctx.match[1];
    workersHandler.handleDeleteWorkerConfirm(ctx, workerName);
});

// Menu command
bot.command('menu', authHandler.checkAuth, authHandler.showMainMenu);

// Help command
bot.command('help', (ctx) => {
    const helpMessage = `🤖 *Bot Cloudflare Workers Help*

*Commands:*
/start - Mulai bot dan proses login
/menu - Tampilkan menu utama
/help - Tampilkan bantuan ini

*Fitur:*
🚀 *DeployGit* - Deploy worker dari GitHub repository
📂 *UploadJS* - Upload dan deploy file JavaScript
📜 *ListWrk* - Lihat daftar workers
🗑️ *DelWrk* - Hapus worker

*Format GitHub URL yang didukung:*
- https://github.com/user/repo
- github.com/user/repo  
- user/repo

*Persyaratan:*
- API Token Cloudflare
- Account ID Cloudflare
- Zone ID Cloudflare

*Catatan:*
- Bot akan otomatis mencari file utama (index.js, worker.js, dll)
- Mendukung repository dengan dan tanpa wrangler.toml
- Semua data disimpan secara lokal dan aman`;

    ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Text message handler for multi-step flows
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const user = database.getUser(userId);
    
    if (!user || !user.currentStep) {
        return;
    }

    switch (user.currentStep) {
        case 'waiting_api_token':
            await authHandler.handleApiToken(ctx);
            break;
        case 'waiting_account_id':
            await authHandler.handleAccountId(ctx);
            break;
        case 'waiting_zone_id':
            await authHandler.handleZoneId(ctx);
            break;
        case 'deploy_git_name':
            await workersHandler.handleDeployGitName(ctx);
            break;
        case 'deploy_git_repo':
            await workersHandler.handleDeployGitRepo(ctx);
            break;
        case 'upload_js_name':
            await workersHandler.handleUploadJSName(ctx);
            break;
        case 'upload_js_file':
            await workersHandler.handleUploadJSFile(ctx);
            break;
    }
});

// Document handler for file uploads
bot.on('document', async (ctx) => {
    const userId = ctx.from.id;
    const user = database.getUser(userId);
    
    if (user && user.currentStep === 'upload_js_file') {
        await workersHandler.handleUploadJSFile(ctx);
    }
});

// Cleanup old temp directories on startup
githubService.cleanupOldTempDirs();

// Periodic cleanup (every hour)
setInterval(() => {
    githubService.cleanupOldTempDirs();
}, 60 * 60 * 1000);

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    bot.stop('SIGTERM');
    process.exit(0);
});

// Start bot
const PORT = process.env.PORT || 3000;

console.log('🤖 Starting Cloudflare Workers Telegram Bot...');

// Use webhook if domain is provided, otherwise use polling
if (process.env.WEBHOOK_DOMAIN) {
    console.log(`📡 Bot will run with webhook on port ${PORT}`);
    bot.launch({
        webhook: {
            domain: process.env.WEBHOOK_DOMAIN,
            port: PORT
        }
    }).then(() => {
        console.log('✅ Bot started successfully with webhook!');
    }).catch((error) => {
        console.error('❌ Failed to start bot with webhook:', error);
        process.exit(1);
    });
} else {
    console.log('📡 Bot will run with polling');
    bot.launch().then(() => {
        console.log('✅ Bot started successfully with polling!');
    }).catch((error) => {
        console.error('❌ Failed to start bot with polling:', error);
        process.exit(1);
    });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));