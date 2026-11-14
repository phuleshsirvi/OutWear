/**
 * Glassmorphic SegmentedControl
 * White pill track with an elevated white active segment (like a Week/Month/Year toggle).
 */
export default function SegmentedControl({
  options = [], // array of strings or { value, label, icon }
  value,
  onChange,
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Segmented options',
}) {
  const sizeClasses = {
    sm: 'text-xs min-h-[36px] px-3 py-1',
    md: 'text-xs sm:text-sm min-h-[44px] px-4 py-1.5',
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-inner select-none font-sans gap-1 ${className}`}
    >
      {options.map((opt) => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        const optLabel = typeof opt === 'object' ? opt.label : opt;
        const optIcon = typeof opt === 'object' ? opt.icon : null;
        const isSelected = value === optValue;

        return (
          <button
            key={String(optValue)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange?.(optValue)}
            className={`rounded-full font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]/40 ${
              sizeClasses[size] || sizeClasses.md
            } ${
              isSelected
                ? 'bg-white text-[#4F5BD5] font-bold shadow-[0_2px_10px_rgba(99,102,241,0.14)] scale-100'
                : 'text-[#6B7194] hover:text-[#1E2140] hover:bg-white/40'
            }`}
          >
            {optIcon && <span className="text-sm shrink-0">{optIcon}</span>}
            <span>{optLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

