import { contextBridge, ipcRenderer } from "electron";

console.log("preload.js executing — beginning exposure");

contextBridge.exposeInMainWorld("api", {
  loadApiKey: async (): Promise<string | null> => {
    console.log("preload: loadApiKey invoked");
    return ipcRenderer.invoke("load-api-key");
  },
  saveApiKey: async (key: string): Promise<boolean> => {
    console.log("preload: saveApiKey invoked with key length:", (key || "").length);
    return ipcRenderer.invoke("save-api-key", key);
  },
});

console.log("preload.js finished exposing window.api");
