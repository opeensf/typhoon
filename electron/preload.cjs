const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("typhoonApi", {
  getNmcCharts: (options) => ipcRenderer.invoke("nmc:getCharts", options)
});
