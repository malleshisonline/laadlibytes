// A hamper's `accentColor` is a theme token name (HAMPER_ACCENT_COLORS in the backend), mapped here to token
// classes. Full class strings, so Tailwind sees every one. Unknown or missing tokens fall back to caramel.
const HAMPER_ACCENT_CLASSES = {
  caramel: { band: 'bg-caramel-500', text: 'text-caramel-700', ring: 'ring-caramel-500/40', border: 'border-caramel-500' },
  cocoa: { band: 'bg-cocoa-900', text: 'text-cocoa-900', ring: 'ring-cocoa-900/30', border: 'border-cocoa-900' },
  leaf: { band: 'bg-leaf-600', text: 'text-leaf-600', ring: 'ring-leaf-600/30', border: 'border-leaf-600' },
  peacock: { band: 'bg-peacock-600', text: 'text-peacock-600', ring: 'ring-peacock-600/30', border: 'border-peacock-600' },
  navy: { band: 'bg-navy-800', text: 'text-navy-800', ring: 'ring-navy-800/30', border: 'border-navy-800' },
}

export const hamperAccentClasses = (accentColor) => HAMPER_ACCENT_CLASSES[accentColor] ?? HAMPER_ACCENT_CLASSES.caramel

export default hamperAccentClasses