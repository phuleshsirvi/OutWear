import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, RotateCcw, AlertCircle } from 'lucide-react';
import { getWearHistory, deleteWearLog } from '../api/wear.js';
import { Button, StatusPill, Modal, Toast, EmptyState, Skeleton } from '../components/ui/index.js';

function formatMonthHeader(dateStr) {
  if (!dateStr) return 'UNKNOWN DATE';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'UNKNOWN DATE';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

function formatLogDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatLogTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
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
  const [searchQuery, setSearchQuery] = useState('');

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
      setToastMessage(`Wear log for "${logToUndo.name}" undone successfully.`);
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

  // Filter logs by search query (name, category, occasion, items)
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      const nameMatch = log.name?.toLowerCase().includes(q);
      const categoryMatch = log.category?.toLowerCase().includes(q);
      const occasionMatch = log.occasion?.toLowerCase().includes(q);
      const itemsMatch = log.items?.some((i) => i.name?.toLowerCase().includes(q));
      return Boolean(nameMatch || categoryMatch || occasionMatch || itemsMatch);
    });
  }, [logs, searchQuery]);

  // Group logs by month: "OCTOBER 2026", "SEPTEMBER 2026"
  const monthGroups = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    filteredLogs.forEach((log) => {
      const rawDate = log.date || log.wornAt;
      const d = new Date(rawDate);
      const monthKey = !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : 'unknown';

      if (!groupMap.has(monthKey)) {
        const group = {
          monthKey,
          label: formatMonthHeader(rawDate),
          items: [],
        };
        groupMap.set(monthKey, group);
        groups.push(group);
      }
      groupMap.get(monthKey).items.push(log);
    });

    return groups;
  }, [filteredLogs]);

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 space-y-6 font-sans animate-fade-in-up">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onDismiss={() => setToastMessage('')}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1E2140] tracking-tight">
              Wear History
            </h1>
            {!loading && !error && (
              <StatusPill variant="primary" size="md" className="font-semibold shadow-xs">
                {logs.length} {logs.length === 1 ? 'record' : 'records'}
              </StatusPill>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#6B7194] mt-1 font-sans">
            Timeline of worn items and outfits. Track wearing habits and undo accidental logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button as={Link} to="/wardrobe" variant="secondary" size="sm">
            Wardrobe
          </Button>
          <Button as={Link} to="/outfits" variant="primary" size="sm">
            Outfits
          </Button>
        </div>
      </div>

      {/* Content Area: Table-style list inside glass card */}
      {loading ? (
        /* Loading Skeleton */
        <div className="rounded-3xl bg-white/75 border border-white/70 p-6 backdrop-blur-xl shadow-[0_10px_35px_rgba(99,102,241,0.08)] space-y-4">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white/60 border border-white/80 p-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-3xl bg-white/70 border border-rose-200 p-8 sm:p-12 text-center backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4 animate-fade-in-up">
          <div className="w-14 h-14 rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold font-heading text-[#1E2140]">Unable to load wear history</h3>
            <p className="text-xs sm:text-sm text-[#6B7194]">{error}</p>
          </div>
          <Button variant="secondary" onClick={fetchHistory}>
            Try again
          </Button>
        </div>
      ) : logs.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon="📅"
          title="No wear logs recorded yet"
          description="Use the 'Wore today' button on your wardrobe items or outfits to track your style routine."
          actionText="Go to Wardrobe"
          actionLink="/wardrobe"
          actionAs={Link}
          className="animate-fade-in-up"
        />
      ) : (
        /* Table-Style List in Glass Card */
        <div className="rounded-3xl bg-white/75 border border-white/70 backdrop-blur-xl p-4 sm:p-6 shadow-[0_10px_35px_rgba(99,102,241,0.08)] space-y-6">
          {/* Search Field */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7194]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by item or outfit name, category, or occasion..."
              className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 hover:bg-white focus:bg-white border border-white/80 text-[#1E2140] placeholder-[#6B7194] focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]/25 focus:border-[#4F5BD5] text-xs sm:text-sm shadow-xs transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 min-w-[44px] flex items-center justify-center text-[#6B7194] hover:text-[#1E2140] transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E3E6FB] bg-white/40 p-8 text-center space-y-2">
              <span className="text-2xl">🔍</span>
              <p className="text-sm font-semibold font-heading text-[#1E2140]">
                No records match "{searchQuery}"
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            </div>
          ) : (
            /* Groups under Month Labels like "OCTOBER 2026" */
            <div className="space-y-6">
              {monthGroups.map((group) => (
                <div key={group.monthKey} className="space-y-3">
                  {/* Month Label in Small Caps */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#E3E6FB]/80">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#4F5BD5] font-heading">
                      {group.label}
                    </span>
                    <span className="text-[11px] text-[#6B7194] font-medium">
                      {group.items.length} {group.items.length === 1 ? 'wear' : 'wears'}
                    </span>
                  </div>

                  {/* Table-Style List Rows */}
                  <div className="space-y-2.5">
                    {group.items.map((log) => {
                      const isOutfit = log.type === 'outfit';
                      const emoji = isOutfit
                        ? '👔'
                        : CATEGORY_EMOJI[log.category?.toLowerCase()] || '👗';

                      const rawDate = log.date || log.wornAt;

                      return (
                        <div
                          key={log.id}
                          className="rounded-2xl bg-white/70 hover:bg-white border border-white/80 p-3 sm:p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          {/* Photo & Name */}
                          <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white/60 border border-white/90 shrink-0 flex items-center justify-center shadow-xs">
                              {log.photo || log.imageUrl ? (
                                <img
                                  src={log.photo || log.imageUrl}
                                  alt={log.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <span className="text-2xl select-none">{emoji}</span>
                              )}
                            </div>

                            {/* Name & Subtitle */}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h3
                                className="text-sm sm:text-base font-bold font-heading text-[#1E2140] truncate"
                                title={log.name}
                              >
                                {log.name}
                              </h3>

                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6B7194]">
                                {log.category && (
                                  <span className="capitalize">{log.category}</span>
                                )}
                                {log.occasion && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize">{log.occasion}</span>
                                  </>
                                )}
                                {isOutfit && log.items?.length > 0 && (
                                  <span className="text-[11px] text-[#6B7194] truncate max-w-xs">
                                    • {log.items.map((i) => i.name).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Date, Type StatusPill & Ghost Undo Button */}
                          <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E3E6FB]/70 shrink-0">
                            {/* Date */}
                            <div className="text-left sm:text-right">
                              <div className="text-xs font-semibold text-[#1E2140]">
                                {formatLogDate(rawDate)}
                              </div>
                              <div className="text-[11px] text-[#6B7194] font-mono">
                                {formatLogTime(rawDate)}
                              </div>
                            </div>

                            {/* StatusPill for "Item" or "Outfit" */}
                            <StatusPill
                              variant={isOutfit ? 'lavender' : 'blue'}
                              size="sm"
                              dot
                              className="font-semibold shadow-2xs"
                            >
                              {isOutfit ? 'Outfit' : 'Item'}
                            </StatusPill>

                            {/* Ghost Undo Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUndoError('');
                                setLogToUndo(log);
                              }}
                              title="Undo this wear record"
                              aria-label={`Undo wear log for ${log.name}`}
                              className="text-[#6B7194] hover:text-[#C2492E] hover:bg-rose-50 gap-1.5 px-2.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Undo</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Undo Confirmation Modal */}
      <Modal
        isOpen={Boolean(logToUndo)}
        onClose={() => !isUndoing && setLogToUndo(null)}
        title="Undo Wear Log?"
        description={`Remove the wear log for "${logToUndo?.name}" on ${formatLogDate(
          logToUndo?.date || logToUndo?.wornAt
        )}?`}
      >
        <div className="space-y-4 pt-1 font-sans">
          <p className="text-xs text-[#6B7194]">
            This will decrement wear counts and recalculate last-worn dates for this item or outfit.
          </p>

          {undoError && (
            <div
              role="alert"
              className="text-xs text-[#C2492E] bg-[#FBE3DC] border border-rose-300 rounded-xl p-3"
            >
              ⚠️ {undoError}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isUndoing}
              onClick={() => setLogToUndo(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              loading={isUndoing}
              onClick={handleConfirmUndo}
            >
              Undo Wear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
