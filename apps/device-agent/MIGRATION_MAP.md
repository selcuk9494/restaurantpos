# Migration Map

Bu harita, `printserver` reposundan `resto-platform` icindeki yeni resmi hedeflere tasinan alanlari kaydeder.

## Durum

- Tasima tamamlandi
- Resmi uygulama paketi: `resto-platform/apps/device-agent`
- Resmi operasyon dokumanlari: `resto-platform/docs/device-agent`
- `printserver` artik legacy referans repo konumundadir

## Klasor Eslemeleri

- `printserver/src` -> `resto-platform/apps/device-agent/src`
- `printserver/electron` -> `resto-platform/apps/device-agent/electron`
- `printserver/shared` -> `resto-platform/apps/device-agent/shared`
- `printserver/ingenico-worker` -> `resto-platform/apps/device-agent/ingenico-worker`
- `printserver/ingenico-runtime` -> `resto-platform/apps/device-agent/ingenico-runtime`
- `printserver/samples` -> `resto-platform/apps/device-agent/samples`
- `printserver/build-resources` -> `resto-platform/apps/device-agent/build-resources`

## Dosya Eslemeleri

- `printserver/index.html` -> `resto-platform/apps/device-agent/index.html`
- `printserver/vite.config.ts` -> `resto-platform/apps/device-agent/vite.config.ts`
- `printserver/tsconfig.json` -> `resto-platform/apps/device-agent/tsconfig.json`
- `printserver/tsconfig.app.json` -> `resto-platform/apps/device-agent/tsconfig.app.json`
- `printserver/tsconfig.node.json` -> `resto-platform/apps/device-agent/tsconfig.node.json`
- `printserver/tsconfig.electron.json` -> `resto-platform/apps/device-agent/tsconfig.electron.json`
- `printserver/package.json` -> `resto-platform/apps/device-agent/package.json` ve `resto-platform/package.json`

## Dokuman Eslemeleri

- `printserver/README.md` -> `resto-platform/README.md`
- `printserver/CANLIYA_ALMA.md` -> `resto-platform/docs/device-agent/CANLIYA_ALMA.md`
- `printserver/SAHA_KURULUM_NOTU.md` -> `resto-platform/docs/device-agent/SAHA_KURULUM_NOTU.md`
- `printserver/HIZLI_KURULUM_CHECKLIST.md` -> `resto-platform/docs/device-agent/HIZLI_KURULUM_CHECKLIST.md`
- `printserver/INGENICO_SETUP.md` -> `resto-platform/apps/device-agent/INGENICO_SETUP.md`

## Release ve Dagitim

- Build girisi: `resto-platform/package.json`
- Paketleme tanimi: `resto-platform/apps/device-agent/package.json`
- CI release rehberi: `resto-platform/docs/device-agent/CI_RELEASE.md`
- GitHub Actions workflow: `resto-platform/.github/workflows/device-agent-release.yml`

## Not

- Bu dosya tarihsel esleme kaydidir
- Yeni gelistirme `printserver` yerine dogrudan `resto-platform` icinde yapilmalidir
