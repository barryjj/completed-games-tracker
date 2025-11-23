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

  openSteamLogin: async (): Promise<boolean> => {
    console.log("preload: openSteamLogin invoked");
    return ipcRenderer.invoke("open-steam-login");
  },

  // Existing: get user by steam_id64
  getUserBySteamId: async (steam_id64: string): Promise<any | null> => {
    console.log("preload: getUserBySteamId invoked for:", steam_id64);
    return ipcRenderer.invoke("get-user-by-steam-id", steam_id64);
  },

  // New: get first/only user (for setup page load)
  getUser: async (): Promise<any | null> => {
    console.log("preload: getUser invoked (first user)");
    return ipcRenderer.invoke("get-user");
  },

  deleteUser: async (user_id: number): Promise<boolean> => {
    console.log("preload: deleteUser invoked for user_id:", user_id);
    return ipcRenderer.invoke("delete-user", user_id);
  },

  onSteamUserUpdated: (cb: (data: any) => void): void => {
    console.log("preload: onSteamUserUpdated listener registered");
    const handler = (_evt: any, data: any) => {
      try {
        cb(data);
      } catch (err) {
        console.error("onSteamUserUpdated callback error:", err);
      }
    };
    ipcRenderer.on("steam-user-updated", handler);
  },

  openExternalBrowser: (url: string) => {
    console.log("preload: openExternal invoked for", url);
    return ipcRenderer.invoke("open-external-browser", url);
  },
});

console.log("preload.js finished exposing window.api");