/**
 * Glassmorphic Skeleton
 * Soft pulsing placeholder with frosted glass gradient effect.
 */
export default function Skeleton({ className = '', rounded = 'rounded-2xl', ...props }) {
  return (
    <div
      className={`animate-pulse bg-white/40 border border-white/40 backdrop-blur-sm ${rounded} ${className}`}
      {...props}
    />
  );
}
