# 📚 Kitap Takas Platformu

Kitap Takas Platformu, kitapseverlerin kütüphanelerindeki kitapları diğer kullanıcılarla güvenli ve interaktif bir şekilde takas etmelerini sağlayan hafif ve hızlı bir web uygulamasıdır.

## 🌟 Projenin Amacı

Bu proje, sürdürülebilir okuma alışkanlıklarını teşvik etmek ve paylaşım ekonomisine katkıda bulunmak amacıyla geliştirilmiştir. Kullanıcılar yeni kitaplar satın almak yerine, okudukları kitapları sisteme ekleyerek yeni maceralara ücretsiz yelken açabilirler.

## 🚀 Temel Özellikler

### 👤 Kullanıcı ve Profil Yönetimi
- **Kayıt ve Giriş:** Güvenli kimlik doğrulama sistemi
- **Kişisel Kütüphane:** Kullanıcıların sahip oldukları, takasa açık ve daha önce takas ettikleri kitapların listelendiği dinamik profil sayfası

### 📖 Kitap Yönetimi ve Keşfet
- **Detaylı Kitap Ekleme:** Kitap adı, yazar, yayınevi, kondisyon (Yeni, Yıpranmış vb.) ve açıklama bilgileriyle sisteme kitap dahil etme
- **Akıllı Arama ve Filtreleme:** Tür, yazar veya kitap ismine göre anlık (real-time) arama yapabilme
- **Katalog Görünümü:** Sisteme eklenen son kitapların sergilendiği dinamik keşfet sayfası

### 🔄 Takas Mekanizması (Çekirdek İşlev)
1. **İstek Gönderme:** Kullanıcı A, Kullanıcı B'nin kitabını beğenir ve takas isteği yollar
2. **Kütüphane İncelemesi:** Kullanıcı B'ye bir bildirim gider. Kullanıcı B, Kullanıcı A'nın kütüphanesini açar ve karşılığında alabileceği bir kitap seçer
3. **El Sıkışma (Handshake):** Her iki taraf da karşılıklı kitapları onayladığında takas "Eşleşti" statüsüne geçer

## 🛠️ Teknoloji Yığını

### Frontend (İstemci Tarafı)
- **HTML5:** Semantik web yapısı
- **CSS3:** Flexbox/Grid mimarisi, tamamen özel yazılmış duyarlı (responsive) tasarım (harici kütüphane kullanılmamıştır)
- **JavaScript (Vanilla JS):** DOM manipülasyonu, Event Listener yönetimi ve Backend ile asenkron (AJAX/Fetch) haberleşme

### Backend & Veritabanı
- **Sunucu / API:** **Python (Flask)**
- **Veritabanı:** **SQLite** (Sunucusuz, tek dosya halinde çalışan, ilişkisel veritabanı. Geliştirme ve dağıtım kolaylığı için tercih edilmiştir)

## 📦 Kurulum

### Gereksinimler
- Python 3.8+
- pip (Python paket yöneticisi)

### Adım 1: Projeyi Klonlama
```bash
git clone <repository-url>
cd "Kitap Takas Platformu"
```

### Adım 2: Sanal Ortam Oluşturma
```bash
python -m venv venv
```

### Adım 3: Sanal Ortamı Aktifleştirme
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

### Adım 4: Bağımlılıkları Yükleme
```bash
pip install -r requirements.txt
```

### Adım 5: Uygulamayı Çalıştırma
```bash
cd backend
python app.py
```

Uygulama `http://localhost:5000` adresinde çalışmaya başlayacaktır.

## 🗂️ Proje Yapısı

```
Kitap Takas Platformu/
├── backend/
│   └── app.py                 # Flask ana uygulama dosyası
├── static/
│   ├── css/
│   │   └── style.css          # Özel CSS stilleri
│   └── js/
│       └── script.js          # Frontend JavaScript fonksiyonları
├── templates/
│   └── index.html            # Ana sayfa şablonu
├── requirements.txt           # Python bağımlılıkları
└── README.md                  # Proje dokümantasyonu
```

## 🔧 API Endpoints

### Kullanıcı İşlemleri
- `POST /register` - Kullanıcı kaydı
- `POST /login` - Kullanıcı girişi
- `GET /logout` - Çıkış yapma
- `GET /api/check-auth` - Auth durum kontrolü

### Kitap İşlemleri
- `GET /api/books` - Tüm kitapları listele
- `POST /api/books` - Yeni kitap ekle
- `GET /api/my-books` - Kullanıcının kitaplarını listele
- `GET /api/search-books` - Kitap arama

### Takas İşlemleri
- `POST /api/swap-request` - Takas isteği gönder
- `POST /api/swap-respond` - Takas isteğine yanıt ver
- `GET /api/my-swaps` - Kullanıcının takaslarını listele

## 🎨 Tasarım Özellikleri

- **Responsive Tasarım:** Mobil, tablet ve masaüstü cihazlarda mükemmel görünüm
- **Modern UI:** Gradient renkler, yumuşak gölgeler ve akıcı animasyonlar
- **Erişilebilirlik:** WCAG standartlarına uygun, erişilebilir arayüz
- **Toast Bildirimleri:** Kullanıcı dostu bildirim sistemi
- **Modal Pencereler:** Modern ve kullanışlı modal arayüzleri

## 🔒 Güvenlik

- **Şifre Hashleme:** Werkzeug kullanarak güvenli şifre saklama
- **Session Yönetimi:** Güvenli oturum yönetimi
- **XSS Koruması:** HTML escaping ile XSS saldırılarına karşı koruma
- **CSRF Koruması:** Flask'in built-in CSRF koruması

## 🚀 Geliştirme

### Yeni Özellikler Ekleme
1. Backend için `backend/app.py` dosyasında yeni endpoint'ler oluşturun
2. Frontend için `static/js/script.js` dosyasında yeni fonksiyonlar ekleyin
3. UI değişiklikleri için `static/css/style.css` dosyasını güncelleyin

### Veritabanı Migrasyonları
Veritabanı şemasında değişiklik yapmak için:
1. Mevcut veritabanı dosyasını yedekleyin (`kitap_takas.db`)
2. `backend/app.py` dosyasında model değişikliklerini yapın
3. Uygulamayı yeniden başlatın (otomatik olarak yeni tablolar oluşturulacaktır)

## 📱 Ekran Görüntüleri

*(Uygulama çalıştırıldığında ekran görüntüleri eklenebilir)*

## 🤝 Katkıda Bulunma

1. Projeyi fork'layın
2. Yeni bir özellik dalı oluşturun (`git checkout -b ozellik/yeni-ozellik`)
3. Değişikliklerinizi commit'leyin (`git commit -am 'Yeni özellik eklendi'`)
4. Dalı push'layın (`git push origin ozellik/yeni-ozellik`)
5. Bir Pull Request oluşturun

## 📄 Lisans

Bu proje MIT Lisansı altında dağıtılmaktadır.

## 📞 İletişim

Proje hakkında sorularınız için:
- E-posta: [your-email@example.com]
- GitHub Issues: [repository-url]/issues

## 🙏 Teşekkürler

Bu proje, açık kaynak topluluğuna ve sürdürülebilir okuma kültürüne katkıda bulunmak amacıyla geliştirilmiştir.
