# ARCHITECTURE.md — PyWR Canvas

## Overview

PyWR Canvas is an Electron desktop app. All logic runs inside the Electron process —
no external servers, no Python backend, no network ports.

```
┌─────────────────────────────────────────────┐
│  Electron (Node.js)                          │
│                                              │
│  electron/main.js        — IPC handlers,     │
│                            file I/O,         │
│                            model validation  │
│  electron/pywr_schema.js — validation rules  │
│  electron/add_recorders.js — recorder logic  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  React renderer (Vite / TypeScript)  │   │
│  │                                      │   │
│  │  src/App.tsx           — root        │   │
│  │  src/hooks/            — state       │   │
│  │  src/components/       — UI          │   │
│  │  src/types/pywr.ts     — types       │   │
│  │  src/constants/        — node config │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## IPC API

The renderer calls `window.pywr.*` methods (defined in `electron/preload.js`).
These forward to `ipcMain.handle` handlers in `electron/main.js`.
There is no HTTP server — calls are direct in-process function calls.

| Method | What it does |
|--------|--------------|
| `openFile()` | Native file picker → returns `.json` path |
| `saveFile(path)` | Native save dialog → returns chosen path |
| `openImage()` | Native file picker → returns image path |
| `openCsv()` | Native file picker → returns `.csv` path |
| `readCsvColumns(path)` | Reads first CSV row → returns column names |
| `callApi(route, body)` | Dispatches to Node.js handler (see below) |
| `saveLayoutFile(path, content)` | Writes `.layout.json` sidecar |
| `readLayoutFile(path)` | Reads `.layout.json` sidecar |

---

## API routes (handled in Node.js, not HTTP)

All routes use the same request/response shape:
- Success: `{ ok: true, data: ... }`
- Failure: `{ ok: false, error: "..." }`

### POST /api/parse
```
Body:   { json_path: "/absolute/path/to/model.json" }
Return: { ok: true, data: { nodes, edges, parameters, recorders, timestepper, metadata } }
```
Reads and parses a Pywr JSON file from disk.

### POST /api/validate
```
Body:   { model: { ...full pywr model... } }
Return: { ok: true, data: { warnings: [...], errors: [...] } }
```
Validates the in-memory model. Checks: unconnected nodes, missing required fields,
invalid node types, duplicate names, orphaned edges, unreachable demands.

### POST /api/add-recorders
```
Body:   { model: { ...full pywr model... } }
Return: { ok: true, data: { model: {...}, added: [...] } }
```
Adds NumpyArray recorders to nodes that lack one. Does not write to disk.

### POST /api/export
```
Body:   { model: { ...full pywr model... }, output_path: "/absolute/path/..." }
Return: { ok: true, data: { written_to: "/absolute/path/..." } }
```
Validates the model, then writes Pywr JSON to disk. Blocks on errors.

---

## Data flow

```
User opens file
  → window.pywr.openFile()           [native dialog]
  → window.pywr.callApi('/api/parse') [reads + parses JSON]
  → usePywrJson stores model in React state
  → useLayout reads .layout.json sidecar (node positions)
  → Canvas renders from React state

User edits node on canvas
  → usePywrJson.updateNode()          [updates React state]
  → ValidationBar re-validates automatically

User edits JSON tab
  → JsonEditor shows full model JSON in Monaco
  → "Apply Changes" → usePywrJson.replaceModel() [full model swap]

User saves
  → window.pywr.callApi('/api/export') [validates + writes model.json]
  → useLayout.saveLayout()             [writes .layout.json sidecar]
```

---

## Key files

| File | Role |
|------|------|
| `electron/main.js` | IPC handlers, API dispatch, file I/O |
| `electron/pywr_schema.js` | Validation rules (port of pywr_schema.py) |
| `electron/add_recorders.js` | Recorder injection logic |
| `electron/preload.js` | contextBridge — exposes `window.pywr.*` |
| `src/App.tsx` | Root component, wires all hooks and tabs |
| `src/hooks/usePywrJson.ts` | Model state management |
| `src/hooks/useLayout.ts` | Node positions, background image, layout sidecar |
| `src/components/Canvas.tsx` | ReactFlow canvas with viewport-synced background image |
| `src/components/JsonEditor.tsx` | Monaco JSON editor for parameters/recorders/tables |
| `src/components/PropertiesPanel.tsx` | Node field editor with CSV linking |
| `src/types/pywr.ts` | TypeScript interfaces for all Pywr node types |
| `src/constants/nodeTypes.ts` | Node colours, shapes, labels, defaults |
