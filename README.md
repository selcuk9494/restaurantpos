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
