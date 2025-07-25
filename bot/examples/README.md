# 📁 Examples

Folder ini berisi contoh-contoh file yang bisa digunakan untuk testing bot.

## 📄 simple-worker.js

File worker sederhana dengan fitur:
- Homepage dengan informasi endpoints
- API endpoint `/api/hello` - JSON response
- API endpoint `/api/ip` - Informasi IP dan negara pengunjung

### Cara menggunakan:

1. **Via Upload JS:**
   - Pilih fitur `📂 UploadJS` di bot
   - Masukkan nama worker (contoh: `test-worker`)
   - Copy paste isi file `simple-worker.js` atau upload file tersebut

2. **Via Deploy Git:**
   - Fork repository ini ke GitHub Anda
   - Pilih fitur `🚀 DeployGit` di bot
   - Masukkan nama worker
   - Masukkan URL repository Anda

### Testing:

Setelah deploy berhasil, Anda bisa mengakses:
- `https://nama-worker.subdomain.workers.dev/` - Homepage
- `https://nama-worker.subdomain.workers.dev/api/hello` - JSON API
- `https://nama-worker.subdomain.workers.dev/api/ip` - IP Info API

## 🧪 Tips Testing

1. **Gunakan nama worker yang unik** untuk menghindari konflik
2. **Test semua endpoint** untuk memastikan worker berfungsi
3. **Cek logs di Cloudflare Dashboard** jika ada error
4. **Gunakan browser dev tools** untuk debug

## 🔧 Troubleshooting

- **Worker tidak bisa diakses:** Cek apakah deploy berhasil dan nama worker benar
- **Error 500:** Cek syntax JavaScript dan pastikan tidak ada error
- **Error 404:** Pastikan endpoint URL benar