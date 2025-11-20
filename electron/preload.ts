import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  loadApiKey: (): Promise<string | null> => ipcRenderer.invoke("load-api-key"),
  saveApiKey: (key: string): Promise<boolean> => ipcRenderer.invoke("save-api-key", key),
});
