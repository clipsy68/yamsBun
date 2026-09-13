# Yams Bun

Carnet de scor digital pentru Yams (variantă Yahtzee), construit ca aplicație React + Vite, ambalată cu Capacitor pentru Android.

## Dezvoltare

```bash
npm install
npm run dev       # server de dev, accesibil și în rețeaua locală (--host implicit din vite.config.ts)
npm test          # motorul de scor (src/lib) are 19 teste unitare
npm run build     # build de producție (dist/)
```

## Android (Capacitor)

```bash
npm run build
npx cap sync android
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
```

APK-ul de debug rezultă în `android/app/build/outputs/apk/debug/app-debug.apk`.

## Structură

- `src/lib/` — motorul de scor (tipuri, reguli de calcul, `localStorage` pentru istoric) — cod independent de UI, testat.
- `src/state/GameContext.tsx` — starea globală a jocului (reducer) și navigarea între ecrane.
- `src/screens/` — ecranele aplicației (Start, alegere prim jucător, tabel jucător, tabel general, final joc, istoric, reguli).
- `src/components/` — tabelul de scor reutilizabil, dialogul de completare a căsuțelor, tava de zaruri.
