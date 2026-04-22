# Device Agent

Bu klasor, `resto-platform` icindeki Windows-native cihaz ajanidir.

## Kapsam

- yazici yonetimi
- klasor izleme
- bridge HTTP
- Ingenico entegrasyonu
- terminal kaydi ve heartbeat
- saha kurulum ve dagitim dosyalari

## Durum

Bu paket artik iskelet seviyesinde degil; renderer, Electron, `ingenico-worker`, smoke test ornekleri ve dagitim metadata'si burada toplandi.

## Temel Komutlar

Monorepo kokunden:

```bash
pnpm --filter @resto/device-agent build
```

Windows dagitimi icin:

```bash
pnpm --filter @resto/device-agent dist:win:x64
```

## Dokumanlar

- `../../docs/device-agent/CANLIYA_ALMA.md`
- `../../docs/device-agent/SAHA_KURULUM_NOTU.md`
- `../../docs/device-agent/HIZLI_KURULUM_CHECKLIST.md`
- `../../docs/device-agent/CI_RELEASE.md`
- `../../docs/device-agent/RELEASE_RUNBOOK.md`
- `./INGENICO_SETUP.md`
