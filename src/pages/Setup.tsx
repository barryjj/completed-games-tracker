import { useEffect, useState } from "react";

/**
 * Local TS declaration for preload IPC
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
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (window.api?.loadApiKey) {
          const k = await window.api.loadApiKey();
          if (!alive) return;
          if (k) setApiKey(k);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const showToast = (type: "success" | "error" | "warning", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2000);
  };

  const saveKey = async () => {
    if (!window.api?.saveApiKey) {
      showToast("error", "Not available in browser");
      return;
    }

    const ok = await window.api.saveApiKey(apiKey);

    if (apiKey.trim() === "") {
      showToast("warning", "API key removed — Steam integration disabled");
      return;
    }

    if (ok) showToast("success", "API key saved");
    else showToast("error", "Failed to save key");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-surface1 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 border border-surface2">

        <h1 className="text-2xl font-bold text-text border-b border-overlay0 pb-2">
          Initial Setup
        </h1>

        {loading ? (
          <div className="text-subtext1">Loading…</div>
        ) : (
          <>
            <div className="space-y-3">

              <label className="block text-subtext1 font-medium">
                Steam API Key
              </label>

              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Steam API Key…"
                className="ct-input focus:ct-input-focus w-full"
              />

              <button
                onClick={saveKey}
                className="muted-btn hover:muted-btn-hover active:muted-btn-active w-full text-center"
              >
                Save API Key
              </button>
            </div>

            <hr className="border-overlay0 my-4" />

            <button
              onClick={() => console.log("TODO: Steam login")}
              className="muted-btn hover:muted-btn-hover active:muted-btn-active w-full flex items-center justify-center gap-3"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg"
                alt="Steam"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold">Sign in with Steam</span>
            </button>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`
            toast-box fixed top-4 right-4
            ${toast.type === "success" ? "toast-success" : ""}
            ${toast.type === "error" ? "toast-error" : ""}
            ${toast.type === "warning" ? "toast-warning" : ""}
          `}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
