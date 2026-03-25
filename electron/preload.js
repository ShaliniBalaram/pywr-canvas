// electron/preload.js — contextBridge API surface
// Exposes window.pywr.* to the React renderer.
// All methods forward to ipcMain handlers in main.js.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pywr', {
  openFile: ()                        => ipcRenderer.invoke('open-file'),
  openImage: ()                       => ipcRenderer.invoke('open-image'),
  saveFile: (defaultPath)             => ipcRenderer.invoke('save-file', defaultPath),
  callApi: (route, body)              => ipcRenderer.invoke('call-api', route, body),
  saveLayoutFile: (filePath, content) => ipcRenderer.invoke('save-layout-file', filePath, content),
  readLayoutFile: (filePath)          => ipcRenderer.invoke('read-layout-file', filePath),
});
