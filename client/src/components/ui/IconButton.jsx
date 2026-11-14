import { forwardRef } from 'react';

/**
 * Glassmorphic IconButton
 * Round white button with soft shadow, accessible tap target, and hover state.
 */
export const IconButton = forwardRef(function IconButton(
  {
    children,
    variant = 'white', // white | primary | ghost | danger
    size = 'md', // sm | md | lg
    disabled = false,
    className = '',
    as: Component = 'button',
    type = 'button',
    'aria-label': ariaLabel,
    title,
    ...props
  },
  ref
) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-full transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5] focus:ring-offset-2 focus:ring-offset-white/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none disabled:shadow-none';

  const variantClasses = {
    white:
      'bg-white/80 hover:bg-white active:bg-white/95 text-[#1E2140] hover:text-[#4F5BD5] border border-white/80 shadow-[0_4px_16px_rgba(99,102,241,0.08)] hover:shadow-[0_6px_20px_rgba(79,91,213,0.18)] hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md',
    primary:
      'bg-[#4F5BD5] hover:bg-[#434EB9] active:bg-[#38429E] text-white border border-[#4F5BD5] shadow-[0_4px_16px_rgba(79,91,213,0.30)] hover:shadow-[0_6px_22px_rgba(79,91,213,0.40)] hover:-translate-y-0.5 active:translate-y-0',
    ghost:
      'bg-transparent hover:bg-white/60 active:bg-white/80 text-[#1E2140] hover:text-[#4F5BD5] border border-transparent hover:-translate-y-0.5 active:translate-y-0',
    danger:
      'bg-[#FBE3DC] hover:bg-[#F9D5CB] text-[#C2492E] border border-[#F6D0C5] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
  };

  const sizeClasses = {
    sm: 'w-9 h-9 min-w-[36px] min-h-[36px] text-xs',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px] text-sm',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px] text-base',
  };

  const isButtonElement = Component === 'button';
  const buttonProps = isButtonElement ? { type, disabled } : {};

  return (
    <Component
      ref={ref}
      aria-label={ariaLabel || title}
      title={title || ariaLabel}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.white} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      {...buttonProps}
      {...props}
    >
      {children}
    </Component>
  );
});

export default IconButton;

