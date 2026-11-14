import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Calendar, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { getUnderused } from '../api/items.js';
import { logItemWear } from '../api/wear.js';
import { CATEGORIES } from '../constants/wardrobe.js';
import { getColorInfo } from '../constants/colors.js';
import {
  Button,
  StatusPill,
  Toast,
  EmptyState,
  Skeleton,
  Select,
  SegmentedControl,
} from '../components/ui/index.js';

// Category emojis
const CATEGORY_EMOJI = {
  top: '👕',
  bottom: '👖',
  dress: '👗',
  ethnic: '🥻',
  outerwear: '🧥',
  shoes: '👟',
  accessory: '👜',
};

function formatLabel(str) {
  if (!str) return '';
  return str.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

// ─── Single Underused Item Card in Product Card Style ────────────────────────
function UnderusedCard({ item, onWorn }) {
  const [loggingWear, setLoggingWear] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState('');
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));
  const isNeverWorn = item.lastWornAt === null;
  const categoryKey = item.category?.toLowerCase() || '';
  const emoji = CATEGORY_EMOJI[categoryKey] || '👗';
  const colorInfo = getColorInfo(item.color);

  useEffect(() => {
    return () => {
      if (toastRef.current) clearTimeout(toastRef.current);
    };
  }, []);

  function showToast(message, type = 'success') {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 3200);
  }

  async function handleLogWear(customDate) {
    setLoggingWear(true);
    try {
      await logItemWear(item.id, customDate || undefined);
      showToast(`✓ ${customDate ? `Logged for ${customDate}` : 'Logged for today'}!`, 'success');
      setShowDatePicker(false);
      setPickedDate('');
      // Smoothly remove item from underused list after short confirmation delay
      setTimeout(() => onWorn(item.id), 1100);
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
    <div className="relative group rounded-3xl bg-white/75 border border-white/70 hover:border-white shadow-[0_10px_30px_rgba(99,102,241,0.06)] hover:shadow-[0_14px_40px_rgba(99,102,241,0.12)] transition-all duration-300 overflow-hidden flex flex-col font-sans hover:-translate-y-1 backdrop-blur-xl p-3 space-y-3">
      {/* Photo with 4:5 aspect ratio in rounded inner frame */}
      <div className="relative aspect-[4/5] w-full bg-white/40 rounded-2xl overflow-hidden flex items-center justify-center border border-white/60">
        {!imgError && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/50 p-4 text-center select-none">
            <span className="text-4xl mb-1.5 filter drop-shadow-xs">{emoji}</span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#6B7194] font-semibold">
              {item.category}
            </span>
          </div>
        )}

        {/* Soft bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        {/* Underuse Badges: "Never worn" (amber) and "Not worn for N days" (red-soft) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isNeverWorn ? (
            <StatusPill variant="amber" size="sm" dot className="shadow-xs">
              Never worn{item.daysOwned !== undefined ? ` · ${item.daysOwned}d owned` : ''}
            </StatusPill>
          ) : (
            <StatusPill variant="red" size="sm" dot className="shadow-xs">
              Not worn for {item.daysSinceWorn} days
            </StatusPill>
          )}
        </div>

        {/* Quick Edit round icon link */}
        <div className="absolute top-2.5 right-2.5 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Link
            to={`/wardrobe/${item.id}/edit`}
            title="Edit item"
            aria-label={`Edit ${item.name}`}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/90 text-[#6B7194] hover:text-[#4F5BD5] shadow-xs transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Card body */}
      <div className="p-1 flex flex-col flex-1 justify-between space-y-2.5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#4F5BD5] uppercase tracking-wider font-heading truncate">
              {item.category}
            </span>
            <span className="text-[11px] text-[#6B7194] font-mono shrink-0 ml-1">
              {item.wearCount === 0 ? '0 wears' : `Worn ${item.wearCount}x`}
            </span>
          </div>

          <h3
            className="text-sm font-bold font-heading text-[#1E2140] truncate"
            title={item.name}
          >
            {item.name}
          </h3>

          <div className="flex items-center space-x-1.5 text-xs text-[#6B7194] min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
              style={{ backgroundColor: colorInfo.hex }}
            />
            <span className="truncate capitalize">{item.color}</span>
          </div>
        </div>

        {/* Full-width white rounded "Wore today" button with icon */}
        <div className="pt-2 border-t border-[#E3E6FB]/80 space-y-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleLogWear()}
              disabled={loggingWear}
              aria-label={`Log wear for ${item.name}`}
              className="flex-1 min-h-[44px] py-2.5 px-3 rounded-2xl bg-white hover:bg-white/90 text-[#1E2140] border border-white/90 shadow-xs hover:shadow-md transition-all duration-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#4C8A3A]" />
              <span>{loggingWear ? 'Logging...' : 'Wore today'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDatePicker((v) => !v)}
              title="Pick custom date"
              aria-label="Pick custom wear date"
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-2xl border text-xs transition-all duration-200 cursor-pointer shrink-0 shadow-xs ${
                showDatePicker
                  ? 'bg-[#4F5BD5] text-white border-[#4F5BD5] shadow-md shadow-[#4F5BD5]/20'
                  : 'bg-white hover:bg-white/90 text-[#6B7194] hover:text-[#1E2140] border-white/90'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          {showDatePicker && (
            <div className="flex items-center space-x-2 p-2 rounded-2xl bg-white/90 border border-white/90 shadow-sm animate-fade-in-up">
              <input
                type="date"
                max={todayStr}
                value={pickedDate}
                onChange={(e) => setPickedDate(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#E3E6FB] text-[#1E2140] text-xs focus:ring-2 focus:ring-[#4F5BD5]/25 focus:border-[#4F5BD5] focus:outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!pickedDate || loggingWear}
                onClick={() => handleLogWear(pickedDate)}
              >
                Log
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
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
      if (reqVersionRef.current !== version) return;
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
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, String(value));
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  }

  function handleItemWorn(itemId) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            underusedCount: Math.max(0, prev.underusedCount - 1),
            neverWornCount: Math.max(0, prev.neverWornCount - 1),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-[#1E2140]">
            Underused Clothes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7194] mt-1 font-sans">
            Items you haven't worn recently — give them some love or clear closet space
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button as={Link} to="/wardrobe" variant="secondary" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Wardrobe Grid</span>
          </Button>
          <Button as={Link} to="/suggest" variant="primary" size="sm" className="gap-1.5 shadow-[0_4px_16px_rgba(79,91,213,0.25)]">
            <Sparkles className="w-4 h-4" />
            <span>Style Me</span>
          </Button>
        </div>
      </div>

      {/* Controls: SegmentedControl for 30/60/90 days + category select */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        {/* SegmentedControl for 30/60/90 Days */}
        <div className="self-start">
          <SegmentedControl
            options={[
              { value: 30, label: '30 days' },
              { value: 60, label: '60 days' },
              { value: 90, label: '90 days' },
            ]}
            value={validDays}
            onChange={(d) => setParam('days', d)}
            aria-label="Underused day threshold"
          />
        </div>

        {/* Category Select */}
        <div className="w-full sm:w-56">
          <Select
            value={category}
            onChange={(e) => setParam('category', e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {formatLabel(cat)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Summary Card with Progress Bar Showing Percent Unused */}
      {!loading && !error && summary && (
        <div className="rounded-3xl bg-white/75 border border-white/70 p-5 sm:p-6 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex flex-wrap gap-6 items-center backdrop-blur-xl">
          {/* Underused items count */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center text-xl shadow-xs shrink-0">
              ⏰
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-[#1E2140]">
                {summary.underusedCount}{' '}
                <span className="text-[#6B7194] text-xs sm:text-sm font-normal">of</span>{' '}
                {summary.totalItems}
              </div>
              <div className="text-xs text-[#C2492E] font-semibold">
                Unworn past {validDays} days ({summary.percentUnused}%)
              </div>
            </div>
          </div>

          {/* Never worn count */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FCEBD0] text-[#9A6410] flex items-center justify-center text-xl shadow-xs shrink-0">
              🏷️
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-[#1E2140]">
                {summary.neverWornCount}
              </div>
              <div className="text-xs text-[#9A6410] font-semibold">Never worn pieces</div>
            </div>
          </div>

          {/* Progress Bar showing percent unused */}
          {summary.totalItems > 0 && (
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7194] font-medium">Wardrobe Inactive</span>
                <span className="text-[#C2492E] font-mono font-bold">
                  {summary.percentUnused}% Unused
                </span>
              </div>
              {/* Progress bar track & fill */}
              <div className="h-3 w-full rounded-full bg-[#E3E6FB]/50 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#9CC3F5] via-[#F5C98A] to-[#FBE3DC] transition-all duration-700 shadow-xs"
                  style={{ width: `${summary.percentUnused}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-white/70 border border-white/60 p-3 space-y-3 shadow-xs"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <div className="space-y-2 p-1">
                <Skeleton className="h-4 w-2/3 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-2xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans animate-fade-in-up">
          <div className="rounded-3xl bg-white/75 border border-white/70 backdrop-blur-xl p-8 shadow-[0_10px_40px_rgba(99,102,241,0.08)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FBE3DC] text-[#C2492E] flex items-center justify-center mx-auto shadow-xs">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading text-[#1E2140]">
                Unable to load underused items
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7194]">{error}</p>
            </div>
            <Button variant="secondary" onClick={() => fetchUnderused(validDays, category)}>
              Try again
            </Button>
          </div>
        </div>
      ) : summary?.totalItems === 0 ? (
        <EmptyState
          icon="👗"
          title="Your wardrobe is empty"
          description="Add items to your wardrobe first so you can discover which pieces are being neglected."
          actionText="Add First Item"
          actionLink="/wardrobe/add"
          actionAs={Link}
        />
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white/75 border border-white/70 p-10 sm:p-14 text-center space-y-4 backdrop-blur-xl shadow-[0_10px_35px_rgba(99,102,241,0.08)] max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#E3F2D9] text-[#4C8A3A] flex items-center justify-center text-3xl mx-auto shadow-xs">
            🎉
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-heading text-[#1E2140]">
              Outstanding! You've worn everything recently
            </h3>
            <p className="text-[#6B7194] text-xs sm:text-sm max-w-md mx-auto">
              All {summary.totalItems} of your {category ? formatLabel(category).toLowerCase() : 'wardrobe'} items have been worn within the last {validDays} days.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setParam('days', 30);
              setParam('category', '');
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-6">
          {items.map((item) => (
            <UnderusedCard key={item.id} item={item} onWorn={handleItemWorn} />
          ))}
        </div>
      )}
    </div>
  );
}
