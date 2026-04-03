# PyWR Canvas

A desktop tool for water engineers to open, edit and validate Pywr water resource model files on an interactive map canvas.

---

## Before You Start

You need one thing installed:

**Node.js (version 18 or 20)**
Download from: https://nodejs.org/en/download

That's it. No Python required to run the editor.

---

## Installation

Open a terminal and run:

```bash
git clone https://github.com/ShaliniBalaram/pywr-canvas.git
cd pywr-canvas
npm install
```

You only need to do this once.

---

## Running the App

```bash
npm run dev
```

One command, one terminal. The PyWR Canvas window opens automatically.

---

## How to Use

### Opening a model
1. Click **Open** in the top toolbar
2. Select your Pywr `.json` model file
3. Your network appears on the canvas

### Moving nodes
- Click and drag any node to reposition it
- Positions are saved automatically when you save

### Editing a node
1. Click on a node to select it
2. The **Properties** panel opens on the right
3. Edit any field and click away to apply

### Adding a new node
1. Find the node type in the left panel
2. Drag it onto the canvas

### Deleting a node
1. Click the node to select it
2. Press the **Delete** key
3. A dialog asks how to handle connected nodes — confirm to delete

### Tracing a network from a map image
1. Click **Load Map** to load a background PNG or JPG
2. Use the **Opacity** slider to adjust how visible it is
3. Turn on **Snap** in the toolbar and set your grid size to match the map scale
4. Click **🔒** to lock the grid so you don't accidentally change it
5. Place nodes on top of the image to trace the network

### Editing parameters, recorders and tables
1. Open the **JSON** tab (next to Canvas in the tab bar)
2. Edit the full model JSON directly — parameters, recorders, tables, timestepper
3. Click **Apply Changes** to push your edits back to the canvas

### Linking a node field to a CSV file
1. Click a node to select it
2. In the Properties panel, click the **📎** button next to any flow or volume field
3. Select your CSV file and choose the column
4. The field is linked — a `CSVParameter` entry is created automatically in `parameters`

### Checking for errors
- The bar at the bottom shows errors and warnings automatically
- **Red** = errors that must be fixed before saving
- **Amber** = warnings (the file will still save)
- Click any warning to highlight the problem node on the canvas

### Saving
1. Click **Save** in the toolbar
2. Two files are written: your `.json` model and a `.layout.json` file that remembers node positions

---

## Example Model

An example Bordon groundwater network is included:
```
examples/bordon_gw/bordon_gw.json
```

---

## Troubleshooting

**`npm install` fails**
Check Node.js is installed: `node --version` — should show v18.x or v20.x.

**Nodes appear on top of each other when opening a file**
No layout file exists yet for that model. Drag nodes apart and save — positions are remembered next time.

---

## Distributing the App

To share PyWR Canvas as a standalone app that requires nothing installed:

```bash
npm run build
```

The installer (`.dmg` on Mac, `.exe` on Windows) appears in the `release/` folder.
Users just double-click to install and run — no Node.js, no Python, no terminal.
