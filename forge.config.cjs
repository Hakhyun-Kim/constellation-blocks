'use strict';

const path = require('node:path');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'ConstellationDefense',
    icon: path.resolve(__dirname, 'assets', 'branding', 'icon'),
    ignore: [
      /^\/(?:\.claude|\.git|\.github|docs|scripts|src|out)(?:\/|$)/,
      /^\/(?:AGENTS\.md|CLAUDE\.md|README\.md|package-lock\.json)$/,
    ],
  },
  makers: [{ name: '@electron-forge/maker-zip', platforms: ['win32'] }],
};

