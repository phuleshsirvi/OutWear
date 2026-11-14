/**
 * Glassmorphic Label
 * Clean, accessible typography for form inputs.
 */
export default function Label({ htmlFor, required = false, children, className = '', ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-semibold text-[#1E2140] tracking-wide select-none font-sans ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-[#4F5BD5] ml-1">*</span>}
    </label>
  );
}
