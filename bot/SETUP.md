# 🚀 Quick Setup Guide

Panduan cepat untuk menjalankan bot Telegram Cloudflare Workers.

## ⚡ Quick Start

### 1. Setup Environment
```bash
# Copy environment file
cp .env.example .env

# Edit dengan token bot Anda
nano .env
```

### 2. Install & Run
```bash
# Install dependencies
npm install

# Jalankan bot
npm start

# Atau gunakan script
./start.sh
```

## 🔑 Dapatkan Token Bot

1. Buka [@BotFather](https://t.me/BotFather)
2. Kirim `/newbot`
3. Ikuti instruksi untuk membuat bot
4. Salin token dan masukkan ke `.env`

## 🌐 Dapatkan Cloudflare Credentials

### API Token
1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pergi ke **My Profile** → **API Tokens**
3. Klik **Create Token**
4. Pilih template **Edit Cloudflare Workers** atau **Custom Token**
5. Set permissions:
   - Account: `Cloudflare Workers:Edit`
   - Zone: `Zone:Read`
6. Salin token

### Account ID
1. Di dashboard Cloudflare, pilih domain Anda
2. Scroll ke bawah di sidebar kanan
3. Salin **Account ID**

### Zone ID  
1. Di dashboard Cloudflare, pilih domain Anda
2. Scroll ke bawah di sidebar kanan
3. Salin **Zone ID**

## 📋 File .env

```env
BOT_TOKEN=1234567890:ABCdefGhIjKlMnOpQrStUvWxYz
PORT=3000
WEBHOOK_DOMAIN=yourdomain.com (optional)
```

## ✅ Test Bot

1. Kirim `/start` ke bot
2. Ikuti proses login
3. Test fitur upload dengan file `examples/simple-worker.js`
4. Akses worker di `https://nama-worker.subdomain.workers.dev`

## 🛠️ Development

```bash
# Development mode dengan auto-reload
npm run dev

# Production mode
npm start

# Dengan PM2
pm2 start index.js --name cloudflare-bot
```

## 🔧 Troubleshooting

**Bot tidak merespon:**
- Cek BOT_TOKEN di `.env`
- Pastikan bot sudah di-start dengan BotFather

**Error saat deploy:**
- Cek API Token Cloudflare
- Pastikan Account ID dan Zone ID benar
- Repository GitHub harus public

**File tidak ditemukan:**
- Pastikan ada file `index.js` atau `worker.js` di repo
- Cek struktur folder repository

## 📞 Support

Jika ada masalah, buat issue di repository atau hubungi developer.

---

**Happy Coding! 🎉**