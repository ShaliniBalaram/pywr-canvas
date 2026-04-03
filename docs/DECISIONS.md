# DECISIONS.md — Architectural Decisions

Records significant design decisions made for PyWR Canvas and the reasoning behind them.

---

## D-01: No backend server

**Decision:** All model logic (parse, validate, export, add-recorders) runs in Electron's
Node.js main process. No Python backend, no Flask, no HTTP server, no ports.

**Reason:** The original Flask backend only did JSON manipulation and schema validation —
nothing that required Python specifically. Moving it to Node.js eliminates the cold-start
delay, removes Python as a user prerequisite, and shrinks the installer by ~150MB.
Python is still used for simulation (future Run tab) but not for editing.

---

## D-02: Layout sidecar file

**Decision:** Node positions are stored in `<model_name>.layout.json`, not inside the Pywr model JSON.

**Reason:** The Pywr model JSON is loaded by the Pywr Python library. Adding UI coordinates
to it would make it non-standard and potentially break `pywr.model.Model.load()`.
The sidecar keeps both files clean.

---

## D-03: Electron + React + Node.js

**Decision:** Electron for the desktop shell, React for the UI, Node.js for all editor logic.

**Reason:** React Flow is the best available drag-and-drop graph editor for React.
PyQt/Tkinter equivalents are significantly more limited. Node.js is already bundled
inside Electron — no extra runtime needed. Water engineers use Windows — the Electron
`.exe` installer is a familiar distribution format.

---

## D-04: Immutable state updates in React hooks

**Decision:** All model mutations in `usePywrJson.ts` produce new objects via spread.
No direct mutation of state.

**Reason:** React requires immutable updates for re-renders to work correctly.

---

## D-05: Smart delete — no undo in v1

**Decision:** The smart delete dialog confirms before committing. No undo after confirmation.

**Reason:** Undo requires a full command pattern and action history — significant scope for v1.
The confirmation dialog mitigates accidental deletion.

---

## D-06: No mock data in production code

**Decision:** Mock data only appears in `python/tests/` and test fixtures. Never in production code paths.

**Reason:** The app opens real engineer model files. Mock data in production paths can cause incorrect results.

---

## D-07: Parameters and recorders left as raw JSON

**Decision:** The app does not provide a UI for creating or editing parameters, recorders,
or tables. Users edit these directly in the JSON tab.

**Reason:** PyWR parameter types are numerous and highly variable (CSVParameter,
MonthlyProfileParameter, AggregatedParameter, ADO/PDO licences, grouped licences, etc).
Building a generic UI for all variations would be enormous scope and still miss edge cases.
The JSON tab with Monaco editor gives engineers full control without abstraction overhead.

---

## D-08: Node colours defined in nodeTypes.ts only

**Decision:** Node colours are never hardcoded inline in component files.
Always read from `NODE_COLOUR_MAP` in `src/constants/nodeTypes.ts`.

**Reason:** Consistency — one place to change a colour.

---

## D-09: Absolute paths only

**Decision:** All file paths passed to API routes must be absolute. Relative paths are rejected.

**Reason:** The Electron main process and the renderer have different working directories.
Absolute paths are unambiguous regardless of where either process was started.

---

## D-10: Background image follows viewport transform

**Decision:** The background map image is rendered with `useViewport()` so it pans and
zooms in sync with the ReactFlow canvas nodes.

**Reason:** The primary use case is tracing a network schematic from a map image.
If the image stayed fixed while nodes zoom, the reference would be useless at any
zoom level other than 1:1.
