# DECISIONS.md — Architectural decisions

## Purpose

This file records every significant decision made for PyWR Canvas and the
reason it was made. Claude must read this before proposing alternatives.
If a decision is recorded here, it is final for this project.
Do not re-open or re-debate decisions listed here.

---

## D-01: Port 47821

**Decision:** Flask backend runs on localhost:47821.

**Reason:** Avoids conflicts with common development ports (3000, 5000, 8000,
8080, 8888). Not a well-known port. Low probability of collision on a
water engineer's machine.

**Do not change to:** 5000 (Flask default — conflicts with AirPlay on Mac),
8080 (common proxy), 3000 (React dev server).

---

## D-02: Layout sidecar file

**Decision:** Node positions are stored in `<model_name>.layout.json`, not
inside the Pywr model JSON.

**Reason:** The Pywr model JSON is a functional file loaded by the Pywr Python
library. Adding UI layout coordinates to it would make it non-standard and
potentially break `pywr.model.Model.load()`. The sidecar keeps both files clean.

**Do not change to:** storing positions in the model JSON under a `metadata` key
or any other location inside the Pywr JSON.

---

## D-03: Electron + React + Python, not a pure Python GUI

**Decision:** Electron for the desktop shell, React for the UI, Python only for
the backend logic (Pywr operations, schema validation).

**Reason:** React Flow (the canvas library) is React-native and the best
available drag-drop graph editor. PyQt/Tkinter equivalents are significantly
more limited for this use case. Water engineers will use this on Windows — the
Electron .exe installer is a familiar distribution format.

**Do not change to:** PyQt, Tkinter, Tauri (Rust — too complex), pure web app.

---

## D-04: Immutable state updates in React hooks

**Decision:** All model mutations in `usePywrJson.ts` produce new objects via
spread (`{ ...model, nodes: [...] }`). No direct mutation of state.

**Reason:** React requires immutable updates for re-renders to work correctly.
Direct mutation will silently not re-render the canvas.

---

## D-05: Smart delete — no undo

**Decision:** The smart delete dialog confirms before committing. There is no
undo after confirmation. Undo is out of scope for v1.

**Reason:** Implementing undo correctly requires a full command pattern and
action history. This is significant scope. The confirmation dialog mitigates
the risk of accidental deletion.

---

## D-06: No mock data in production code

**Decision:** Mock data (fake node names, fake flows, fake dates) only appears
in `python/tests/` and `src/__tests__/`. Never in production code paths.

**Reason:** The app opens real engineer model files. Mock data in production
code paths causes hallucinated results if a code path is accidentally reached
on a real file.

---

## D-07: Python 3.11 pinned

**Decision:** Python 3.11 exactly. Not 3.12, not 3.10.

**Reason:** Pywr has dependency constraints that are confirmed on 3.11.
3.12 has breaking changes in some Pywr dependencies. Pin to avoid surprise
failures during build.

---

## D-08: All colours defined in nodeTypes.ts only

**Decision:** Node colours are never hardcoded inline in component files.
They are always read from `NODE_COLOUR_MAP` in `src/constants/nodeTypes.ts`.

**Reason:** Consistency. If a colour needs to change, it changes in one place.
If a new developer writes `color: "blue"` inline, it will differ from the
design system and be invisible in the next theme change.

---

## D-09: Flask, not FastAPI

**Decision:** Flask for the Python backend.

**Reason:** Pywr is a Python 3.11 ecosystem. Flask is the simplest HTTP server
that works well with PyInstaller. FastAPI adds async complexity and heavier
dependencies. The backend has only 4 routes and no performance requirements
that justify FastAPI.

---

## D-10: Absolute paths only

**Decision:** All file paths passed to Flask routes must be absolute. The Flask
backend rejects relative paths with an error.

**Reason:** The Flask process and the Electron renderer have different working
directories. A relative path that works in one context silently opens the wrong
file in the other. Absolute paths are unambiguous.
