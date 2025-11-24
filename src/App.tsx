import { useEffect, useState } from 'react';

import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Setup from './pages/Setup';

// Define a type for the pages we can navigate to
type Page = 'setup' | 'dashboard' | 'library' | 'log';

export default function App() {
  const [page, setPage] = useState<Page>('setup');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [apiKey, user] = await Promise.all([
          window.api?.loadApiKey?.(),
          window.api?.getUser?.(),
        ]);

        if (apiKey && user) setPage('dashboard');
        else setPage('setup');
      } catch (err) {
        console.error('Error checking initial page:', err);
        setPage('setup');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="w-screen h-screen flex items-center justify-center text-white">Loading…</div>
    );

  return (
    <div className="w-screen h-screen">
      {page === 'setup' && <Setup navigate={setPage} />}
      {page === 'dashboard' && <Dashboard navigate={setPage} />}
      {page === 'library' && <Library navigate={setPage} />}
    </div>
  );
}
