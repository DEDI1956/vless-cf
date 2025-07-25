#!/bin/bash

echo "🤖 Starting Cloudflare Workers Telegram Bot..."
echo "═══════════════════════════════════════════════"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ File .env tidak ditemukan!"
    echo "📝 Silakan salin .env.example ke .env dan isi dengan token bot Anda:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Check if BOT_TOKEN is set
if ! grep -q "BOT_TOKEN=" .env || grep -q "BOT_TOKEN=your_telegram_bot_token_here" .env; then
    echo "❌ BOT_TOKEN belum diatur!"
    echo "📝 Silakan edit file .env dan masukkan token bot Telegram Anda."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data
mkdir -p temp

echo "✅ Environment check passed"
echo "🚀 Starting bot..."
echo ""

# Start the bot
npm start