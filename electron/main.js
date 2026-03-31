// electron/main.js — PyWR Canvas Electron main process
// Port: 47821 (from ARCHITECTURE.md and CLAUDE.md)

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

const FLASK_PORT = 47821;
let mainWindow = null;
let pythonProcess = null;

// ---------------------------------------------------------------------------
// Python backend spawn
// dev:      python python/server.py   (from repo root)
// packaged: process.resourcesPath/pywr_backend.exe
// ---------------------------------------------------------------------------
function spawnPython() {
  if (app.isPackaged) {
    const exeName = process.platform === 'win32' ? 'pywr_backend.exe' : 'pywr_backend';
    const exePath = path.join(process.resourcesPath, exeName);
    pythonProcess = spawn(exePath, [], { stdio: 'pipe' });
  } else {
    pythonProcess = spawn('python', ['python/server.py'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });
  }

  pythonProcess.stdout.on('data', (d) => console.log('[Python]', d.toString().trim()));
  pythonProcess.stderr.on('data', (d) => console.error('[Python]', d.toString().trim()));
  pythonProcess.on('exit', (code) => console.log(`[Python] exited with code ${code}`));
}

// ---------------------------------------------------------------------------
// Wait up to maxMs for Flask to respond, retrying every intervalMs
// ---------------------------------------------------------------------------
function waitForBackend(maxMs, intervalMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tryConnect() {
      const req = http.get(`http://127.0.0.1:${FLASK_PORT}/`, () => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start >= maxMs) {
          reject(new Error('Backend did not start within ' + maxMs + 'ms'));
        } else {
          setTimeout(tryConnect, intervalMs);
        }
      });
      req.setTimeout(intervalMs, () => {
        req.destroy();
        if (Date.now() - start >= maxMs) {
          reject(new Error('Backend did not start within ' + maxMs + 'ms'));
        } else {
          setTimeout(tryConnect, intervalMs);
        }
      });
    }
    tryConnect();
  });
}

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

// Forward API call to Flask backend on localhost:47821
ipcMain.handle('call-api', (event, route, body) => {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: FLASK_PORT,
        path: route,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ ok: false, error: 'Invalid JSON response from backend' });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.write(payload);
    req.end();
  });
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
app.whenReady().then(async () => {
  spawnPython();
  createWindow();

  // Wait for the Flask backend before allowing the renderer to make API calls
  try {
    await waitForBackend(5000, 500);
  } catch {
    dialog.showErrorBox(
      'Backend Failed to Start',
      'The PyWR Canvas Python backend did not start within 5 seconds.\n\n' +
      'Make sure Python 3.11 is installed and pywr is available.\n' +
      'See DEV_SETUP.md for setup instructions.'
    );
  }
});

// Kill Python on quit — no orphan processes
app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
