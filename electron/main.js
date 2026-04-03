// electron/main.js — PyWR Canvas Electron main process
// All model logic (parse, validate, export, add-recorders) runs here in Node.js.
// No Python or Flask required — Electron already bundles Node.js.

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const { validateModel } = require('./pywr_schema');
const { addRecorders }  = require('./add_recorders');

let mainWindow = null;

// ---------------------------------------------------------------------------
// BrowserWindow creation
// ---------------------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'PyWR Canvas',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }
}

// ---------------------------------------------------------------------------
// API handlers — previously served by Flask, now run directly in Node.js
// ---------------------------------------------------------------------------

function apiParse(body) {
  const jsonPath = body && body.json_path;
  if (!jsonPath || typeof jsonPath !== 'string' || !jsonPath.trim()) {
    return { ok: false, error: 'json_path is required' };
  }
  if (!path.isAbsolute(jsonPath)) {
    return { ok: false, error: 'Path must be absolute' };
  }
  if (!fs.existsSync(jsonPath)) {
    return { ok: false, error: `File not found: ${jsonPath}` };
  }

  let raw;
  try { raw = fs.readFileSync(jsonPath, 'utf8'); }
  catch (e) { return { ok: false, error: `Could not read file: ${e.message}` }; }

  let model;
  try { model = JSON.parse(raw); }
  catch (e) { return { ok: false, error: `Invalid JSON: ${e.message}` }; }

  if (!model || typeof model !== 'object' || Array.isArray(model)) {
    return { ok: false, error: 'Model file must be a JSON object' };
  }

  return {
    ok: true,
    data: {
      nodes:       Array.isArray(model.nodes)  ? model.nodes  : [],
      edges:       Array.isArray(model.edges)  ? model.edges  : [],
      parameters:  model.parameters  || {},
      recorders:   model.recorders   || {},
      timestepper: model.timestepper || {},
      metadata:    model.metadata    || {},
    },
  };
}

function apiValidate(body) {
  const model = body && body.model;
  if (!model || typeof model !== 'object') {
    return { ok: false, error: 'model is required' };
  }

  const issues = validateModel(model);
  return {
    ok: true,
    data: {
      warnings: issues.filter((i) => i.severity === 'warning'),
      errors:   issues.filter((i) => i.severity === 'error'),
    },
  };
}

function apiAddRecorders(body) {
  const model = body && body.model;
  if (!model || typeof model !== 'object') {
    return { ok: false, error: 'model is required' };
  }

  const { model: updatedModel, added } = addRecorders(model);
  return { ok: true, data: { model: updatedModel, added } };
}

function apiExport(body) {
  const model = body && body.model;
  if (!model || typeof model !== 'object') {
    return { ok: false, error: 'model is required' };
  }

  const outputPath = body.output_path;
  if (!outputPath || typeof outputPath !== 'string' || !outputPath.trim()) {
    return { ok: false, error: 'output_path is required' };
  }
  if (!path.isAbsolute(outputPath)) {
    return { ok: false, error: 'output_path must be absolute' };
  }

  // Block export if model has errors
  const issues = validateModel(model);
  const errors = issues.filter((i) => i.severity === 'error');
  if (errors.length) {
    return { ok: false, error: `Model has ${errors.length} error(s) — fix before exporting` };
  }

  try { fs.writeFileSync(outputPath, JSON.stringify(model, null, 2), 'utf8'); }
  catch (e) { return { ok: false, error: `Could not write file: ${e.message}` }; }

  return { ok: true, data: { written_to: outputPath } };
}

function handleApiCall(route, body) {
  switch (route) {
    case '/api/parse':         return apiParse(body);
    case '/api/validate':      return apiValidate(body);
    case '/api/add-recorders': return apiAddRecorders(body);
    case '/api/export':        return apiExport(body);
    default:                   return { ok: false, error: `Unknown route: ${route}` };
  }
}

// ---------------------------------------------------------------------------
// IPC handlers — exposed to renderer via preload.js contextBridge
// ---------------------------------------------------------------------------

// Open native file picker for .json files
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Pywr Model',
    filters: [{ name: 'Pywr JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  return result.canceled || !result.filePaths.length ? null : result.filePaths[0];
});

// Open native file picker for image files (png/jpg/jpeg)
ipcMain.handle('open-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Background Map Image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    properties: ['openFile'],
  });
  return result.canceled || !result.filePaths.length ? null : result.filePaths[0];
});

// Open native save dialog for .json
ipcMain.handle('save-file', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Pywr Model',
    defaultPath: defaultPath || 'model.json',
    filters: [{ name: 'Pywr JSON', extensions: ['json'] }],
  });
  return result.canceled ? null : result.filePath;
});

// Open native file picker for CSV files
ipcMain.handle('open-csv', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select CSV Parameter File',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    properties: ['openFile'],
  });
  return result.canceled || !result.filePaths.length ? null : result.filePaths[0];
});

// Read the header row of a CSV file — returns array of column names
ipcMain.handle('read-csv-columns', (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const firstLine = content.split('\n')[0] || '';
    return firstLine.split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
  } catch {
    return [];
  }
});

// Route API calls directly to Node.js handlers (no HTTP, no Flask)
ipcMain.handle('call-api', (event, route, body) => {
  return handleApiCall(route, body);
});

// Write a string to disk (used for .layout.json sidecar)
ipcMain.handle('save-layout-file', (event, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf8');
});

// Read a file from disk; returns null if file not found
ipcMain.handle('read-layout-file', (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
