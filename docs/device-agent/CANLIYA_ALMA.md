# Device Agent Canliya Alma Rehberi

Bu rehber, `@resto/device-agent` paketini hedef Windows makinede canliya almak icin en kisa ve net operasyon adimlarini icerir.

## 1. Hangi Paket Alinacak

- Standart Intel/AMD Windows cihaz icin: `release/win-x64/resto-device-agent-0.1.0-x64.exe`
- ARM tabanli Windows cihaz icin: `release/win-arm64/resto-device-agent-0.1.0-arm64.exe`

Paketleri yeniden uretmek gerekirse monorepo kokunden:

```bash
pnpm --filter @resto/device-agent dist:win:x64
```

veya

```bash
pnpm --filter @resto/device-agent dist:win:arm64
```

## 2. Hedef Makine Gereksinimleri

- Windows ortaminda calisiyor olmali
- Yazicilar Windows tarafinda kurulu olmali
- Ingenico kullanilacaksa runtime dosyalari hazir olmali
- Izlenecek siparis klasorune okuma/yazma yetkisi olmali

Ingenico kullaniminda ayrica:

- `apps/device-agent/ingenico-runtime/` altina GMP runtime dosyalari kopyalanmali
- Gerekirse [../../apps/device-agent/INGENICO_SETUP.md](../../apps/device-agent/INGENICO_SETUP.md) izlenmeli

## 3. Kurulum Yeri

1. EXE dosyasini ornegin `C:\RestoDeviceAgent\` altina kopyalayin.
2. Uygulamayi ilk kez yonetici gerekmeden calistirin.
3. Gerekirse masaustu veya baslangic kisayolu olusturun.

## 4. Ilk Acilista Doldurulacak 7 Alan

1. `Genel Ayarlar > Izlenecek klasor`
2. `Genel Ayarlar > Basarili arsiv klasoru`
3. `Genel Ayarlar > Hatali arsiv klasoru`
4. `Terminal Kimligi > Sube adi ve terminal adi`
5. `Terminal Kimligi > Sube kodu ve terminal kodu`
6. `Yazicilar > Aktif printer eslesmeleri`
7. `Bridge API` veya gerekiyorsa `Terminal Kaydi > Admin panel URL`

## 5. Ilk Kayit ve Yedek

1. `Ayarlari Kaydet`
2. `Genel Ayarlar > Yedek ve Kurulum > Ayarlari Yedekle`
3. Ilk temiz yedegi paylasimli bir klasorde saklayin

## 6. 5 Dakikalik Smoke Test

1. Uygulamayi acin.
2. `Canliya Hazirlik` kartinda kritik eksik olmadigini kontrol edin.
3. `Yazicilar` alaninda aktif yazicilarin dolu oldugunu kontrol edin.
4. `Bridge API` adresini not edin.
5. `Izlemeyi Baslat` butonuna basin.
6. Izlenen klasore `samples/` altindaki test siparis dosyalarindan birini birakin.
7. Dosyanin dogru yaziciya gittigini dogrulayin.
8. Basarili ise dosyanin arsive tasindigini kontrol edin.
9. Hata olursa log ve `Hatali arsiv klasoru`nu kontrol edin.

Hazir ornekler:

- [../../apps/device-agent/samples/README.md](../../apps/device-agent/samples/README.md)
- [../../apps/device-agent/samples/MUTFAK-202604210930.1](../../apps/device-agent/samples/MUTFAK-202604210930.1)
- [../../apps/device-agent/samples/BAR-202604210931.2](../../apps/device-agent/samples/BAR-202604210931.2)

## 7. Canliya Alma Onayi

- `pnpm --filter @resto/device-agent build` temiz
- `Canliya Hazirlik` kartinda kritik eksik yok
- En az bir test fis basildi
- Arsiv klasorleri dogru calisiyor
- Bridge gerekiyorsa erisilebilir
- Ingenico gerekiyorsa test basarili
- Ayar yedegi alinmis
