# WordPress Docker Kurulumu

Bu proje, yerel geliştirme için Docker üzerinde çalışan bir WordPress ortamıdır.

## Gereksinimler

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Yüklü ve çalışıyor olmalı)

## Kurulum ve Başlatma

1. Docker Desktop uygulamasını başlatın.
2. Terminalde proje dizinine gelin.
3. Aşağıdaki komutu çalıştırın:

```bash
docker compose up -d
```

## Erişim

- **Web Sitesi:** [http://localhost:8000](http://localhost:8000)
- **Veritabanı Bilgileri:** `.env` dosyasında bulunmaktadır.

## Dosya Yapısı

- `docker-compose.yml`: Servis yapılandırmaları.
- `.env`: Veritabanı şifreleri ve kullanıcı bilgileri.
- `wp-content/`: Temalar ve eklentileriniz burada saklanır.
