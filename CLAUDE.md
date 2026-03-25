# CLAUDE.md — PyWR Canvas

## CRITICAL: Read this entire file before doing anything else.

---

## What this project is

PyWR Canvas is a desktop application (.exe) for water engineers to open, draw, edit
and validate Pywr water resource model JSON files. It overlays network nodes on a
background map image. It is built with Electron + React + TypeScript (frontend) and
a bundled Python/Flask backend. The final deliverable is a single Windows .exe
installer produced by electron-builder + PyInstaller.

This is NOT a web app. It is NOT deployed to a server. It runs entirely on the
user's local machine with no internet connection required.

---

## How you must work — follow this exactly every session

1. Read `TASKS.md`
2. Find the **first task whose Status is `[ ]`** (not done)
3. Read that task's full context block — it contains everything you need
4. Read any files listed in that task's "Read first" section before writing code
5. Complete **only that one task** — do not start the next task
6. When the task is done:
   - Mark it `[x]` in `TASKS.md`
   - Write a one-line completion note under the task
   - **Stop. Do not continue to the next task.**
7. The next Claude session will start fresh and pick up the next task automatically

This pattern exists so that context never accumulates across tasks. Each task is
fully self-contained. You must not rely on anything from a previous session that
is not written in a file on disk.

---

## Non-negotiable rules

- **No hallucinated Pywr schemas.** All Pywr node types, required fields, and JSON
  structure must come from `PYWR_SCHEMA.md`. Do not invent field names.
- **No placeholder values.** No `"TODO"`, `"your_value_here"`, `123`, `"test"`,
  `"example.json"`. Every value in generated code must be real and functional.
- **No invented node names.** Node names come from the actual loaded JSON file.
  Never generate fake node names like `"GW_Node_1"` or `"WTW_Example"`.
- **No random colours assigned to nodes.** Colour mapping lives in
  `NODE_COLOUR_MAP` in `src/constants/nodeTypes.ts`. Read it before using any colour.
- **No invented API endpoints.** All Flask routes are defined in `ARCHITECTURE.md`.
  Only implement what is listed there.
- **No mock data anywhere in production code.** Mock data only appears in files
  inside `src/__tests__/` or `python/tests/`.

---

## Project structure (do not deviate from this)

```
pywr-canvas/
├── CLAUDE.md                  ← this file
├── TASKS.md                   ← task list, one task per session
├── ARCHITECTURE.md            ← API contracts, data flow, port numbers
├── PYWR_SCHEMA.md             ← all Pywr node types and their exact JSON fields
├── NODE_TYPES.md              ← visual representation rules per node type
├── DEV_SETUP.md               ← exact commands to run dev environment
│
├── electron/
│   ├── main.js                ← window creation, Python spawn, IPC
│   └── preload.js             ← contextBridge API surface
│
├── src/                       ← React + TypeScript frontend
│   ├── App.tsx
│   ├── constants/
│   │   └── nodeTypes.ts       ← NODE_COLOUR_MAP lives here
│   ├── components/
│   │   ├── Canvas.tsx         ← React Flow canvas
│   │   ├── NodePalette.tsx
│   │   ├── PropertiesPanel.tsx
│   │   ├── ValidationBar.tsx
│   │   └── DeleteNodeDialog.tsx
│   ├── hooks/
│   │   ├── usePywrJson.ts
│   │   └── useLayout.ts
│   └── types/
│       └── pywr.ts            ← TypeScript types matching PYWR_SCHEMA.md exactly
│
├── python/
│   ├── server.py              ← Flask app, all routes from ARCHITECTURE.md
│   ├── pywr_schema.py         ← node schema validation, mirrors PYWR_SCHEMA.md
│   ├── add_recorders.py       ← recorder injection logic
│   └── tests/
│       └── test_schema.py
│
├── assets/
│   └── icon.ico
│
├── electron-builder.config.js
├── package.json
└── tsconfig.json
```

---

## Port and process facts

- Python Flask backend runs on **localhost:47821** (hardcoded, not configurable)
- Electron renderer calls `http://localhost:47821/api/...`
- Python process is spawned by Electron main process on app start
- Python process is killed by Electron main process on app quit
- In development: `python python/server.py` starts the backend manually
- In production .exe: bundled `pywr_backend.exe` is extracted to temp folder and spawned

---

## What "done" means for any task

A task is done when:
1. All files listed in "Produces" exist on disk with real, working content
2. The code runs without errors (`npm run dev` or `python server.py`)
3. No placeholder strings, TODO comments, or invented values remain
4. The task's acceptance criteria in TASKS.md are all met

---

## If you are ever unsure about a Pywr field or node type

Read `PYWR_SCHEMA.md`. If the answer is not there, write a comment in the code:
`// SCHEMA_GAP: field X not confirmed — needs verification against Pywr docs`
and add it to the bottom of `PYWR_SCHEMA.md` under `## Unconfirmed fields`.
Never guess and never invent.
