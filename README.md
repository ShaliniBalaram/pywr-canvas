# PyWR Canvas

A desktop application for water engineers to open, draw, edit and validate [Pywr](https://github.com/pywr/pywr) water resource model JSON files.

Nodes are displayed on an interactive canvas that can be overlaid on a background map image. The app runs entirely on your local machine — no internet connection required.

---

## Features

- **Open & visualise** any Pywr model JSON — nodes and edges rendered automatically
- **Drag-and-drop** new nodes from the palette onto the canvas
- **Edit node properties** via the right-hand properties panel
- **Smart delete** — when deleting a node, choose how to reconnect its neighbours
- **Live validation** — errors and warnings appear in the status bar as you edit
- **Background map overlay** — load a PNG/JPG map image and set its opacity
- **Add recorders** — inject NumpyArray recorders to all nodes that lack one
- **Export** — save a clean, valid Pywr JSON back to disk
- **Layout sidecar** — node positions saved in a `.layout.json` file alongside the model, keeping the Pywr JSON untouched

---

## Requirements

| Tool    | Version      |
|---------|--------------|
| Node.js | 18.x or 20.x |
| Python  | **3.11.x exactly** |
| npm     | 9.x+         |

> Python must be 3.11 — Pywr has dependency constraints that are confirmed on 3.11.

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/ShaliniBalaram/pywr-canvas.git
cd pywr-canvas

# 2. Install Node dependencies
npm install

# 3. Create and activate a Python virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 4. Install Python dependencies
pip install flask flask-cors pywr pyinstaller

# 5. Verify Pywr installed correctly
python -c "import pywr; print(pywr.__version__)"
```

---

## Running in Development

You need two terminals open simultaneously.

**Terminal 1 — Python backend:**
```bash
.venv\Scripts\activate   # Windows
source .venv/bin/activate  # macOS/Linux

python python/server.py
# Should print: PyWR Canvas backend started on port 47821
```

**Terminal 2 — Electron + React:**
```bash
npm run dev
# Starts the React dev server, then launches the Electron window
```

The app window will open. If the Python backend is not running, the app will show an error dialog after 5 seconds.

---

## How to Use

### Opening a model
1. Click **Open** in the toolbar
2. Select a Pywr model `.json` file
3. Nodes and edges are drawn on the canvas automatically
4. If a `.layout.json` sidecar exists alongside the file, saved positions are restored; otherwise nodes are placed in a grid

### Editing nodes
- **Click** a node to select it and open its properties in the right panel
- Edit any field — changes apply when you click away (on blur)
- `name` and `type` fields are read-only

### Adding nodes
- Drag any node type from the left palette onto the canvas
- The new node is placed at the drop position
- Duplicate names are handled automatically (`Input`, `Input_2`, `Input_3`, …)

### Connecting nodes
- React Flow handles edges — drag from a node's bottom handle to another node's top handle to create a connection

### Deleting nodes
- Select a node and press **Delete**
- If the node has upstream/downstream neighbours, a dialog appears with reconnection options:
  - Connect upstream nodes directly to downstream nodes
  - Route upstream nodes to another existing node
  - Leave disconnected (flagged as validation warnings)

### Background map image
- Click **Load Map** in the toolbar
- Select a PNG or JPG image
- Use the **Opacity** slider (0.1 – 0.9) to control visibility
- The image path is saved in the `.layout.json` sidecar

### Validation
- The status bar at the bottom runs validation automatically as you edit (debounced 1 second)
- **Red** pills = errors (duplicate names, orphaned edges, missing required fields)
- **Amber** pills = warnings (unconnected nodes, missing recorders, unreachable demand nodes)
- Click any pill to highlight the offending node on the canvas

### Adding recorders
Call `POST /api/add-recorders` via the Flask API (or wire it to a toolbar button in a future release) to inject NumpyArray recorders to all nodes that lack one.

### Saving
- Click **Save** in the toolbar
- Choose a save location
- The model is validated before writing — files with errors are not saved
- Models with only warnings are saved
- A `.layout.json` sidecar is written alongside the model file

---

## Building the Windows .exe

All three steps must run in order:

```bash
# Step 1: Freeze Python backend
npm run build:python
# Produces: python/dist/pywr_backend.exe

# Step 2: Build React frontend
npm run build:react
# Produces: build/

# Step 3: Package with electron-builder
npm run build:electron
# Produces: release/PyWR Canvas Setup <version>.exe

# Or run all three in one command:
npm run build
```

> `assets/icon.ico` must exist before running `build:electron`. Minimum 256×256px ICO format.

---

## Running Tests

```bash
# Python API tests (18 tests)
pytest python/tests/ -v

# TypeScript type check
npx tsc --noEmit
```

---

## Project Structure

```
pywr-canvas/
├── electron/
│   ├── main.js          # Window creation, Python spawn, IPC handlers
│   └── preload.js       # contextBridge — exposes window.pywr.* to renderer
├── src/
│   ├── App.tsx          # Root component — wires all hooks and components
│   ├── components/
│   │   ├── Canvas.tsx          # React Flow canvas
│   │   ├── PywrNode.tsx        # Custom node renderer
│   │   ├── NodePalette.tsx     # Drag-and-drop node palette
│   │   ├── PropertiesPanel.tsx # Node field editor
│   │   ├── DeleteNodeDialog.tsx# Smart delete modal
│   │   ├── ValidationBar.tsx   # Live validation status bar
│   │   └── Toolbar.tsx         # Top toolbar
│   ├── hooks/
│   │   ├── usePywrJson.ts  # Model state management
│   │   └── useLayout.ts    # Node positions and background image
│   ├── constants/
│   │   └── nodeTypes.ts    # Colours, shapes, labels, defaults per node type
│   └── types/
│       └── pywr.ts         # TypeScript interfaces matching Pywr JSON schema
├── python/
│   ├── server.py           # Flask backend (port 47821)
│   ├── pywr_schema.py      # Node schema validation
│   ├── add_recorders.py    # Recorder injection logic
│   ├── pywr_canvas.spec    # PyInstaller build spec
│   └── tests/
│       ├── test_e2e.py     # End-to-end API tests
│       └── fixtures/
│           └── minimal_model.json
├── .github/workflows/
│   └── build.yml           # Automated Windows .exe build on version tags
├── ARCHITECTURE.md         # API contracts and data flow
├── PYWR_SCHEMA.md          # Pywr node type reference
└── DEV_SETUP.md            # Detailed setup instructions
```

---

## Automated Releases

Pushing a version tag triggers the GitHub Actions workflow to build a Windows installer and attach it to the release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `.exe` will appear under **Releases** on GitHub once the workflow completes.

---

## Tech Stack

| Layer    | Technology                     |
|----------|-------------------------------|
| Desktop  | Electron 28                   |
| Frontend | React 18 + TypeScript         |
| Canvas   | React Flow 11                 |
| Backend  | Python 3.11 + Flask           |
| Packaging| PyInstaller + electron-builder|
| Tests    | pytest                        |
