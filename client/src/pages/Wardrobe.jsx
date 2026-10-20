import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Wardrobe() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.name || 'Guest';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👗</span>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            OutWear
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-800/70 border border-slate-700 backdrop-blur rounded-2xl p-8 shadow-xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl">
            ✨
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Welcome, {displayName}!
            </h1>
            <p className="text-slate-400 text-sm">
              Your smart wardrobe dashboard is ready. Wardrobe items, outfit planner, and wear tracker will appear here.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left text-xs font-mono space-y-1.5">
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Session Details</div>
            <div className="flex justify-between">
              <span className="text-slate-400">User ID:</span>
              <span className="text-slate-300 truncate max-w-[200px]">{user?.id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="text-indigo-400">{user?.email || '—'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100 text-sm font-medium transition cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </main>
    </div>
  );
}
