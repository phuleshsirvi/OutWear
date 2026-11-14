/**
 * Glassmorphic Card
 * Frosted white card with 65% opacity, 60% white border, backdrop blur,
 * rounded-3xl corners, and soft lavender tinted shadow.
 */
export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`rounded-3xl bg-white/65 border border-white/60 backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.12)] transition-all duration-200 overflow-hidden ${
        hover
          ? 'hover:bg-white/80 hover:border-white/85 hover:shadow-[0_16px_50px_rgba(99,102,241,0.16)] hover:-translate-y-0.5'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`p-5 sm:p-6 pb-3 border-b border-white/40 space-y-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`text-lg sm:text-xl font-bold font-heading text-[#1E2140] tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs sm:text-sm text-[#6B7194] font-sans ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 font-sans ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-5 sm:p-6 pt-3 border-t border-white/40 flex items-center justify-between font-sans ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
