type LibraryProps = {
  navigate: (page: 'setup' | 'dashboard' | 'library') => void;
};

export default function Library({ navigate }: LibraryProps) {
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Full Library</h1>
      <p className="text-gray-400">No library view implemented yet.</p>
      <button onClick={() => navigate('dashboard')} className="mt-4 btn-primary py-2 px-4 rounded">
        Back to Dashboard
      </button>
    </div>
  );
}
