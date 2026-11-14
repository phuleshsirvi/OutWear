import { forwardRef } from 'react';
import Label from './Label.jsx';

/**
 * Glassmorphic Input
 * White frosted surface, rounded-2xl, indigo focus ring, and clear error state.
 */
export const Input = forwardRef(function Input(
  {
    id,
    label,
    required = false,
    error,
    helperText,
    prefixIcon,
    suffixIcon,
    className = '',
    type = 'text',
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 font-sans">
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}

      <div className="relative rounded-2xl">
        {prefixIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7194]">
            {prefixIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={`w-full min-h-[44px] rounded-2xl bg-white/80 hover:bg-white focus:bg-white text-[#1E2140] placeholder-[#6B7194]/60 text-sm px-4 py-2.5 transition-all duration-200 border shadow-xs ${
            prefixIcon ? 'pl-10' : ''
          } ${suffixIcon ? 'pr-12' : ''} ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]'
              : 'border-white/80 hover:border-white focus:border-[#4F5BD5] focus:ring-2 focus:ring-[#4F5BD5]/25 focus:shadow-[0_0_0_3px_rgba(79,91,213,0.12)]'
          } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {suffixIcon && (
          <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none text-[#6B7194]">
            {suffixIcon}
          </div>
        )}
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

export default Input;
