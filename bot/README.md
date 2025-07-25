# 🤖 Cloudflare Workers Telegram Bot

Bot Telegram untuk mengelola Cloudflare Workers dengan mudah. Deploy dan kelola workers langsung dari Telegram!

## ✨ Fitur

- 🚀 **Deploy dari GitHub** - Deploy worker dari repository GitHub
- 📂 **Upload File JS** - Upload dan deploy file JavaScript langsung
- 📜 **List Workers** - Lihat daftar semua workers
- 🗑️ **Hapus Workers** - Hapus workers yang tidak diperlukan
- 🔐 **Autentikasi Aman** - Login dengan API Token Cloudflare
- 💾 **Session Management** - Data tersimpan secara lokal

## 🛠️ Instalasi

### 1. Clone Repository
```bash
cd bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan data berikut:
```env
BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
WEBHOOK_DOMAIN=your_domain_com (optional, untuk webhook)
```

### 4. Jalankan Bot
```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Setup Bot Telegram

1. Chat dengan [@BotFather](https://t.me/BotFather) di Telegram
2. Kirim `/newbot` dan ikuti instruksi
3. Salin token bot dan masukkan ke file `.env`

## 📋 Cara Penggunaan

### 1. Mulai Bot
Kirim `/start` ke bot untuk memulai proses setup.

### 2. Login
Bot akan meminta informasi berikut:
- **API Token Cloudflare** - Dapatkan dari [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
- **Account ID** - Ditemukan di dashboard Cloudflare
- **Zone ID** - ID zona domain Anda

### 3. Fitur Utama

#### 🚀 Deploy dari GitHub
1. Pilih tombol **DeployGit**
2. Masukkan nama worker
3. Masukkan URL repository GitHub
4. Bot akan otomatis clone dan deploy

**Format URL yang didukung:**
- `https://github.com/user/repo`
- `github.com/user/repo`
- `user/repo`

#### 📂 Upload File JS
1. Pilih tombol **UploadJS**
2. Masukkan nama worker
3. Upload file `.js` atau paste kode JavaScript
4. Bot akan deploy ke Cloudflare

#### 📜 List Workers
- Pilih tombol **ListWrk** untuk melihat semua workers
- Menampilkan nama dan URL worker

#### 🗑️ Hapus Workers
- Pilih tombol **DelWrk**
- Pilih worker yang ingin dihapus
- Konfirmasi penghapusan

## 🏗️ Struktur Project

```
bot/
├── config/
│   └── database.js          # Database lokal (JSON)
├── services/
│   ├── cloudflare.js        # API Cloudflare
│   └── github.js            # Git operations
├── handlers/
│   ├── auth.js              # Authentication
│   └── workers.js           # Workers management
├── data/
│   └── sessions.json        # User sessions
├── temp/                    # Temporary files
├── package.json
├── .env.example
├── README.md
└── index.js                 # Main bot file
```

## 🔐 Keamanan

- Data user disimpan secara lokal dalam file JSON
- API Token dienkripsi dan disimpan dengan aman
- Temporary files dibersihkan otomatis
- Session management yang aman

## 📝 Commands

- `/start` - Mulai bot dan login
- `/menu` - Tampilkan menu utama
- `/help` - Bantuan penggunaan

## 🚀 Deploy ke Production

### Menggunakan PM2
```bash
npm install -g pm2
pm2 start index.js --name "cloudflare-bot"
pm2 startup
pm2 save
```

### Menggunakan Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Bot tidak merespon
- Pastikan BOT_TOKEN sudah benar
- Cek koneksi internet
- Periksa log error di console

### Error saat deploy
- Pastikan API Token Cloudflare valid
- Cek Account ID dan Zone ID
- Pastikan repository GitHub dapat diakses publik

### File tidak ditemukan
- Bot mencari file: `index.js`, `worker.js`, `src/index.js`, `src/worker.js`
- Pastikan repository memiliki salah satu file tersebut

## 📚 API Reference

### Cloudflare Workers API
- [Workers API Documentation](https://developers.cloudflare.com/workers/platform/api/)
- [Authentication](https://developers.cloudflare.com/fundamentals/api/get-started/)

### Telegram Bot API
- [Telegraf.js Documentation](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 🤝 Contributing

1. Fork repository
2. Buat branch feature (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail.

## ⚠️ Disclaimer

- Gunakan bot ini dengan bijak
- Tidak untuk aktivitas ilegal
- Segala risiko ditanggung pengguna sendiri
- Developer tidak bertanggung jawab atas penyalahgunaan

## 📞 Support

Jika ada pertanyaan atau masalah, buat issue di repository ini.

---

**Happy Coding! 🚀**