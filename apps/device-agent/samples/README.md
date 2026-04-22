# Test Siparis Dosyalari

Bu klasor, canliya alma oncesi hizli smoke test icin hazir ornek siparis dosyalari icerir.

## Dosyalar

- `MUTFAK-202604210930.1`: yazi tabanli mutfak fis ornegi
- `BAR-202604210931.2`: JSON tabanli bar veya paket fis ornegi

## Neden Sonu `.1` veya `.2`

Parser, dosya adinin sonunda yazici numarasi bekler:

- `.1` => Yazici 1
- `.2` => Yazici 2

Bu nedenle dosya adinin sonuna ek uzanti koymayin.

Dogru:

- `MUTFAK-202604210930.1`
- `BAR-202604210931.2`

Yanlis:

- `MUTFAK-202604210930.1.txt`
- `BAR-202604210931.2.json`

## Kullanim

1. Uygulamada ilgili yazicilari aktif edin.
2. `Genel Ayarlar > Izlenecek klasor` alanini ayarlayin.
3. Bu klasorden bir ornek dosyayi izlenen klasore kopyalayin.
4. Dosyanin dogru yaziciya yonlendigini kontrol edin.
5. Basarili ise dosyanin arsive tasindigini dogrulayin.

## Oneri

Ilk testte once `MUTFAK-202604210930.1` dosyasini kullanin.
Text format sorun cikarmadan temel akisi daha hizli dogrular.
