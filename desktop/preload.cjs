'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('constellationDesktop', Object.freeze({
  getInfo: () => ipcRenderer.invoke('desktop:get-info'),
}));

