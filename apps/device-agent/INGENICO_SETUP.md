# Ingenico Setup

Bu paket icindeki Ingenico entegrasyonu dogrudan iPad veya tarayici icinde calismaz.

## Neden

- Ingenico SDK katmani `GMPSmartDLL.dll` tabanlidir
- Bu DLL yalnizca `Windows` uzerinde calisir
- Bu nedenle iPad ancak uzaktaki bir Windows `device-agent`'a baglanan istemci olabilir

## Desteklenen Mimari

- `React UI`: ayarlar ve manuel test
- `Electron main`: IPC ve worker cagri katmani
- `ingenico-worker`: Windows sidecar `.NET` process
- `ingenico-runtime`: GMP runtime dosyalari

## Gerekli Dosyalar

`ingenico-runtime` klasorune asagidaki dosyalari koyun:

- `GMPSmartDLL.dll`
- `GMP.XML`
- `GMP3Mesajlar.txt`
- SDK'nin istedigi diger DLL dosyalari

Kaynak referansi:

- `/Users/selcukyilmaz/github/proje/kiosk/Kiosk.App/IngenicoRuntime`

## Gelistirme

Monorepo kokunden worker derleme:

```bash
pnpm --filter @resto/device-agent build:ingenico-worker
```

Windows worker publish:

```bash
pnpm --filter @resto/device-agent publish:ingenico-worker:win-x64
```

## Dagitim

Windows x64 paket:

```bash
pnpm --filter @resto/device-agent dist:win:x64
```

Bu komut:

- Electron uygulamasini build eder
- Ingenico worker'i publish eder
- `ingenico-runtime` ve worker ciktilarini pakete dahil eder

## iPad Senaryosu

Dogrudan iPad icinde:

- hayir

Dolayli kullanim:

- evet

Model:

- iPad uygulamasi veya web ekrani
- Windows uzerindeki `device-agent`
- Ingenico cihazina bagli worker

Yani iPad sadece UI olur, odeme komutu Windows tarafina gider.
