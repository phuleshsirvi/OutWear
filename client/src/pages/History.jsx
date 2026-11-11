import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getWearHistory, deleteWearLog } from '../api/wear.js';

function formatWearDate(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (str === todayStr) return 'Today';
  if (str === yesterdayStr) return 'Yesterday';

  const [year, month, day] = str.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const CATEGORY_EMOJI = {
  top: '👕',
  bottom: '👖',
  dress: '👗',
  ethnic: '🥻',
  outerwear: '🧥',
  shoes: '👟',
  accessory: '👜',
};

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Undo confirmation modal state
  const [logToUndo, setLogToUndo] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoError, setUndoError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getWearHistory(50);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load wear history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleConfirmUndo = async () => {
    if (!logToUndo) return;
    setIsUndoing(true);
    setUndoError('');

    try {
      await deleteWearLog(logToUndo.id);
      setLogs((prev) => prev.filter((l) => l.id !== logToUndo.id));
      setToastMessage(`✓ Wear log for "${logToUndo.name}" undone successfully.`);
      setLogToUndo(null);

      setTimeout(() => {
        setToastMessage('');
      }, 3500);
    } catch (err) {
      setUndoError(err.message || 'Failed to undo wear log. Please try again.');
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Success Toast */}
      {toastMessage && (
        <div
          role="status"
          className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-400 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-400 hover:text-emerald-300 text-xs ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Wear History
            </h1>
            {!loading && !error && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-medium">
                {logs.length} {logs.length === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Timeline of worn items and outfits. Track wearing habits and undo accidental logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/wardrobe"
            className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Wardrobe
          </Link>
          <Link
            to="/outfits"
            className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition"
          >
            Outfits
          </Link>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 animate-pulse flex items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-slate-700/60 shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700/60 rounded w-40" />
                  <div className="h-3 bg-slate-700/40 rounded w-24" />
                </div>
              </div>
              <div className="h-8 bg-slate-700/40 rounded-xl w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">Unable to load wear history</h3>
            <p className="text-slate-400 text-sm max-w-sm">{error}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : logs.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl">
            📅
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">No wear logs recorded yet</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              Use the "Wore today" button on your wardrobe items or outfits to track your style routine.
            </p>
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <Link
              to="/wardrobe"
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
            >
              Go to Wardrobe
            </Link>
            <Link
              to="/outfits"
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-sm transition"
            >
              Go to Outfits
            </Link>
          </div>
        </div>
      ) : (
        /* Logs List */
        <div className="space-y-3">
          {logs.map((log) => {
            const isOutfit = log.type === 'outfit';
            const emoji = isOutfit
              ? '👔'
              : CATEGORY_EMOJI[log.category?.toLowerCase()] || '👗';

            return (
              <div
                key={log.id}
                className="rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600/80 p-3.5 sm:p-4 shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Photo & Log Info */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shrink-0 flex items-center justify-center">
                    {log.photo || log.imageUrl ? (
                      <img
                        src={log.photo || log.imageUrl}
                        alt={log.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl select-none">{emoji}</span>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                          isOutfit
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {isOutfit ? 'Outfit' : 'Item'}
                      </span>
                      {log.occasion && (
                        <span className="text-[11px] text-slate-400 capitalize">
                          · {log.occasion}
                        </span>
                      )}
                      {log.category && (
                        <span className="text-[11px] text-slate-400 capitalize">
                          · {log.category}
                        </span>
                      )}
                    </div>

                    <h3
                      className="text-sm sm:text-base font-semibold text-slate-100 truncate"
                      title={log.name}
                    >
                      {log.name}
                    </h3>

                    {isOutfit && log.items?.length > 0 && (
                      <p className="text-xs text-slate-400 truncate">
                        {log.items.map((i) => i.name).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Undo Action */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                  <div className="text-left sm:text-right">
                    <div className="text-xs sm:text-sm font-semibold text-slate-200">
                      {formatWearDate(log.date || log.wornAt)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {new Date(log.date || log.wornAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUndoError('');
                      setLogToUndo(log);
                    }}
                    title="Undo this wear record"
                    className="py-1.5 px-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>↺</span>
                    <span>Undo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {logToUndo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !isUndoing && setLogToUndo(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xl">
              ↺
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-100">
                Undo Wear Log?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Are you sure you want to remove the wear log for{' '}
                <span className="font-semibold text-slate-200">
                  "{logToUndo.name}"
                </span>{' '}
                on {formatWearDate(logToUndo.date || logToUndo.wornAt)}? This will decrement wear counts and recalculate last-worn dates.
              </p>
            </div>

            {undoError && (
              <div
                role="alert"
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-left"
              >
                {undoError}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isUndoing}
                onClick={() => setLogToUndo(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm transition border border-slate-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUndoing}
                onClick={handleConfirmUndo}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
              >
                {isUndoing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Undoing...</span>
                  </>
                ) : (
                  <span>Undo Wear</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

