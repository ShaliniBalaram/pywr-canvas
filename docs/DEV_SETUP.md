# DEV_SETUP.md — PyWR Canvas development setup

## Prerequisites

| Tool    | Required version | Check command    |
|---------|------------------|------------------|
| Node.js | 18.x or 20.x     | `node --version` |
| npm     | 9.x or higher    | `npm --version`  |
| Git     | any recent       | `git --version`  |

No Python required to run or build the editor.

---

## One-time setup

```bash
# 1. Clone the repo
git clone https://github.com/ShaliniBalaram/pywr-canvas.git
cd pywr-canvas

# 2. Install dependencies
npm install
```

---

## Running in development

```bash
npm run dev
```

One command. Starts the React dev server and launches the Electron window.

---

## Building a distributable

```bash
# Build React, then package with electron-builder
npm run build
```

Output is in `release/`:
- Mac: `PyWR Canvas-<version>.dmg`
- Windows: `PyWR Canvas Setup <version>.exe`

Users double-click the installer — no Node.js or Python needed on their machine.

---

## Type checking

```bash
npx tsc --noEmit
```

---

## Troubleshooting

**Electron window is blank / white**
The React dev server (port 3000) may not have started yet. Wait a few seconds and reload with Ctrl+R.

**`npm install` fails**
Check Node.js version: `node --version` — must be v18.x or v20.x.

**`npm run build` fails with "cannot find asset icon"**
You need `assets/icon.ico` (Windows) or `assets/icon.icns` (Mac) — the app icon.
Minimum 256×256px. Not included in the repo.

---

## Architecture overview

See `docs/ARCHITECTURE.md` for how the app is structured internally.

---

## Python (for simulation only)

Python is not needed for editing models. If you want to run PyWR simulations:

```bash
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
pip install pywr
```

The Run tab (coming in a future version) will use this environment.
