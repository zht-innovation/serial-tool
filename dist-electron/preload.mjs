"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  // You can expose other APTs you need here.
  // devices management
  scanDevices: () => electron.ipcRenderer.invoke("scan-devices"),
  connectDevice: (portPath) => electron.ipcRenderer.invoke("connect-device", portPath),
  startReading: () => electron.ipcRenderer.invoke("start-reading"),
  stopReading: () => electron.ipcRenderer.invoke("stop-reading"),
  onSBUSData: (callback) => {
    electron.ipcRenderer.on("sbus-data", (_, data) => callback(data));
  },
  removeSBUSDataListener: () => {
    electron.ipcRenderer.removeAllListeners("sbus-data");
  }
});
