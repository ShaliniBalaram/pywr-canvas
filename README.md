# PyWR Canvas

A desktop application for water engineers to open, draw, edit and validate [Pywr](https://github.com/pywr/pywr) water resource model JSON files. Nodes are overlaid on a background map image on an interactive canvas.

Runs entirely on your local machine — no internet connection required.

---

## Quick Start

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install

# Terminal 1 — start the backend
python python/server.py

# Terminal 2 — launch the app
npm run dev
```

> Python **3.11** is required. See [docs/DEV_SETUP.md](docs/DEV_SETUP.md) for full setup instructions.

---

## Features

- **Open & visualise** any Pywr model JSON — nodes and edges drawn automatically
- **Drag-and-drop** new nodes from the palette onto the canvas
- **Edit node properties** — right-hand panel, changes applied on blur
- **Smart delete** — choose how to reconnect neighbours before removing a node
- **Live validation** — errors and warnings update in the status bar as you edit
- **Background map overlay** — load a PNG/JPG map and set opacity (0.1 – 0.9)
- **Add recorders** — inject NumpyArray recorders to all nodes that lack one
- **Export** — save a clean, valid Pywr JSON back to disk
- **Layout sidecar** — node positions stored in `.layout.json` alongside the model, keeping the Pywr JSON untouched
- **Automated .exe build** — GitHub Actions produces a Windows installer on each version tag

---

## Supported Node Types

**Core**
`Input` · `Output` · `Link` · `Storage` · `PiecewiseLink`

**River Domain**
`River` · `RiverGauge` · `Catchment` · `RiverSplitWithGauge`

**Virtual Storage / Licences**
`VirtualStorage` · `AnnualVirtualStorage`

**Aggregation**
`AggregatedNode` · `AggregatedStorage`

---

## Example

A worked Bordon groundwater network is provided in `examples/bordon_gw/`.

```bash
# With the backend running (python python/server.py):
python examples/bordon_gw/run_example.py
```

This parses the model, validates it, adds recorders, and exports the result — demonstrating the full API flow.

---

## Building the Windows .exe

```bash
# Freeze Python backend, build React frontend, package installer
npm run build
# Produces: release/PyWR Canvas Setup <version>.exe
```

`assets/icon.ico` must exist before building (256×256px ICO, provided manually).

See [docs/DEV_SETUP.md](docs/DEV_SETUP.md) for step-by-step build instructions.

---

## Automated Releases

Push a version tag to trigger the GitHub Actions build:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `.exe` installer is attached to the GitHub Release automatically.

---

## Project Structure

```
pywr-canvas/
├── electron/                   # Electron main process + preload
├── src/                        # React + TypeScript frontend
│   ├── components/             # Canvas, Palette, Properties, etc.
│   ├── hooks/                  # usePywrJson, useLayout
│   ├── constants/              # Node colours, shapes, defaults
│   └── types/                  # TypeScript interfaces
├── python/
│   ├── server.py               # Flask backend (port 47821)
│   ├── pywr_schema.py          # Schema validation
│   ├── add_recorders.py        # Recorder injection
│   ├── pywr_canvas.spec        # PyInstaller spec
│   └── tests/                  # pytest suite (18 tests)
├── examples/
│   └── bordon_gw/              # Worked example — GW abstraction network
├── docs/
│   ├── ARCHITECTURE.md         # API contracts and data flow
│   ├── PYWR_SCHEMA.md          # Pywr node type reference
│   ├── DEV_SETUP.md            # Detailed setup guide
│   ├── NODE_TYPES.md           # Visual representation rules
│   └── DECISIONS.md            # Architectural decision records
├── requirements.txt
└── package.json
```

---

## Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Desktop  | Electron 28                     |
| Frontend | React 18 + TypeScript           |
| Canvas   | React Flow 11                   |
| Backend  | Python 3.11 + Flask             |
| Packaging| PyInstaller + electron-builder  |
| Tests    | pytest                          |
