import { forwardRef } from 'react';
import Label from './Label.jsx';

/**
 * Glassmorphic Select
 * White frosted surface, rounded-2xl, indigo focus ring, custom chevron, and clear error state.
 */
export const Select = forwardRef(function Select(
  {
    id,
    label,
    required = false,
    error,
    helperText,
    children,
    className = '',
    disabled = false,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 font-sans">
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}

      <div className="relative rounded-2xl">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full min-h-[44px] rounded-2xl bg-white/80 hover:bg-white focus:bg-white text-[#1E2140] text-sm px-4 py-2.5 pr-10 appearance-none transition-all duration-200 border cursor-pointer shadow-xs ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]'
              : 'border-white/80 hover:border-white focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/25 focus:shadow-[0_0_0_3px_rgba(79,91,213,0.12)]'
          } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {children}
        </select>

        {/* Custom Chevron Icon */}
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B7194]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-[#C2492E] font-medium flex items-center gap-1 mt-1">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7194] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
