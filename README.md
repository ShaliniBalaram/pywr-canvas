# PyWR Canvas

A desktop tool for water engineers to open, edit and validate Pywr water resource model files on an interactive map canvas.

---

## Before You Start

You need two things installed on your computer:

**1. Python 3.11**
Download from: https://www.python.org/downloads/release/python-3110/
During install, tick **"Add Python to PATH"**

**2. Node.js (version 18 or 20)**
Download from: https://nodejs.org/en/download

---

## Installation

Open a terminal (Command Prompt or PowerShell on Windows) and run these commands one at a time:

```bash
# Download the project
git clone https://github.com/ShaliniBalaram/pywr-canvas.git
cd pywr-canvas

# Install Python packages
pip install -r requirements.txt

# Install app packages
npm install
```

That's it. You only need to do this once.

---

## Running the App

Every time you want to use the app, you need **two terminals open at the same time**.

**Terminal 1 — start the backend:**
```bash
python python/server.py
```
You should see: `PyWR Canvas backend started on port 47821`
Leave this terminal open.

**Terminal 2 — start the app:**
```bash
npm run dev
```
The PyWR Canvas window will open automatically.

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
1. Find the node type you want in the left panel
2. Drag it onto the canvas
3. The new node appears where you dropped it

### Deleting a node
1. Click the node to select it
2. Press the **Delete** key
3. A dialog asks how to handle connected nodes — choose an option and confirm

### Adding a background map
1. Click **Load Map** in the toolbar
2. Select a PNG or JPG image
3. Use the **Opacity** slider to make it more or less visible

### Checking for errors
- The bar at the bottom shows errors and warnings automatically
- **Red** = errors that must be fixed before saving
- **Amber** = warnings (the file will still save)
- Click any warning to highlight the problem node

### Saving your work
1. Click **Save** in the toolbar
2. Choose where to save
3. Two files are written: your `.json` model and a `.layout.json` file that remembers node positions

---

## Troubleshooting

**The app window is blank or shows an error about the backend**
Make sure Terminal 1 (the one running `python python/server.py`) is still open and shows the startup message.

**`pip install` fails**
Check that Python 3.11 is installed: `python --version`
If it shows a different version, download Python 3.11 from the link above.

**`npm install` fails**
Check that Node.js is installed: `node --version`
It should show v18.x or v20.x.

**Nodes appear on top of each other when opening a file**
This happens when no layout file exists yet. Drag the nodes apart and save — positions will be remembered next time.

---

## Example Model

An example Bordon groundwater network is included. Open it from:
```
examples/bordon_gw/bordon_gw.json
```

---

## Building a Standalone .exe (Windows)

If you want to share the app without needing Node or Python installed:

```bash
npm run build
```

The installer will appear in the `release/` folder.
