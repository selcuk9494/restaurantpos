# Resto Platform

Bu repo ana restoran urununu ve ona bagli cihaz katmanlarini ayni monorepo altinda toplar.

## Uygulamalar

- `apps/pos-web`: ana POS ve operasyon arayuzu
- `apps/device-agent`: yazici, klasor izleme, bridge API, terminal kaydi ve Ingenico iceren Windows-native cihaz ajani

## Hizli Komutlar

```bash
pnpm build:device-agent
```

```bash
pnpm dist:device-agent:mac
```

```bash
pnpm dist:device-agent:win:x64
```

## Mac'te POS Acilis

1. Docker Desktop'i ac ve `resto-pos-db` container'inin calistigindan emin ol.
2. Ilk kurulumda `services/api/.env.example` dosyasini `services/api/.env` olarak kopyala.
3. Gerekirse veritabani senkronizasyonu icin `pnpm --filter @resto/api exec prisma db push` calistir.
4. Demo veri icin `pnpm --filter @resto/api db:seed` calistir.
5. API ve POS ekranini birlikte baslatmak icin `pnpm dev:pos-stack` calistir.
6. Tarayicida `http://localhost:4173/` adresini ac.
7. Giris bilgisi: `admin@resto.local` / `Admin123!`

## Device Agent Dokumanlari

- `docs/device-agent/CANLIYA_ALMA.md`
- `docs/device-agent/SAHA_KURULUM_NOTU.md`
- `docs/device-agent/HIZLI_KURULUM_CHECKLIST.md`
- `docs/device-agent/CI_RELEASE.md`
- `docs/device-agent/RELEASE_RUNBOOK.md`
- `apps/device-agent/INGENICO_SETUP.md`

## Mevcut Yapi

- Kullaniciya tek urun hissi veren ana repo `resto-platform`tur
- `device-agent` ayri urun degil, ana sistemin cihaz ve runtime parcasi olarak konumlanir

## Mac'te POS Desktop

```bash
pnpm dist:pos:mac
```

Desktop uygulamasi `apps/pos-web/release/mac/` altina cikar. Uygulama acilirken yerel API'yi otomatik baslatmayi dener. Bunun icin yalnizca Docker ve `resto-pos-db` veritabani hazir olmalidir. Gelistirme modunda masaustu acmak icin:

```bash
pnpm dev:pos-desktop
```


## POS Desktop Release

```bash
git tag pos-v0.1.0
git push origin pos-v0.1.0
```

Bu tag `POS Desktop Release` workflow'unu tetikler ve `resto-pos-*-arm64.zip` paketini GitHub Releases'a yukler.

