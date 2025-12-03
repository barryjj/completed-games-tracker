import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

import Toast from '../components/ui/Toast';

/**
 * Local TS declaration for preload IPC
 */
declare global {
  interface Window {
    api?: {
      loadApiKey: () => Promise<string | null>;
      saveApiKey: (key: string) => Promise<boolean>;
      openSteamLogin: () => Promise<boolean>;
      getUser: () => Promise<any | null>; // first user
      getUserBySteamId: (steam_id64: string) => Promise<any | null>;
      deleteUser: (user_id: number) => Promise<boolean>;
      onSteamUserUpdated: (cb: (data: any) => void) => void;
      openExternalBrowser: (url: string) => void;
    };
  }
}

type SetupProps = {
  navigate: (page: 'setup' | 'dashboard' | 'library') => void;
};

export default function Setup({ navigate }: SetupProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
    let alive = true;

    // Load API key
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

    // Load first user on page load
    (async () => {
      try {
        if (window.api?.getUser) {
          const user = await window.api.getUser();
          if (!alive) return;
          if (user) setCurrentUser(user);
        }
      } catch (err) {
        console.error('Error loading user on setup mount:', err);
      }
    })();

    // Listen for steam-user-updated events
    try {
      window.api?.onSteamUserUpdated?.(async (data: any) => {
        console.log('Renderer got steam-user-updated:', data);
        if (!data || !data.success) {
          const errMsg = data?.error ?? 'Unknown error';
          setToast({ type: 'error', msg: `Steam login failed: ${errMsg}` });
          return;
        }
        const steam_id64 = data.steam_id64;
        if (!steam_id64) {
          setToast({ type: 'error', msg: 'Steam login returned no ID' });
          return;
        }

        try {
          const user = await window.api?.getUserBySteamId(steam_id64);
          if (user) {
            setCurrentUser(user);
          } else {
            setToast({ type: 'warning', msg: 'Signed in but no stored user found' });
          }
        } catch (err) {
          console.error('Error fetching user after login:', err);
          setToast({ type: 'error', msg: 'Failed to load user data' });
        }
      });
    } catch (err) {
      console.error('Failed to register onSteamUserUpdated:', err);
    }

    return () => {
      alive = false;
    };
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2000);
  };

  const saveKey = async () => {
    if (!window.api?.saveApiKey) {
      showToast('error', 'Not available in browser');
      return;
    }

    const ok = await window.api.saveApiKey(apiKey);

    if (apiKey.trim() === '') {
      showToast('warning', 'API key removed — Steam integration disabled');
      return;
    }

    if (ok) showToast('success', 'API key saved');
    else showToast('error', 'Failed to save key');
  };

  const handleDeleteUser = async () => {
    if (!currentUser || !currentUser.user_id) {
      showToast('error', 'No user to delete');
      return;
    }

    if (!window.api?.deleteUser) {
      showToast('error', 'Delete user not available');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete user "${currentUser.persona_name}"?`,
    );
    if (!confirmed) return;

    const ok = await window.api.deleteUser(currentUser.user_id);
    if (ok) {
      setCurrentUser(null);
      showToast('success', 'User deleted');
    } else {
      showToast('error', 'Failed to delete user');
    }
  };

  return (
    <div className="page-container">
      {/* top row: back button (kept same appearance as before) */}
      <div className="flex justify-between items-center">
        {currentUser && (
          <button
            className="p-2 rounded hover:bg-surface2"
            onClick={() => navigate('dashboard')}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-text" />
          </button>
        )}
      </div>

      {/* center area: stack two cards vertically and center them */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* API Key Card */}
          <div className="card">
            {loading ? (
              <div className="text-subtext1">Loading…</div>
            ) : (
              <>
                <label className="block text-subtext1 font-medium">Steam API Key</label>

                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Steam API Key…"
                  className="input"
                />

                <button
                  onClick={saveKey}
                  className="btn-primary w-full mt-3"
                  aria-label="Save API Key"
                >
                  Save API Key
                </button>
              </>
            )}
          </div>

          {/* Signed-in Card */}
          {currentUser && (
            <div className="card">
              <div className="font-medium">Signed in:</div>

              <div className="flex items-center gap-3 mt-3">
                {currentUser.avatar_full && (
                  <img
                    src={currentUser.avatar_full}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}

                <div className="flex flex-col">
                  <div className="font-bold">{currentUser.persona_name}</div>

                  <a
                    href={currentUser.profile_url}
                    onClick={async (e) => {
                      e.preventDefault(); // stop Electron hijack
                      if (window.api?.openExternalBrowser) {
                        await window.api.openExternalBrowser(currentUser.profile_url);
                      } else {
                        console.error('openExternalBrowser not available on window.api');
                      }
                    }}
                    className="text-sm text-lavender hover:opacity-80 font-medium mt-1 cursor-pointer"
                  >
                    View Profile
                  </a>
                </div>
              </div>

              <button
                onClick={handleDeleteUser}
                className="btn-danger w-full mt-4"
                aria-label="Delete User"
              >
                Delete User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type as 'success' | 'error' | 'warning'}
          width="w-full max-w-md"
        />
      )}
    </div>
  );
}
