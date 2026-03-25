# TASKS.md — PyWR Canvas

## How this file works

- Each task is one Claude Code session
- Claude reads the first `[ ]` task, does ONLY that task, marks it `[x]`, then stops
- Every task is fully self-contained — no task relies on memory from a previous session
- "Read first" lists files that must be read before writing any code for that task
- "Produces" lists every file that must exist when the task is marked done
- "Acceptance criteria" are the exact checks that confirm the task is complete

---

## Task index

| # | Task | Status |
|---|------|--------|
| 01 | Project scaffold — package.json, tsconfig, folder structure | [x] |
| 02 | PYWR_SCHEMA.md — document all real Pywr node types | [x] |
| 03 | Python types — pywr.ts and pywr_schema.py from schema | [x] |
| 04 | Flask server skeleton — all routes stubbed, port 47821 | [x] |
| 05 | Pywr JSON parser — usePywrJson.ts hook | [x] |
| 06 | Layout sidecar — useLayout.ts hook | [x] |
| 07 | Electron main — window, Python spawn, IPC | [x] |
| 08 | Node type constants — nodeTypes.ts, colour map, icons | [x] |
| 09 | React Flow canvas — Canvas.tsx with nodes and edges | [x] |
| 10 | Node palette — NodePalette.tsx, add node to canvas | [x] |
| 11 | Properties panel — PropertiesPanel.tsx, edit node fields | [x] |
| 12 | Smart delete dialog — DeleteNodeDialog.tsx | [x] |
| 13 | Validation bar — ValidationBar.tsx, live warnings | [x] |
| 14 | Background image overlay — load image, opacity slider | [x] |
| 15 | Flask route: POST /api/parse — parse and validate JSON | [x] |
| 16 | Flask route: POST /api/validate — full model validation | [x] |
| 17 | Flask route: POST /api/add-recorders — inject recorders | [x] |
| 18 | Flask route: POST /api/export — write clean Pywr JSON | [x] |
| 19 | PyInstaller build — freeze Python to pywr_backend.exe | [x] |
| 20 | electron-builder config — bundle exe, extraResources | [x] |
| 21 | GitHub Actions workflow — build .exe on tag push | [x] |
| 22 | End-to-end test — open real JSON, edit, export, validate | [x] |

---

---

## TASK 01 — Project scaffold

**Status:** [x]
**Completed:** All scaffold files created — package.json, tsconfig.json, .gitignore, electron stubs, React stubs, Python stubs, ARCHITECTURE.md, folder structure matches CLAUDE.md exactly.

**What to build:**
Initialise the full project folder structure with all config files.
No application logic yet — just the skeleton so every subsequent task
has the correct file locations to write into.

**Read first:**
- `CLAUDE.md` (project structure section)
- `ARCHITECTURE.md` (once created by this task, re-read it)

**Produces:**
- `package.json` — scripts: dev, build:react, build:python, build:electron, build
- `tsconfig.json` — strict mode, paths alias `@/` → `src/`
- `.gitignore` — node_modules, dist, release, __pycache__, *.pyc, python/dist
- `electron-builder.config.js` — stub, full config done in Task 20
- `electron/main.js` — stub with TODO comments matching ARCHITECTURE.md sections
- `electron/preload.js` — stub
- `src/App.tsx` — stub, renders `<div>PyWR Canvas loading</div>`
- `src/constants/nodeTypes.ts` — empty exports, filled in Task 08
- `src/components/.gitkeep`
- `src/hooks/.gitkeep`
- `src/types/pywr.ts` — empty, filled in Task 03
- `python/server.py` — stub, filled in Task 04
- `python/pywr_schema.py` — empty, filled in Task 03
- `python/add_recorders.py` — empty, filled in Task 17
- `python/tests/test_schema.py` — empty
- `assets/` — folder only, icon.ico added manually by developer
- `ARCHITECTURE.md` — written by this task (see content below)

**ARCHITECTURE.md content to write:**

```
# ARCHITECTURE.md — PyWR Canvas

## Python Flask backend

Base URL: http://localhost:47821/api

All routes accept and return JSON.
All routes return { "ok": true, "data": ... } on success.
All routes return { "ok": false, "error": "..." } on failure.
HTTP status is always 200 — errors are in the response body.

### Routes

POST /api/parse
  Body:   { "json_path": "/absolute/path/to/model.json" }
  Return: { "ok": true, "data": { "nodes": [...], "edges": [...],
            "parameters": {...}, "recorders": {...}, "timestepper": {...} } }
  Does:   Reads and parses the Pywr JSON file from disk.
          Validates structure against pywr_schema.py.
          Returns normalised node/edge lists.

POST /api/validate
  Body:   { "model": { ...full pywr model object... } }
  Return: { "ok": true, "data": { "warnings": [...], "errors": [...] } }
  Does:   Validates the in-memory model object (not a file).
          Checks: unconnected nodes, missing required fields,
          invalid node types, duplicate node names, orphaned edges.

POST /api/add-recorders
  Body:   { "model": { ...full pywr model object... } }
  Return: { "ok": true, "data": { "model": { ...model with recorders added... },
            "added": [ { "recorder_type": "...", "node": "..." }, ... ] } }
  Does:   Adds appropriate NumpyArray recorders to all nodes that lack one.
          Uses type-aware defaults (deficit recorder on _DC nodes, etc).
          Does NOT write to disk — returns the modified model object.

POST /api/export
  Body:   { "model": { ...full pywr model object... },
            "output_path": "/absolute/path/to/output.json" }
  Return: { "ok": true, "data": { "written_to": "/absolute/path/..." } }
  Does:   Validates the model, then writes clean Pywr JSON to output_path.
          The layout sidecar (.layout.json) is written by the frontend,
          not by this route.

## Electron ↔ React communication

Uses contextBridge (preload.js). React calls window.pywr.* methods.
These are defined in preload.js and forward to ipcRenderer.

window.pywr.openFile()         → opens native file picker, returns path string
window.pywr.saveFile(path)     → opens native save picker, returns path string
window.pywr.callApi(route, body) → calls Flask on localhost:47821, returns response

## Data flow

1. User opens file → window.pywr.openFile() → path sent to POST /api/parse
2. Parse response → usePywrJson hook stores model in React state
3. useLayout hook reads/writes .layout.json sidecar for node positions
4. Canvas renders from React state (not from files directly)
5. On save → POST /api/export writes model.json, frontend writes .layout.json
6. On validate → POST /api/validate, warnings shown in ValidationBar
```

**Acceptance criteria:**
- `npm install` runs without errors (all deps in package.json)
- `npm run dev` starts Electron (even if it just shows the stub text)
- `python python/server.py` starts Flask on port 47821 without errors
- Folder structure matches `CLAUDE.md` exactly
- No placeholder values in package.json (real name, real version, real scripts)

---

---

## TASK 02 — PYWR_SCHEMA.md

**Status:** [x]
**Completed:** PYWR_SCHEMA.md written from pywr source (nodes.py, domains/river.py, recorders docs). All 13 node types + 5 recorder types documented. Recorder name discrepancy noted.

**What to build:**
Write `PYWR_SCHEMA.md` — the single source of truth for every Pywr node type,
its required JSON fields, optional fields, and field types.
This file is referenced by every other task. It must contain only real Pywr
schema information. Do not invent fields.

**Read first:**
- `CLAUDE.md`
- Pywr documentation source of truth:
  The Pywr node types come from the pywr Python package.
  The authoritative list is the pywr source at:
  https://github.com/pywr/pywr/tree/main/pywr/nodes.py
  and https://github.com/pywr/pywr/tree/main/pywr/parameters/
  Read these before writing the schema.

**Produces:**
- `PYWR_SCHEMA.md`

**Content structure for PYWR_SCHEMA.md:**

```markdown
# PYWR_SCHEMA.md — Pywr node type schemas

## Source
All schemas derived from pywr Python package source code.
Version: [insert actual version used in this project]
Do not add fields that are not in the pywr source.

## Node types

### Input
Required fields: name, type
Optional fields: max_flow, min_flow, cost
JSON example:
{ "name": "Oakhanger_GW", "type": "Input", "max_flow": 5.0, "cost": -10 }

[... one section per real node type ...]

## Recorder types

### NumpyArrayNodeRecorder
[...]

## Unconfirmed fields
[any SCHEMA_GAP items from code go here]
```

**Acceptance criteria:**
- Every node type listed is a real Pywr node type (Input, Output, Link, Storage,
  River, RiverGauge, Catchment, AnnualVirtualStorage, VirtualStorage,
  RiverSplitWithGauge, PiecewiseLink, AggregatedNode, AggregatedStorage)
- Every field listed exists in the pywr source code
- No invented field names
- JSON examples are valid JSON (no trailing commas, no comments inside examples)
- File is referenced correctly in CLAUDE.md "Read first" sections

---

---

## TASK 03 — TypeScript and Python types from schema

**Status:** [x]
**Completed:** src/types/pywr.ts and python/pywr_schema.py written from PYWR_SCHEMA.md. All 13 node types + 5 recorder types have interfaces/dataclasses. tsc --noEmit passes. validate_model() import confirmed ok.

**What to build:**
Generate `src/types/pywr.ts` (TypeScript interfaces) and `python/pywr_schema.py`
(Python dataclasses + validation) directly from the content of `PYWR_SCHEMA.md`.
Both files must match each other exactly — the same fields, the same types,
the same required/optional distinction.

**Read first:**
- `CLAUDE.md`
- `PYWR_SCHEMA.md` (must exist, written in Task 02)
- `ARCHITECTURE.md`

**Produces:**
- `src/types/pywr.ts` — one TypeScript interface per node type
- `python/pywr_schema.py` — one Python dataclass per node type + validate_model()

**Rules:**
- TypeScript optional fields (`field?: type`) must match Python optional fields
  (fields with `default=None`)
- The `PywrModel` TypeScript interface must match the exact top-level Pywr JSON
  structure: `{ nodes, edges, parameters, recorders, timestepper, metadata? }`
- `validate_model(model_dict)` in pywr_schema.py returns a list of
  `ValidationIssue` objects (not raises, not prints)
- No `any` types in TypeScript

**Acceptance criteria:**
- `tsc --noEmit` passes with zero errors on src/types/pywr.ts
- `python -c "from python.pywr_schema import validate_model; print('ok')"` prints ok
- Every node type in PYWR_SCHEMA.md has a corresponding interface/dataclass
- `PywrModel` interface has no `any` fields

---

---

## TASK 04 — Flask server skeleton

**Status:** [x]
**Completed:** python/server.py written with all 4 POST routes stubbed. Correct response shapes, input validation, CORS for localhost:3000, startup log. All acceptance criteria verified.

**What to build:**
`python/server.py` — the Flask backend with all four routes from ARCHITECTURE.md
fully stubbed and returning correct response shapes. Routes are not yet
implemented — they return `{ "ok": true, "data": {} }` with the correct
keys but empty values. The goal is that the server starts, routes exist,
and response shapes are contractually correct.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md`
- `python/pywr_schema.py` (written in Task 03)

**Produces:**
- `python/server.py` — Flask app on port 47821, all 4 routes

**Rules:**
- Port must be exactly 47821 — read from `CLAUDE.md`, not hardcoded by memory
- All routes must accept POST only
- All responses must match the shape in ARCHITECTURE.md exactly
- CORS must be enabled for localhost:3000 (Electron renderer in dev mode)
- No route may crash on empty body — validate input and return `{ "ok": false }`
  with a descriptive error message
- Server must log startup: `PyWR Canvas backend started on port 47821`

**Acceptance criteria:**
- `python python/server.py` starts without errors
- `curl -X POST http://localhost:47821/api/parse -H "Content-Type: application/json"
  -d '{"json_path": ""}' ` returns `{ "ok": false, "error": "json_path is required" }`
- All 4 routes respond (even if stubbed)
- Server shuts down cleanly on Ctrl+C

---

---

## TASK 05 — usePywrJson hook

**Status:** [x]
**Completed:** src/hooks/usePywrJson.ts written with full hook API. All mutations are immutable, removeNode does not touch edges, getOrphanedNodes is a pure query, isDirty resets on markSaved(). tsc --noEmit passes.

**What to build:**
`src/hooks/usePywrJson.ts` — React hook that manages the loaded Pywr model
in React state. Handles opening a file, sending it to the Flask backend,
receiving the parsed model, and providing functions to mutate it
(add node, remove node, update node, add edge, remove edge).

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md` (POST /api/parse shape)
- `src/types/pywr.ts` (written in Task 03)

**Produces:**
- `src/hooks/usePywrJson.ts`

**Hook API (exact shape):**

```typescript
interface UsePywrJsonReturn {
  model: PywrModel | null
  isLoading: boolean
  error: string | null
  openFile: () => Promise<void>        // calls window.pywr.openFile() then /api/parse
  addNode: (node: PywrNode) => void
  removeNode: (nodeName: string) => void
  updateNode: (nodeName: string, updates: Partial<PywrNode>) => void
  addEdge: (from: string, to: string) => void
  removeEdge: (from: string, to: string) => void
  getNodeByName: (name: string) => PywrNode | undefined
  getEdgesForNode: (name: string) => Array<[string, string]>
  getOrphanedNodes: (removedName: string) => { upstream: string[], downstream: string[] }
  isDirty: boolean                     // true if model changed since last save
}
```

**Rules:**
- All mutations produce a new model object (immutable updates, use spread)
- `removeNode` must NOT update edges — the caller (DeleteNodeDialog) handles that
- `getOrphanedNodes` does not mutate state, it is a pure query
- `isDirty` starts false, becomes true on any mutation, resets to false on save
- No direct `fetch` calls — all API calls go through `window.pywr.callApi`

**Acceptance criteria:**
- `tsc --noEmit` passes
- `openFile` sets `isLoading` true during fetch and false after
- `getOrphanedNodes("X")` returns correct upstream/downstream lists
  given a model where X has 2 upstream nodes and 1 downstream node

---

---

## TASK 06 — useLayout hook

**Status:** [x]
**Completed:** src/hooks/useLayout.ts written. autoLayout places nodes in a 5-column grid at 200px/150px spacing from (100,100). Opacity clamped 0.1–0.9. loadLayout/saveLayout use window.pywr.readLayoutFile/saveLayoutFile. tsc --noEmit passes.

**What to build:**
`src/hooks/useLayout.ts` — manages node positions on the canvas.
Positions are stored in a `.layout.json` sidecar file (same folder as model.json,
same base name). This file is read/written by the frontend directly — it is
never sent to the Flask backend.

**Read first:**
- `CLAUDE.md`
- `src/types/pywr.ts`

**Produces:**
- `src/hooks/useLayout.ts`

**Layout sidecar format (exact):**

```json
{
  "version": 1,
  "nodes": {
    "Oakhanger_GW": { "x": 240, "y": 180 },
    "Oakhanger_WTW": { "x": 440, "y": 180 }
  },
  "backgroundImage": "/absolute/path/to/image.png",
  "backgroundOpacity": 0.4
}
```

**Hook API (exact shape):**

```typescript
interface UseLayoutReturn {
  positions: Record<string, { x: number; y: number }>
  backgroundImage: string | null
  backgroundOpacity: number
  setPosition: (nodeName: string, x: number, y: number) => void
  setBackgroundImage: (path: string) => void
  setBackgroundOpacity: (opacity: number) => void
  loadLayout: (modelJsonPath: string) => Promise<void>
  saveLayout: (modelJsonPath: string) => Promise<void>
  autoLayout: (nodes: string[]) => void   // grid layout, 200px spacing
}
```

**Rules:**
- `autoLayout` places nodes in a grid, 200px horizontal spacing, 150px vertical.
  Rows of 5 nodes. Top-left starts at x=100, y=100. No randomness.
- `loadLayout` reads `<baseName>.layout.json` — if file does not exist, calls
  `autoLayout` on all nodes in the model
- `saveLayout` writes the sidecar file via `window.pywr.saveLayoutFile`
- Background opacity must be clamped between 0.1 and 0.9

**Acceptance criteria:**
- `tsc --noEmit` passes
- `autoLayout(["A","B","C","D","E","F"])` places F at x=100, y=250 (second row)
- `setBackgroundOpacity(0.0)` stores 0.1 (clamped)
- `setBackgroundOpacity(1.0)` stores 0.9 (clamped)

---

---

## TASK 07 — Electron main process

**Status:** [ ]

**What to build:**
`electron/main.js` and `electron/preload.js`.
Main process: creates the BrowserWindow, spawns the Python backend,
kills it on quit, handles IPC for file dialogs.
Preload: exposes `window.pywr.*` API surface to the renderer via contextBridge.

**Read first:**
- `CLAUDE.md` (port 47821, Python spawn logic)
- `ARCHITECTURE.md` (window.pywr.* methods)

**Produces:**
- `electron/main.js`
- `electron/preload.js`

**window.pywr methods (exact, from ARCHITECTURE.md):**

```javascript
window.pywr.openFile()            // returns: string (absolute path) or null
window.pywr.saveFile(defaultPath) // returns: string (absolute path) or null
window.pywr.callApi(route, body)  // returns: { ok, data/error }
window.pywr.saveLayoutFile(path, content) // writes string to path, returns void
window.pywr.readLayoutFile(path)  // reads file, returns string or null
```

**Rules:**
- Python backend path logic must match CLAUDE.md exactly:
  - dev: `python python/server.py`
  - packaged: `path.join(process.resourcesPath, 'pywr_backend.exe')`
- Python process must be killed on `app.on('will-quit')` — no orphan processes
- BrowserWindow: width 1280, height 800, minWidth 900, minHeight 600
- No nodeIntegration in renderer — only contextBridge
- `callApi` must wait up to 5 seconds for backend to start before first call,
  retrying every 500ms. If backend does not start, show error dialog.

**Acceptance criteria:**
- App window opens when `npm run dev` is run
- Python process appears in Task Manager when app is running
- Python process is gone after app is closed
- `window.pywr.openFile()` opens a native file dialog
- `window.pywr.callApi('/api/validate', {})` returns a response (even an error)

---

---

## TASK 08 — Node type constants

**Status:** [ ]

**What to build:**
`src/constants/nodeTypes.ts` — the single source of truth for how each
Pywr node type is displayed on the canvas. Colour map, shape, display label,
default fields when a new node of that type is created.

**Read first:**
- `CLAUDE.md`
- `PYWR_SCHEMA.md` (for the exact list of node types)

**Produces:**
- `src/constants/nodeTypes.ts`

**Colour assignments (fixed, do not change, do not randomise):**

```
Input / Catchment     →  #3B8BD4  (blue)       shape: diamond
Link                  →  #EF9F27  (amber)       shape: rectangle
Output                →  #1D9E75  (teal)        shape: rectangle
Storage / Reservoir   →  #7F77DD  (purple)      shape: circle
River / RiverGauge    →  #5DCAA5  (light teal)  shape: rectangle, dashed border
AnnualVirtualStorage  →  #888780  (grey)        shape: rectangle, dashed border
VirtualStorage        →  #888780  (grey)        shape: circle, dashed border
AggregatedNode        →  #D85A30  (coral)       shape: hexagon
AggregatedStorage     →  #D85A30  (coral)       shape: circle
PiecewiseLink         →  #EF9F27  (amber)       shape: rectangle, thick border
RiverSplitWithGauge   →  #5DCAA5  (light teal)  shape: diamond
```

**Produces this exact export shape:**

```typescript
export const NODE_COLOUR_MAP: Record<string, string> = { ... }
export const NODE_SHAPE_MAP: Record<string, NodeShape> = { ... }
export const NODE_DEFAULT_FIELDS: Record<string, Partial<PywrNode>> = { ... }
export const NODE_DISPLAY_LABELS: Record<string, string> = { ... }
// e.g. "AnnualVirtualStorage" → "Annual Licence (VS)"
```

**Acceptance criteria:**
- `tsc --noEmit` passes
- Every node type in PYWR_SCHEMA.md has an entry in each map
- No `#000000` or `#ffffff` colour values
- No `Math.random()` anywhere in this file

---

---

## TASK 09 — Canvas component

**Status:** [ ]

**What to build:**
`src/components/Canvas.tsx` — the React Flow canvas. Renders nodes from
the model as draggable React Flow nodes. Renders edges. Handles node click
(opens PropertiesPanel), node drag (updates position in useLayout), and
background image rendering.

**Read first:**
- `CLAUDE.md`
- `src/types/pywr.ts`
- `src/constants/nodeTypes.ts` (Task 08, must exist)
- `src/hooks/usePywrJson.ts` (Task 05, must exist)
- `src/hooks/useLayout.ts` (Task 06, must exist)
- React Flow docs: https://reactflow.dev/docs/api/nodes/custom-nodes/

**Produces:**
- `src/components/Canvas.tsx`
- `src/components/PywrNode.tsx` — custom React Flow node component

**Rules:**
- Each React Flow node's `type` must correspond to a Pywr node type
- Node colour comes from `NODE_COLOUR_MAP[node.type]` — never hardcoded inline
- Node shape comes from `NODE_SHAPE_MAP[node.type]`
- Node label = node.name (not node.type)
- Dragging a node calls `setPosition(node.name, x, y)` from useLayout
- Canvas has a transparent background so the image shows through
- Background image rendered as an absolutely positioned `<img>` behind the
  React Flow canvas, with opacity from `backgroundOpacity`

**Acceptance criteria:**
- `tsc --noEmit` passes
- Opening a model JSON renders all its nodes on canvas
- Nodes are draggable and positions persist to layout sidecar
- Edges render between correct nodes

---

---

## TASK 10 — Node palette

**Status:** [ ]

**What to build:**
`src/components/NodePalette.tsx` — left sidebar. Shows all Pywr node types
as draggable tiles. Dragging a tile onto the canvas creates a new node of
that type at the drop position with default fields from `NODE_DEFAULT_FIELDS`.

**Read first:**
- `CLAUDE.md`
- `src/constants/nodeTypes.ts` (Task 08)
- `src/hooks/usePywrJson.ts` (Task 05)
- `PYWR_SCHEMA.md` (for required fields when creating a new node)

**Produces:**
- `src/components/NodePalette.tsx`

**Rules:**
- New node name must be unique — if user drops "Input" and "Input" already
  exists, name it "Input_2", then "Input_3", etc.
- New node gets default fields from `NODE_DEFAULT_FIELDS` only — no invented values
- Node is added to both the model (usePywrJson.addNode) and the canvas
  position (useLayout.setPosition) atomically — both updates happen together
- Palette groups node types: Sources (Input, Catchment), Treatment (Link ending
  in _WTW), Distribution (Link, PiecewiseLink), Demand (Output), Water Bodies
  (River, RiverGauge, Storage), Licence Tracking (AnnualVirtualStorage,
  VirtualStorage)

**Acceptance criteria:**
- `tsc --noEmit` passes
- Dragging "Input" twice produces "Input" and "Input_2" (not "Input" and "Input")
- New node appears on canvas at drag-drop position
- New node appears in model JSON (isDirty becomes true)

---

---

## TASK 11 — Properties panel

**Status:** [ ]

**What to build:**
`src/components/PropertiesPanel.tsx` — right sidebar. Shows all fields of
the selected node as editable form fields. Field types come from PYWR_SCHEMA.md.
Validates field values on change. Shows errors inline.

**Read first:**
- `CLAUDE.md`
- `PYWR_SCHEMA.md` (field types per node type)
- `src/types/pywr.ts`
- `src/hooks/usePywrJson.ts` (updateNode)

**Produces:**
- `src/components/PropertiesPanel.tsx`

**Rules:**
- Each field renders as: text input (string), number input (number),
  checkbox (boolean), or dropdown (enum fields)
- Field type comes from PYWR_SCHEMA.md — never guess the type from the value
- `name` field is always read-only (names are unique identifiers, editing
  a name would break all edges — this is a separate rename flow, not in scope)
- `type` field is always read-only (cannot change node type after creation)
- Changes call `updateNode` immediately on blur (not on every keystroke)
- Invalid values show inline error, do not update the model

**Acceptance criteria:**
- `tsc --noEmit` passes
- `max_flow` field renders as number input, not text input
- `name` field is disabled
- Invalid number (e.g. "abc" in max_flow) shows error and does not update model

---

---

## TASK 12 — Smart delete dialog

**Status:** [ ]

**What to build:**
`src/components/DeleteNodeDialog.tsx` — modal dialog that appears when the user
deletes a node. Analyses orphaned nodes, presents reconnection options,
shows a mini preview, then commits the deletion + reconnection atomically.

**Read first:**
- `CLAUDE.md` (smart delete flow description)
- `src/hooks/usePywrJson.ts` (getOrphanedNodes, removeNode, removeEdge, addEdge)
- `ARCHITECTURE.md`

**Produces:**
- `src/components/DeleteNodeDialog.tsx`

**Dialog flow (exact):**

```
1. User presses Delete key with a node selected (or right-click → Delete)
2. getOrphanedNodes(nodeName) is called
3. If no orphans → confirm dialog "Delete [name]? This cannot be undone."
4. If orphans exist → show reconnection dialog:

   "Deleting [name] disconnects:
    ↑ Upstream: [list of upstream node names]
    ↓ Downstream: [list of downstream node names]

    How should we handle the upstream nodes?
    ○ Connect each upstream node directly to each downstream node
    ○ Connect upstream nodes to an existing node: [dropdown of all nodes]
    ○ Leave disconnected (flagged as warnings)"

5. User selects an option → [Preview] button shows a mini text list:
   "Will add edges: A → C, B → C"
   "Will remove edges: A → [name], B → [name], [name] → C"

6. [Confirm Delete] button:
   - removeNode(nodeName)
   - removeEdge for each affected edge
   - addEdge for each new edge from chosen option
   All three operations batched — model updates once

7. [Cancel] button — no changes
```

**Rules:**
- Dialog is a proper modal (not inline) — but rendered in a normal-flow div
  with min-height so it contributes layout height (see CLAUDE.md design rules)
- No undo implemented in this task — out of scope
- Dropdown in option 2 must exclude the node being deleted

**Acceptance criteria:**
- `tsc --noEmit` passes
- Deleting a node with 2 upstream and 1 downstream shows all 3 in the dialog
- Choosing "connect directly" and confirming adds 2 new edges and removes 3 old ones
- Choosing "leave disconnected" and confirming removes 3 edges and adds 0

---

---

## TASK 13 — Validation bar

**Status:** [ ]

**What to build:**
`src/components/ValidationBar.tsx` — bottom status bar. Shows live counts of
errors and warnings. Calls POST /api/validate on every model change (debounced
1000ms). Clicking a warning highlights the relevant node on the canvas.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md` (POST /api/validate response shape)
- `src/hooks/usePywrJson.ts`

**Produces:**
- `src/components/ValidationBar.tsx`

**Warning types (from pywr_schema.py validate_model):**
- `UNCONNECTED_NODE` — node has no edges
- `MISSING_REQUIRED_FIELD` — node missing a field required by its type
- `DUPLICATE_NODE_NAME` — two nodes share the same name
- `ORPHANED_EDGE` — edge references a node name that does not exist
- `NO_RECORDER` — node has no recorder attached (warning, not error)
- `UNREACHABLE_DEMAND` — Output node has no upstream path to any Input node

**Rules:**
- Errors (DUPLICATE_NODE_NAME, ORPHANED_EDGE, MISSING_REQUIRED_FIELD) shown in red
- Warnings (UNCONNECTED_NODE, NO_RECORDER, UNREACHABLE_DEMAND) shown in amber
- Debounce: do not call /api/validate on every keystroke — wait 1000ms after last change
- Clicking a warning scrolls the canvas to that node and highlights it for 2s

**Acceptance criteria:**
- `tsc --noEmit` passes
- Adding a node with no edges shows UNCONNECTED_NODE warning within 1.5s
- Validation does not run more than once per second during rapid editing

---

---

## TASK 14 — Background image overlay

**Status:** [ ]

**What to build:**
Add background image loading and opacity control to the canvas.
User clicks "Load Map Image" in the toolbar → native file picker for PNG/JPG →
image renders behind the React Flow canvas → opacity slider controls visibility.

**Read first:**
- `CLAUDE.md`
- `src/hooks/useLayout.ts` (Task 06 — backgroundImage, backgroundOpacity)
- `src/components/Canvas.tsx` (Task 09 — where the image renders)

**Produces:**
- `src/components/Toolbar.tsx` — top bar with Open, Save, Load Map, opacity slider
- Updates to `src/components/Canvas.tsx` — renders background image

**Rules:**
- File picker filters to `.png`, `.jpg`, `.jpeg` only
- Image is rendered as an `<img>` element absolutely positioned behind React Flow
- Opacity slider: min 0.1, max 0.9, step 0.05 — matches useLayout clamp values
- Image path is stored in `.layout.json` via `setBackgroundImage` — not in model JSON
- If layout has no backgroundImage, no image element is rendered (no broken image icon)

**Acceptance criteria:**
- Loading a PNG shows it behind the network nodes
- Opacity slider moves from 0.1 to 0.9
- Image path survives a save/reload cycle (stored in .layout.json)
- No image = no `<img>` tag in the DOM at all

---

---

## TASK 15 — Flask route: POST /api/parse (full implementation)

**Status:** [ ]

**What to build:**
Fully implement `POST /api/parse` in `python/server.py`.
Reads a Pywr JSON file from disk, validates its structure, returns a
normalised response.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md` (route spec)
- `python/pywr_schema.py` (validate_model, node dataclasses)
- `PYWR_SCHEMA.md`

**Rules:**
- `json_path` must be an absolute path — reject relative paths with error
- File must exist — return error if not found
- JSON must be valid — return error if not parseable
- Return normalised nodes: each node object must have at minimum `name` and `type`
  even if the source JSON has extra or missing fields
- Do not modify the file — read only
- Log each parse: `Parsed: /path/to/model.json — 14 nodes, 18 edges`

**Acceptance criteria:**
- Sending a valid model.json returns all nodes and edges
- Sending a non-existent path returns `{ "ok": false, "error": "File not found: ..." }`
- Sending malformed JSON returns `{ "ok": false, "error": "Invalid JSON: ..." }`
- Sending a relative path returns `{ "ok": false, "error": "Path must be absolute" }`

---

---

## TASK 16 — Flask route: POST /api/validate (full implementation)

**Status:** [ ]

**What to build:**
Fully implement `POST /api/validate` in `python/server.py`.
Validates an in-memory model object using `validate_model()` from pywr_schema.py.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md`
- `python/pywr_schema.py` (validate_model, ValidationIssue)
- `PYWR_SCHEMA.md`

**ValidationIssue shape (exact):**

```python
@dataclass
class ValidationIssue:
    code: str          # e.g. "UNCONNECTED_NODE"
    severity: str      # "error" or "warning"
    node_name: str     # name of the offending node, or "" if model-level
    message: str       # human-readable description
```

**Acceptance criteria:**
- A model with a node that has no edges returns a UNCONNECTED_NODE warning
- A model with duplicate node names returns a DUPLICATE_NODE_NAME error
- A model with an edge referencing a non-existent node returns ORPHANED_EDGE error
- A valid model returns `{ "ok": true, "data": { "warnings": [], "errors": [] } }`

---

---

## TASK 17 — Flask route: POST /api/add-recorders (full implementation)

**Status:** [ ]

**What to build:**
Fully implement `POST /api/add-recorders` in `python/server.py`.
This is the `add_recorders.py` logic moved into a Flask route.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md`
- `python/add_recorders.py` (existing logic)
- `PYWR_SCHEMA.md` (recorder types)

**Recorder assignment rules (exact — from add_recorders.py):**

```
node type = Input, Catchment          → NumpyArrayNodeRecorder
node type = Link (not ending _WTW)    → NumpyArrayNodeRecorder
node type = Link (ending _WTW)        → NumpyArrayNodeRecorder
node type = Output (ending _DC)       → NumpyArrayNodeRecorder + NumpyArrayDeficitNodeRecorder
node type = Output (not ending _DC)   → NumpyArrayNodeRecorder
node type = Storage, Reservoir        → NumpyArrayStorageRecorder
node type = AnnualVirtualStorage      → NumpyArrayStorageRecorder + NumpyArrayNormalisedStorageRecorder
node type = River, RiverGauge         → NumpyArrayNodeRecorder
```

**Rules:**
- Do not add a recorder if one of the same type already exists for that node
- Recorder name = `f"{node_name}_recorder"` (for first recorder)
  `f"{node_name}_deficit_recorder"` (for deficit recorder)
  `f"{node_name}_normalised_recorder"` (for normalised storage recorder)
- Return both the modified model AND the list of what was added

**Acceptance criteria:**
- A model with no recorders returns all nodes with recorders added
- A model where some nodes already have recorders only adds to those that don't
- _DC output nodes get both NumpyArrayNodeRecorder and NumpyArrayDeficitNodeRecorder
- AnnualVirtualStorage nodes get both storage recorders

---

---

## TASK 18 — Flask route: POST /api/export (full implementation)

**Status:** [ ]

**What to build:**
Fully implement `POST /api/export` in `python/server.py`.
Validates the model, then writes a clean Pywr-compatible JSON to disk.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md`
- `python/pywr_schema.py`

**Rules:**
- Validate before writing — if there are errors (not warnings), do not write
  and return `{ "ok": false, "error": "Model has N errors — fix before exporting" }`
- Output JSON must be valid Pywr JSON: proper indentation (2 spaces),
  no trailing commas, nodes array not edges array
- `output_path` must be absolute — reject relative paths
- If file already exists, overwrite it (no backup in this task)
- Log: `Exported: /path/to/file.json — 14 nodes, 18 edges`

**Acceptance criteria:**
- Exporting a valid model writes a file that `json.load()` can parse
- Exporting a model with DUPLICATE_NODE_NAME error returns error, no file written
- Exporting with warnings (NO_RECORDER) writes the file anyway
- Exporting to a relative path returns error

---

---

## TASK 19 — PyInstaller build

**Status:** [ ]

**What to build:**
Configure PyInstaller to freeze `python/server.py` into `python/dist/pywr_backend.exe`.
Write a `python/pywr_canvas.spec` file (not just a CLI command) so the build
is reproducible.

**Read first:**
- `CLAUDE.md`
- `DEV_SETUP.md`
- `python/server.py`

**Produces:**
- `python/pywr_canvas.spec`
- Updated `package.json` — `build:python` script uses the spec file
- Updated `DEV_SETUP.md` — add build instructions

**Rules:**
- `--noconsole` so no terminal window appears when the exe runs
- `--onefile` so it is a single portable exe
- Include `python/pywr_schema.py` and `python/add_recorders.py` as data files
- Flask and all dependencies must be in `hiddenimports`
- The spec file must be committed — not generated each time

**Acceptance criteria:**
- `pyinstaller python/pywr_canvas.spec` produces `python/dist/pywr_backend.exe`
- Running `python/dist/pywr_backend.exe` starts the server on port 47821
- No console window appears when running the exe

---

---

## TASK 20 — electron-builder config

**Status:** [ ]

**What to build:**
Complete `electron-builder.config.js` with full Windows installer config.
`pywr_backend.exe` is included as an extraResource.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md` (resourcesPath logic in main.js)
- `electron/main.js` — getPythonPath() must match the extraResources target path

**Produces:**
- `electron-builder.config.js` (complete, not stub)

**Rules:**
- `extraResources.to` must be exactly `"pywr_backend.exe"` — this is what
  `path.join(process.resourcesPath, 'pywr_backend.exe')` resolves to
- NSIS installer: oneClick false, allow directory change, create desktop shortcut
- App icon: `assets/icon.ico` — developer provides this file manually
- Product name: `PyWR Canvas`
- appId: `com.pywrcanvas.app`

**Acceptance criteria:**
- `npm run build:electron` runs without errors (assuming pywr_backend.exe exists)
- Installer file appears in `release/` folder
- Installing the .exe and running it opens the app

---

---

## TASK 21 — GitHub Actions workflow

**Status:** [ ]

**What to build:**
`.github/workflows/build.yml` — triggers on version tags, builds the full .exe
and uploads it to the GitHub Release.

**Read first:**
- `CLAUDE.md`
- `package.json` (build scripts)
- `DEV_SETUP.md`

**Produces:**
- `.github/workflows/build.yml`

**Rules:**
- Trigger: `on: push: tags: ['v*']`
- Runner: `windows-latest`
- Steps: checkout → setup Python 3.11 → setup Node 18 → pip install →
  npm install → npm run build → upload release artifact
- Python version must be pinned (3.11) — not `latest`
- Node version must be pinned (18) — not `latest`
- The artifact upload step uses `release/*.exe`

**Acceptance criteria:**
- Pushing tag `v0.1.0` triggers the workflow
- Workflow produces a `.exe` file attached to the GitHub Release
- Workflow fails with a clear error if pywr is not installable (not silently succeeds)

---

---

## TASK 22 — End-to-end test

**Status:** [ ]

**What to build:**
A manual test script `tests/e2e_checklist.md` and an automated Python test
`python/tests/test_e2e.py` that exercises the full Flask API with a real
(minimal but valid) Pywr JSON fixture.

**Read first:**
- `CLAUDE.md`
- `ARCHITECTURE.md`
- `PYWR_SCHEMA.md`
- All completed Flask routes

**Produces:**
- `python/tests/test_e2e.py`
- `python/tests/fixtures/minimal_model.json` — a real minimal Pywr model
- `tests/e2e_checklist.md` — manual steps to verify the full app

**Rules for minimal_model.json:**
- Must be a valid Pywr JSON that pywr can actually load
- Must have: 1 Input node, 1 Link node, 1 Output node, 2 edges
- Must have a timestepper with real dates (not placeholder dates)
- Must have no recorders (so the add-recorders route has something to add)
- Node names must be realistic water system names, not "Node1", "test_input" etc.
  Use names like "Bordon_GW", "Bordon_WTW", "Bordon_DC"

**Acceptance criteria:**
- `pytest python/tests/test_e2e.py` passes with all tests green
- The fixture JSON passes `json.load()` without errors
- `/api/parse` on the fixture returns 3 nodes and 2 edges
- `/api/add-recorders` on the fixture adds exactly 3 recorders
- `/api/validate` on the fixture returns 0 errors
- `/api/export` on the fixture writes a file that `/api/parse` can re-read
