/**
 * Glassmorphic Toast
 * Floating notification pill with frosted white glass and pastel status accents.
 */
export default function Toast({
  message,
  type = 'info', // success | error | info | warning
  onDismiss,
  className = '',
}) {
  if (!message) return null;

  const typeConfig = {
    success: {
      border: 'border-[#D5EAC8]',
      badge: 'bg-[#E3F2D9] text-[#4C8A3A]',
      icon: '✓',
    },
    error: {
      border: 'border-[#F6D0C5]',
      badge: 'bg-[#FBE3DC] text-[#C2492E]',
      icon: '⚠️',
    },
    info: {
      border: 'border-[#D4D8F7]',
      badge: 'bg-[#E3E6FB] text-[#4F5BD5]',
      icon: '✨',
    },
    warning: {
      border: 'border-[#F8DEC0]',
      badge: 'bg-[#FCEBD0] text-[#9A6410]',
      icon: '🔔',
    },
  };

  const current = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto max-w-[calc(100vw-32px)] sm:max-w-md z-50 animate-fade-in font-sans ${className}`}
    >
      <div
        className={`px-4 py-3 rounded-2xl shadow-[0_12px_40px_rgba(99,102,241,0.16)] flex items-center justify-between space-x-3 text-sm font-medium bg-white/90 border backdrop-blur-xl text-[#1E2140] ${current.border}`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none shadow-xs ${current.badge}`}
          >
            {current.icon}
          </span>
          <span className="truncate">{message}</span>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss toast"
            className="ml-2 text-[#6B7194] hover:text-[#1E2140] transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/60 shrink-0"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
