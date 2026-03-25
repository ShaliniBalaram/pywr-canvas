// electron-builder.config.js — PyWR Canvas Windows installer configuration
// Bundles pywr_backend.exe as an extraResource alongside the Electron app.

module.exports = {
  appId: "com.pywrcanvas.app",
  productName: "PyWR Canvas",

  directories: {
    output: "release",
  },

  files: [
    "build/**/*",
    "electron/**/*",
    "node_modules/**/*",
    "package.json",
  ],

  // pywr_backend.exe is placed at the root of resources/
  // Electron main.js accesses it via path.join(process.resourcesPath, 'pywr_backend.exe')
  extraResources: [
    {
      from: "python/dist/pywr_backend.exe",
      to: "pywr_backend.exe",
    },
  ],

  win: {
    target: [{ target: "nsis", arch: ["x64"] }],
    icon: "assets/icon.ico",
  },

  nsis: {
    oneClick: false,
    allowDirectoryChange: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "PyWR Canvas",
    installerIcon: "assets/icon.ico",
    uninstallerIcon: "assets/icon.ico",
  },
};
