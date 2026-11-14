/**
 * Glassmorphic Badge / StatusPill
 * Variants:
 * - green: bg #E3F2D9, text #4C8A3A
 * - blue: bg #DCE8FB, text #3B5FB0
 * - red: bg #FBE3DC, text #C2492E
 * - amber: bg #FCEBD0, text #9A6410
 * - lavender / primary: bg #E3E6FB, text #4F5BD5
 * - neutral: white/80, text #6B7194
 * Radius: rounded-full
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const variantClasses = {
    green: 'bg-[#E3F2D9] text-[#4C8A3A] border border-[#D5EAC8]',
    blue: 'bg-[#DCE8FB] text-[#3B5FB0] border border-[#CDE0FA]',
    red: 'bg-[#FBE3DC] text-[#C2492E] border border-[#F6D0C5]',
    amber: 'bg-[#FCEBD0] text-[#9A6410] border border-[#F8DEC0]',
    lavender: 'bg-[#E3E6FB] text-[#4F5BD5] border border-[#D4D8F7]',
    primary: 'bg-[#E3E6FB] text-[#4F5BD5] border border-[#D4D8F7]',
    neutral: 'bg-white/80 text-[#6B7194] border border-white/70 shadow-2xs',
    // Compatibility aliases for existing pages
    violet: 'bg-[#E3E6FB] text-[#4F5BD5] border border-[#D4D8F7]',
    teal: 'bg-[#E3F2D9] text-[#4C8A3A] border border-[#D5EAC8]',
    pink: 'bg-[#FBE3DC] text-[#C2492E] border border-[#F6D0C5]',
  };

  const dotColorClasses = {
    green: 'bg-[#4C8A3A]',
    blue: 'bg-[#3B5FB0]',
    red: 'bg-[#C2492E]',
    amber: 'bg-[#9A6410]',
    lavender: 'bg-[#4F5BD5]',
    primary: 'bg-[#4F5BD5]',
    neutral: 'bg-[#6B7194]',
    violet: 'bg-[#4F5BD5]',
    teal: 'bg-[#4C8A3A]',
    pink: 'bg-[#C2492E]',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-medium',
    md: 'text-xs px-3 py-1 gap-1.5 font-semibold',
  };

  const resolvedVariant = variantClasses[variant] ? variant : 'neutral';

  return (
    <span
      className={`inline-flex items-center rounded-full font-sans transition-all duration-200 select-none ${
        variantClasses[resolvedVariant]
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColorClasses[resolvedVariant] || 'bg-current'
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export const StatusPill = Badge;
