import { ArrowLeft, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import Toast from '../components/ui/Toast';

type SetupProps = {
  navigate: (page: 'setup' | 'dashboard' | 'library') => void;
};

declare global {
  interface Window {
    api?: {
      loadApiKey: () => Promise<string | null>;
      saveApiKey: (key: string) => Promise<boolean>;
      openSteamLogin: () => Promise<boolean>;
      getUser: () => Promise<any | null>;
      getUserBySteamId: (steam_id64: string) => Promise<any | null>;
      deleteUser: (user_id: number) => Promise<boolean>;
      onSteamUserUpdated: (cb: (data: any) => void) => void;
      openExternalBrowser: (url: string) => void;
    };
  }
}

export default function Setup({ navigate }: SetupProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

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

    window.api?.onSteamUserUpdated?.(async (data: any) => {
      if (!data || !data.success) {
        setToast({ type: 'error', msg: data?.error ?? 'Steam login failed' });
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
          navigate('dashboard'); // auto-navigate after login
        } else {
          setToast({ type: 'warning', msg: 'Signed in but no stored user found' });
        }
      } catch (err) {
        console.error('Error fetching user after login:', err);
        setToast({ type: 'error', msg: 'Failed to load user data' });
      }
    });

    return () => {
      alive = false;
    };
  }, [navigate]);

  const showToast = (type: 'success' | 'error' | 'warning', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2000);
  };

  const saveKey = async () => {
    if (!window.api?.saveApiKey) return showToast('error', 'Not available in browser');
    const ok = await window.api.saveApiKey(apiKey);

    if (apiKey.trim() === '') {
      showToast('warning', 'API key removed — Steam integration disabled');
      return;
    }

    ok ? showToast('success', 'API key saved') : showToast('error', 'Failed to save key');
  };

  const handleDeleteUser = async () => {
    if (!currentUser?.user_id) return showToast('error', 'No user to delete');
    if (!window.api?.deleteUser) return showToast('error', 'Delete user not available');

    if (!confirm(`Are you sure you want to delete user "${currentUser.persona_name}"?`)) return;

    const ok = await window.api.deleteUser(currentUser.user_id);
    if (ok) {
      setCurrentUser(null);
      showToast('success', 'User deleted');
    } else showToast('error', 'Failed to delete user');
  };

  return (
    <div className="w-full min-h-screen p-6 bg-gray-900 text-gray-200">
      {/* Top nav */}
      <div className="flex justify-between items-center mb-6">
        {currentUser && (
          <button
            className="p-2 rounded hover:bg-surface2"
            onClick={() => navigate('dashboard')}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surface1 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 border border-surface2">
          {loading ? (
            <div className="text-subtext1">Loading…</div>
          ) : (
            <>
              {/* API Key input */}
              <div className="space-y-3">
                <label className="block text-subtext1 font-medium">Steam API Key</label>
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

              {/* Steam login button */}
              {!currentUser && (
                <button
                  onClick={async () => {
                    if (!window.api?.openSteamLogin)
                      return showToast('error', 'Steam login not available');
                    const ok = await window.api.openSteamLogin();
                    if (!ok) showToast('warning', 'Steam login cancelled or failed');
                  }}
                  className="muted-btn hover:muted-btn-hover active:muted-btn-active w-full flex items-center justify-center gap-3"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg"
                    alt="Steam"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="font-bold">Sign in with Steam</span>
                </button>
              )}

              {currentUser && (
                <div className="mt-4 p-3 bg-surface2 rounded-md">
                  <div className="font-medium">Signed in:</div>
                  <div className="flex items-center gap-3 mt-2">
                    {currentUser.avatar_full && (
                      <img
                        src={currentUser.avatar_full}
                        alt="avatar"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    )}
                    <div className="flex flex-col">
                      <div className="font-bold">{currentUser.persona_name}</div>
                      <a
                        href={currentUser.profile_url}
                        onClick={(e) => {
                          e.preventDefault();
                          window.api?.openExternalBrowser?.(currentUser.profile_url);
                        }}
                        className="text-sm text-(--ctp-lavender) hover:opacity-80 font-medium mt-1 cursor-pointer"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteUser}
                    className="mt-2 muted-btn hover:muted-btn-hover active:muted-btn-active w-full text-center"
                  >
                    Delete User
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
