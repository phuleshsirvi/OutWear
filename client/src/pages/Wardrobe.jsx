import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Wardrobe() {
  const { user } = useAuth();
  const location = useLocation();
  const displayName = user?.name || 'Guest';
  const successMessage = location.state?.message;

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 sm:py-8 space-y-6">
      {/* Success banner if navigated from AddItem */}
      {successMessage && (
        <div
          role="status"
          className="max-w-md w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-400 text-center flex items-center justify-center space-x-2"
        >
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl">
          ✨
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Welcome, {displayName}!
          </h1>
          <p className="text-slate-400 text-sm">
            Your smart wardrobe dashboard is ready. Wardrobe items and clothing collections will appear here.
          </p>
        </div>

        {/* Add Item Action Button */}
        <div>
          <Link
            to="/wardrobe/add"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer space-x-2"
          >
            <span>+</span>
            <span>Add Item</span>
          </Link>
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
      </div>
    </div>
  );
}
