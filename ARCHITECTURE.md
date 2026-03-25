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
