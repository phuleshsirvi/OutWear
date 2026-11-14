import { useEffect } from 'react';
import IconButton from './IconButton.jsx';

/**
 * Glassmorphic Modal
 * Frosted white dialog with backdrop blur, rounded-3xl corners,
 * accessible escape key listener, and body scroll locking.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E2140]/30 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        className={`relative w-full ${maxWidth} bg-white/85 border border-white/75 rounded-3xl shadow-[0_20px_60px_rgba(99,102,241,0.20)] p-6 sm:p-8 space-y-4 animate-fade-in-up backdrop-blur-2xl z-10 ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            {title && (
              <h2
                id="modal-title"
                className="text-lg sm:text-xl font-bold font-heading text-[#1E2140] tracking-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-[#6B7194] font-sans">{description}</p>
            )}
          </div>

          {/* Close button */}
          {onClose && (
            <IconButton
              size="sm"
              variant="white"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          )}
        </div>

        {/* Content */}
        <div className="font-sans text-[#1E2140]">{children}</div>
      </div>
    </div>
  );
}
