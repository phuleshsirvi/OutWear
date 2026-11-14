import Button from './Button.jsx';

/**
 * Glassmorphic EmptyState
 * Clean frosted card displaying helpful empty state with icon, message, and call-to-action.
 */
export default function EmptyState({
  icon = '👗',
  title = 'Nothing here yet',
  description = 'Get started by creating your first item or exploring features.',
  actionText,
  actionLink,
  onAction,
  actionAs,
  children,
  className = '',
}) {
  return (
    <div
      className={`rounded-3xl bg-white/65 border border-white/60 p-8 sm:p-12 text-center backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.12)] space-y-5 font-sans ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-[#E3E6FB] border border-[#D4D8F7] text-[#4F5BD5] flex items-center justify-center text-3xl mx-auto shadow-xs select-none">
        {icon}
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-xl font-bold font-heading text-[#1E2140] tracking-tight">{title}</h3>
        {description && <p className="text-sm text-[#6B7194] leading-relaxed">{description}</p>}
      </div>

      {actionText && (actionLink || onAction) && (
        <div className="pt-2 flex justify-center">
          <Button
            as={actionAs || (actionLink ? 'a' : 'button')}
            to={actionLink}
            href={actionLink}
            onClick={onAction}
            variant="primary"
            size="md"
          >
            {actionText}
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}
