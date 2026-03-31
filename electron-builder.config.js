// electron-builder.config.js — PyWR Canvas cross-platform build configuration
// Bundles pywr_backend as an extraResource alongside the Electron app.

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

  win: {
    target: [{ target: "nsis", arch: ["x64"] }],
    extraResources: [
      { from: "python/dist/pywr_backend.exe", to: "pywr_backend.exe" },
    ],
  },

  mac: {
    target: [{ target: "dmg", arch: ["arm64", "x64"] }],
    extraResources: [
      { from: "python/dist/pywr_backend", to: "pywr_backend" },
    ],
  },

  nsis: {
    oneClick: false,
    allowDirectoryChange: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "PyWR Canvas",
  },
};
