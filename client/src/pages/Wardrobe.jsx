import { useAuth } from '../context/AuthContext.jsx';

export default function Wardrobe() {
  const { user } = useAuth();
  const displayName = user?.name || 'Guest';

  return (
    <div className="w-full flex justify-center py-8">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-8 shadow-xl text-center space-y-6">
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
