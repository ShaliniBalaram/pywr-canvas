# End-to-End Manual Test Checklist — PyWR Canvas

Run these steps in order on a freshly started application.
All steps assume `npm run dev` and `python python/server.py` are both running.

---

## Setup

- [ ] `npm install` completed without errors
- [ ] `python -m pip install flask flask-cors pywr` completed without errors
- [ ] `python python/server.py` prints `PyWR Canvas backend started on port 47821`
- [ ] `npm run dev` opens the Electron window with title "PyWR Canvas"

---

## 1 — Opening a model

- [ ] Click **Open** → native file picker appears
- [ ] Navigate to `python/tests/fixtures/minimal_model.json` → click Open
- [ ] Canvas shows 3 nodes: Bordon_GW, Bordon_WTW, Bordon_DC
- [ ] Two edges are drawn: GW→WTW and WTW→DC
- [ ] ValidationBar shows 0 errors within 1.5 seconds
- [ ] ValidationBar shows NO_RECORDER warnings for all 3 nodes (no recorders in fixture)

---

## 2 — Node selection and properties

- [ ] Click on **Bordon_GW** → Properties panel opens on the right
- [ ] Properties panel shows Name: Bordon_GW (read-only), Type: Input (read-only)
- [ ] Max Flow field shows 5 (from the fixture)
- [ ] Change Max Flow to `abc` → inline error "Must be a number" appears; model is NOT updated
- [ ] Change Max Flow to `7.5` → tab/click away → model updates (toolbar shows "Save *")
- [ ] Click empty canvas → properties panel closes

---

## 3 — Drag-and-drop new node

- [ ] Drag "Input" tile from the Sources group to an empty area of the canvas
- [ ] New node "Input" appears at the drop position
- [ ] Drag "Input" tile again → new node named "Input_2" appears (not duplicate)
- [ ] ValidationBar shows UNCONNECTED_NODE warnings for the new nodes
- [ ] Toolbar shows "Save *" (model is dirty)

---

## 4 — Delete node (smart delete dialog)

- [ ] Click on **Bordon_WTW** to select it
- [ ] Press the Delete key
- [ ] Delete dialog appears showing:
  - "↑ Upstream: Bordon_GW"
  - "↓ Downstream: Bordon_DC"
  - Three reconnect options
- [ ] Choose "Connect each upstream node directly to each downstream node"
- [ ] Click Preview → "Will add edges: Bordon_GW → Bordon_DC"
- [ ] Click Confirm Delete
- [ ] Bordon_WTW is removed from canvas
- [ ] Edge Bordon_GW → Bordon_DC is present
- [ ] ValidationBar updates within 1.5s

---

## 5 — Background map image

- [ ] Click **Load Map** → native file picker appears (filters to PNG/JPG)
- [ ] Select any PNG or JPG image
- [ ] Image appears behind the network nodes
- [ ] Opacity slider appears in toolbar
- [ ] Move slider to far left → image nearly invisible (opacity ~10%)
- [ ] Move slider to far right → image clearly visible (opacity ~90%)
- [ ] Slider does not go below 0.1 or above 0.9

---

## 6 — Save and reload

- [ ] Click **Save** → native save dialog appears
- [ ] Save to `test_output.json`
- [ ] Toolbar shows "Save" (no asterisk — model is clean)
- [ ] Check that `test_output.layout.json` was created alongside `test_output.json`
- [ ] Open `test_output.json` → model reloads with correct nodes/edges
- [ ] Node positions match what was on screen before saving

---

## 7 — Validation bar interaction

- [ ] Open `minimal_model.json` again
- [ ] ValidationBar shows NO_RECORDER warnings for all nodes
- [ ] Click on a warning pill → that node is highlighted (gold outline) for ~2 seconds

---

## 8 — Python process management

- [ ] Open Task Manager (Ctrl+Shift+Esc) while app is running
- [ ] Find `python.exe` (or `pywr_backend.exe` in packaged build) in process list
- [ ] Close the PyWR Canvas window
- [ ] Python process is gone from Task Manager within a few seconds

---

## 9 — Automated tests (run separately)

```bash
# From repo root, with venv active:
pytest python/tests/ -v
```

- [ ] All tests in `test_e2e.py` pass
- [ ] All tests in `test_schema.py` pass
- [ ] `npx tsc --noEmit` reports zero errors
