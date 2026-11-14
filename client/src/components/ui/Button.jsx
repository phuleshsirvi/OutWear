import { forwardRef } from 'react';

/**
 * Glassmorphic Button
 * Variants:
 * - primary: indigo with soft shadow
 * - secondary: frosted white with soft shadow
 * - ghost: transparent with hover glow
 * - danger: soft pastel red
 * Sizes: sm, md, lg
 * Radius: rounded-2xl
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    as: Component = 'button',
    type = 'button',
    ...props
  },
  ref
) {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium font-sans transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5] focus:ring-offset-2 focus:ring-offset-white/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none disabled:shadow-none';

  const variantClasses = {
    primary:
      'bg-[#4F5BD5] hover:bg-[#434EB9] active:bg-[#38429E] text-white shadow-[0_4px_16px_rgba(79,91,213,0.25)] hover:shadow-[0_6px_22px_rgba(79,91,213,0.35)] hover:-translate-y-0.5 active:translate-y-0 border border-[#4F5BD5]',
    secondary:
      'bg-white/80 hover:bg-white active:bg-white/95 text-[#1E2140] hover:text-[#4F5BD5] border border-white/80 shadow-[0_4px_16px_rgba(99,102,241,0.06)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.12)] backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0',
    ghost:
      'bg-transparent hover:bg-white/60 active:bg-white/80 text-[#1E2140] hover:text-[#4F5BD5] border border-transparent hover:-translate-y-0.5 active:translate-y-0',
    danger:
      'bg-[#FBE3DC] hover:bg-[#F9D5CB] text-[#C2492E] border border-[#F6D0C5] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
  };

  const sizeClasses = {
    sm: 'text-xs min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 rounded-xl gap-1.5',
    md: 'text-sm min-h-[44px] px-4 py-2.5 rounded-2xl gap-2 font-medium',
    lg: 'text-base min-h-[48px] px-6 py-3 rounded-2xl gap-2.5 font-semibold',
  };

  const isButtonElement = Component === 'button';
  const buttonProps = isButtonElement ? { type, disabled: disabled || loading } : {};

  return (
    <Component
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      {...buttonProps}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 text-current flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className={loading ? 'opacity-80' : ''}>{children}</span>
    </Component>
  );
});

export default Button;
