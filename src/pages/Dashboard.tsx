import { List, Settings, SquareLibrary } from 'lucide-react';
import { FC } from 'react';

type DashboardProps = {
  navigate: (page: 'setup' | 'dashboard' | 'library' | 'log') => void;
};

const Dashboard: FC<DashboardProps> = ({ navigate }) => {
  return (
    <div className="w-full min-h-screen p-6 bg-gray-900">
      {/* Top-right navigation */}
      <div className="flex justify-end gap-4 mb-6">
        <button
          onClick={() => navigate('library')}
          className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-700 transition cursor-pointer"
          title="Library"
        >
          <SquareLibrary className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => navigate('log')}
          className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-700 transition cursor-pointer"
          title="Completed Log"
        >
          <List className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => navigate('setup')}
          className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-700 transition cursor-pointer"
          title="Setup"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Widgets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Widget 1: Total Games */}
        <div className="card p-6 rounded-xl shadow-xl border border-gray-700 transform hover:scale-[1.01] transition duration-300">
          <p className="text-sm font-medium text-gray-400">Total Games Owned</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">...</p>
        </div>

        {/* Widget 2: Total Playtime */}
        <div className="card p-6 rounded-xl shadow-xl border border-gray-700 transform hover:scale-[1.01] transition duration-300">
          <p className="text-sm font-medium text-gray-400">Total Playtime (Hours)</p>
          <p className="text-3xl font-bold text-green-400 mt-1">...</p>
        </div>

        {/* Widget 3: Completed Games */}
        <div className="card p-6 rounded-xl shadow-xl border border-gray-700 transform hover:scale-[1.01] transition duration-300">
          <p className="text-sm font-medium text-gray-400">Games Completed</p>
          <p className="text-3xl font-bold text-purple-400 mt-1">...</p>
        </div>

        {/* Widget 4: Completion Rate */}
        <div className="card p-6 rounded-xl shadow-xl border border-gray-700 transform hover:scale-[1.01] transition duration-300">
          <p className="text-sm font-medium text-gray-400">Completion Rate</p>
          <p className="text-3xl font-bold text-red-400 mt-1">...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
