// electron-builder.config.js — PyWR Canvas cross-platform build configuration

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
  },

  mac: {
    target: [{ target: "dmg", arch: ["arm64", "x64"] }],
  },

  nsis: {
    oneClick: false,
    allowDirectoryChange: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "PyWR Canvas",
  },
};
