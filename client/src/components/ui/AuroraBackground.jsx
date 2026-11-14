/**
 * GlassBackground / AuroraBackground
 * Fixed decorative background with lavender-to-mint gradient
 * (#C9CCF5 to #DDE0F7 to #CFE6E0) and a faint hex pattern overlay at low opacity.
 */
export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none"
    >
      {/* Fixed Lavender-to-Mint Gradient Layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #C9CCF5 0%, #DDE0F7 50%, #CFE6E0 100%)',
        }}
      />

      {/* Faint Hex Pattern Overlay at Low Opacity */}
      <div className="absolute inset-0 glass-pattern-overlay" />
    </div>
  );
}

export const GlassBackground = AuroraBackground;
