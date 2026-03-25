# DECISIONS.md — Architectural Decisions

Records significant design decisions made for PyWR Canvas and the reasoning behind them.

---

## D-01: Port 47821

**Decision:** Flask backend runs on `localhost:47821`.

**Reason:** Avoids conflicts with common development ports (3000, 5000, 8000, 8080, 8888). Low probability of collision on a water engineer's machine.

---

## D-02: Layout sidecar file

**Decision:** Node positions are stored in `<model_name>.layout.json`, not inside the Pywr model JSON.

**Reason:** The Pywr model JSON is loaded by the Pywr Python library. Adding UI coordinates to it would make it non-standard and potentially break `pywr.model.Model.load()`. The sidecar keeps both files clean.

---

## D-03: Electron + React + Python

**Decision:** Electron for the desktop shell, React for the UI, Python only for backend logic (Pywr operations, schema validation).

**Reason:** React Flow is the best available drag-and-drop graph editor for React. PyQt/Tkinter equivalents are significantly more limited. Water engineers use Windows — the Electron `.exe` installer is a familiar distribution format.

---

## D-04: Immutable state updates in React hooks

**Decision:** All model mutations in `usePywrJson.ts` produce new objects via spread (`{ ...model, nodes: [...] }`). No direct mutation of state.

**Reason:** React requires immutable updates for re-renders to work correctly.

---

## D-05: Smart delete — no undo in v1

**Decision:** The smart delete dialog confirms before committing. No undo after confirmation.

**Reason:** Undo requires a full command pattern and action history — significant scope for v1. The confirmation dialog mitigates accidental deletion.

---

## D-06: No mock data in production code

**Decision:** Mock data only appears in `python/tests/` and `src/__tests__/`. Never in production code paths.

**Reason:** The app opens real engineer model files. Mock data in production paths can cause incorrect results on real files.

---

## D-07: Python 3.11 pinned

**Decision:** Python 3.11 exactly. Not 3.12, not 3.10.

**Reason:** Pywr has dependency constraints confirmed on 3.11. 3.12 has breaking changes in some Pywr dependencies.

---

## D-08: Node colours defined in nodeTypes.ts only

**Decision:** Node colours are never hardcoded inline in component files. Always read from `NODE_COLOUR_MAP` in `src/constants/nodeTypes.ts`.

**Reason:** Consistency — one place to change a colour.

---

## D-09: Flask, not FastAPI

**Decision:** Flask for the Python backend.

**Reason:** Flask is simpler and works well with PyInstaller. The backend has only 4 routes with no performance requirements that justify FastAPI's added complexity.

---

## D-10: Absolute paths only

**Decision:** All file paths passed to Flask routes must be absolute. Relative paths are rejected with an error.

**Reason:** The Flask process and Electron renderer have different working directories. Absolute paths are unambiguous.
