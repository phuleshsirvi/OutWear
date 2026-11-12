import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getUnderused } from '../api/items.js';
import { logItemWear } from '../api/wear.js';
import { CATEGORIES } from '../constants/wardrobe.js';

// ─── Color helpers ────────────────────────────────────────────────────────────
const COLOR_MAP = {
  black: '#0f172a', white: '#f8fafc', red: '#ef4444', blue: '#3b82f6',
  green: '#22c55e', yellow: '#eab308', pink: '#ec4899', purple: '#a855f7',
  orange: '#f97316', brown: '#78350f', grey: '#6b7280', gray: '#6b7280',
  beige: '#e2d5c3', navy: '#1e3a8a', maroon: '#800000',
};
function getColorStyle(colorStr) {
  if (!colorStr) return { backgroundColor: '#94a3b8' };
  const n = colorStr.toLowerCase().trim();
  if (COLOR_MAP[n]) return { backgroundColor: COLOR_MAP[n], border: n === 'white' ? '1px solid #cbd5e1' : undefined };
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (n.includes(name)) return { backgroundColor: hex, border: name === 'white' ? '1px solid #cbd5e1' : undefined };
  }
  return { backgroundColor: '#94a3b8' };
}

// ─── Category emojis ─────────────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  top: '👕', bottom: '👖', dress: '👗', ethnic: '🥻',
  outerwear: '🧥', shoes: '👟', accessory: '👜',
};

function formatLabel(str) {
  if (!str) return '';
  return str.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

// ─── Single Underused Item Card ───────────────────────────────────────────────
function UnderusedCard({ item, onWorn }) {
  const [loggingWear, setLoggingWear] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState('');
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isNeverWorn = item.lastWornAt === null;
  const categoryKey = item.category?.toLowerCase() || '';
  const emoji = CATEGORY_EMOJI[categoryKey] || '👗';
  const colorStyle = getColorStyle(item.color);

  useEffect(() => {
    return () => { if (toastRef.current) clearTimeout(toastRef.current); };
  }, []);

  function showToast(message, type = 'success') {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleLogWear(customDate) {
    setLoggingWear(true);
    try {
      await logItemWear(item.id, customDate || undefined);
      showToast(`✓ ${customDate ? `Logged for ${customDate}` : 'Logged for today'}!`, 'success');
      setShowDatePicker(false);
      setPickedDate('');
      // Remove the card from the list after a short delay
      setTimeout(() => onWorn(item.id), 1200);
    } catch (err) {
      if (err.status === 409 || err.message?.includes('Already logged')) {
        showToast('⚠️ Already logged for this day', 'warning');
      } else {
        showToast(err.message || 'Failed to log wear', 'error');
      }
      setLoggingWear(false);
    }
  }

  return (
    <div className="relative group rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/40 shadow-md hover:shadow-indigo-500/10 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Photo */}
      <div className="relative aspect-[4/5] w-full bg-slate-900/60 overflow-hidden flex items-center justify-center">
        {!imgError && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 p-4 text-center select-none">
            <span className="text-4xl mb-1.5 drop-shadow">{emoji}</span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              {item.category}
            </span>
          </div>
        )}

        {/* Underuse badge */}
        <div className="absolute top-2 left-2 z-10">
          {isNeverWorn ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Never worn{item.daysOwned !== undefined ? ` · ${item.daysOwned}d owned` : ''}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
              {item.daysSinceWorn}d unworn
            </span>
          )}
        </div>

        {/* Edit button */}
        <div className="absolute top-2 right-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Link
            to={`/wardrobe/${item.id}/edit`}
            title="Edit item"
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-indigo-400 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 space-y-2.5">
        <div className="space-y-1">
          <div className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">
            {item.category}
          </div>
          <h3 className="text-sm font-semibold text-slate-100 truncate" title={item.name}>
            {item.name}
          </h3>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={colorStyle} />
          <span className="truncate capitalize">{item.color}</span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          {item.wearCount === 0
            ? 'Never worn'
            : `Worn ${item.wearCount}x`}
        </div>

        {/* Wore today + Pick a date */}
        <div className="pt-1.5 border-t border-slate-700/60 space-y-1.5">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => handleLogWear()}
              disabled={loggingWear}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              {loggingWear ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              ) : (
                <><span>👔</span><span>Wore today</span></>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowDatePicker((v) => !v)}
              title="Pick a date"
              className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                showDatePicker
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-700/80'
              }`}
            >
              📅
            </button>
          </div>

          {showDatePicker && (
            <div className="flex items-center space-x-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700">
              <input
                type="date"
                max={todayStr}
                value={pickedDate}
                onChange={(e) => setPickedDate(e.target.value)}
                className="flex-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={!pickedDate || loggingWear}
                onClick={() => handleLogWear(pickedDate)}
                className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition cursor-pointer"
              >
                Log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`absolute bottom-3 left-3 right-3 z-30 p-2.5 rounded-xl text-xs font-medium shadow-2xl border backdrop-blur-md flex items-center justify-between ${
          toast.type === 'warning' ? 'bg-amber-950/95 text-amber-300 border-amber-600/50'
          : toast.type === 'error' ? 'bg-red-950/95 text-red-300 border-red-600/50'
          : 'bg-emerald-950/95 text-emerald-300 border-emerald-600/50'
        }`}>
          <span className="truncate pr-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Underused Page ───────────────────────────────────────────────────────────
const DAYS_OPTIONS = [30, 60, 90];

export default function Underused() {
  const [searchParams, setSearchParams] = useSearchParams();
  const days = Number(searchParams.get('days')) || 30;
  const category = searchParams.get('category') || '';

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Track request version to ignore stale responses
  const reqVersionRef = useRef(0);

  const fetchUnderused = useCallback(async (d, cat) => {
    const version = ++reqVersionRef.current;
    setLoading(true);
    setError('');

    try {
      const data = await getUnderused({ days: d, category: cat || undefined });
      if (reqVersionRef.current !== version) return; // stale, discard
      setItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary || null);
    } catch (err) {
      if (reqVersionRef.current !== version) return;
      setError(err.message || 'Failed to load underused items');
    } finally {
      if (reqVersionRef.current === version) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnderused(days, category);
  }, [fetchUnderused, days, category]);

  function setParam(key, value) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, String(value));
      else next.delete(key);
      return next;
    }, { replace: true });
  }

  function handleItemWorn(itemId) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            underusedCount: Math.max(0, prev.underusedCount - 1),
            neverWornCount: Math.max(0, prev.neverWornCount - 1), // may overshoot if worn, doesn't matter
            percentUnused:
              prev.totalItems === 0
                ? 0
                : Math.round(((Math.max(0, prev.underusedCount - 1)) / prev.totalItems) * 100),
          }
        : prev
    );
  }

  const validDays = DAYS_OPTIONS.includes(days) ? days : 30;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Underused Clothes
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Items you haven't worn recently — give them some love or let them go
          </p>
        </div>
      </div>

      {/* Controls: Days segmented control + category select */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Segmented control */}
        <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-xl p-1 self-start">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setParam('days', d)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                validDays === d
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>

        {/* Category select */}
        <select
          value={category}
          onChange={(e) => setParam('category', e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs sm:text-sm transition self-start sm:self-auto"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{formatLabel(cat)}</option>
          ))}
        </select>
      </div>

      {/* Summary strip */}
      {!loading && !error && summary && (
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/80 p-4 flex flex-wrap gap-4 sm:gap-6 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center text-sm">
              ⏰
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">
                {summary.underusedCount} <span className="text-slate-400 text-sm font-normal">of</span> {summary.totalItems}
              </div>
              <div className="text-[11px] text-slate-400">items unused ({summary.percentUnused}%)</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm">
              🏷️
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">{summary.neverWornCount}</div>
              <div className="text-[11px] text-slate-400">never worn</div>
            </div>
          </div>
          {summary.totalItems > 0 && (
            <div className="flex-1 min-w-[120px]">
              <div className="text-[11px] text-slate-400 mb-1">Usage rate</div>
              <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${100 - summary.percentUnused}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden animate-pulse flex flex-col">
              <div className="aspect-[4/5] w-full bg-slate-700/50" />
              <div className="p-3.5 space-y-2.5">
                <div className="h-2.5 bg-slate-700/50 rounded w-1/3" />
                <div className="h-4 bg-slate-700/60 rounded w-3/4" />
                <div className="h-2.5 bg-slate-700/40 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl">⚠️</div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">Unable to load underused items</h3>
            <p className="text-slate-400 text-sm max-w-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchUnderused(validDays, category)}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : summary?.totalItems === 0 ? (
        /* User has no items at all */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl">👗</div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">Your wardrobe is empty</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              Add some items to your wardrobe first and then track which ones you're neglecting.
            </p>
          </div>
          <Link
            to="/wardrobe/add"
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
          >
            + Add First Item
          </Link>
        </div>
      ) : items.length === 0 ? (
        /* User has items but none are underused */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl">🎉</div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">Great! You've worn everything recently</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              All {summary.totalItems} of your {category ? formatLabel(category).toLowerCase() : 'wardrobe'} items have been worn within the last {validDays} days.
              Keep it up!
            </p>
          </div>
          <button
            onClick={() => { setParam('days', 30); setParam('category', ''); }}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {items.map((item) => (
            <UnderusedCard key={item.id} item={item} onWorn={handleItemWorn} />
          ))}
        </div>
      )}
    </div>
  );
}

