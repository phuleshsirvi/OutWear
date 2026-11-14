/**
 * Glassmorphic PillTabs
 * Horizontal scrollable pill tabs with counts, icons, and smooth active indicator.
 */
export default function PillTabs({
  tabs = [], // [{ id, label, icon, count }]
  activeTab,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Navigation tabs',
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-inner select-none font-sans scrollbar-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.id)}
            className={`flex-shrink-0 px-4 py-2 min-h-[44px] rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center space-x-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]/40 ${
              isActive
                ? 'bg-white text-[#4F5BD5] shadow-[0_4px_16px_rgba(99,102,241,0.14)] -translate-y-0.5'
                : 'text-[#6B7194] hover:text-[#1E2140] hover:bg-white/50'
            }`}
          >
            {tab.icon && <span className="text-sm shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ml-1 transition-colors ${
                  isActive
                    ? 'bg-[#E3E6FB] text-[#4F5BD5]'
                    : 'bg-white/60 text-[#6B7194]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

