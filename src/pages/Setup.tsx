import { useEffect, useState } from "react";

/**
 * Local TS declaration; keep in sync with src/types/api.d.ts if you prefer globally.
 * window.api may be undefined when running the Vite dev server in a normal browser.
 */
declare global {
  interface Window {
    api?: {
      loadApiKey: () => Promise<string | null>;
      saveApiKey: (key: string) => Promise<boolean>;
    };
  }
}

export default function Setup() {
  const [apiKey, setApiKey] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (window.api && window.api.loadApiKey) {
          const k = await window.api.loadApiKey();
          if (!alive) return;
          if (k) setApiKey(k);
        } else {
          // no preload available (running in plain vite/browser)
          console.info("window.api not available (running in browser).");
        }
      } catch (err) {
        console.error("Error loading API key:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveKey = async () => {
    try {
      if (window.api && window.api.saveApiKey) {
        const ok = await window.api.saveApiKey(apiKey);
        if (ok) {
          setStatus("Saved");
          setTimeout(() => setStatus(""), 1400);
        } else {
          setStatus("Save failed");
          setTimeout(() => setStatus(""), 2000);
        }
      } else {
        // fallback: not available in browser dev
        console.warn("saveApiKey not available (running in browser).");
        setStatus("Save unavailable in browser");
        setTimeout(() => setStatus(""), 1600);
      }
    } catch (err) {
      console.error("Error saving API key:", err);
      setStatus("Save error");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  const handleSteamLogin = () => {
    // placeholder -> will open OIDC child window later via ipc if you want
    console.log("Open Steam Login Window (TODO)");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 shadow-2xl rounded-2xl p-8 w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-gray-100 border-b border-gray-700 pb-2">
          Initial Setup
        </h1>

        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : (
          <>
            <div className="space-y-3">
              <label className="block text-gray-300 font-medium">Steam API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Steam API Key..."
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <button
                onClick={saveKey}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500 active:scale-95 transition transform"
                aria-label="Save Steam API Key"
              >
                Save API Key
              </button>

              {status && <div className="text-green-400">{status}</div>}
            </div>

            <hr className="border-t border-gray-700 my-4" />

            <button
              onClick={handleSteamLogin}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500 active:scale-95 transition transform"
              aria-label="Sign in with Steam"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/1024px-Steam_icon_logo.svg.png?20220611141426"
                alt="Steam"
                className="w-10 h-10 object-contain"
              />
              <span className="text-left">
                <div className="text-sm opacity-90">Sign in through</div>
                <div className="text-lg font-bold">STEAM</div>
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
