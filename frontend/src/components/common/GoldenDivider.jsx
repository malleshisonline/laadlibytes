// One half of the ornament, drawn left to right up to the centre. The right half is this, mirrored.
function DividerHalf() {
  return (
    <>
      {/* Tapering line: a hairline at the outer end, 1.5 units thick where it meets the flourish */}
      <path d="M2 12 L84 11.25 L84 12.75 Z" fill="currentColor" />
      {/* Leaf flourish */}
      <path
        d="M84 12 Q91 5.5 99 12 Q91 18.5 84 12 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Small curl rising from the leaf tip */}
      <path
        d="M99 12 C101 8.5 104.5 8 105 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Dot beside the centre diamond */}
      <circle cx="110" cy="12" r="1.6" fill="currentColor" />
    </>
  )
}

/**
 * Decorative golden ornament: line, flourish, a diamond between two dots, then the mirror image.
 * It draws in currentColor, so a text colour class recolours it (text-white on navy sections).
 * Without a `width` it is 160px wide on mobile and 240px from md up; it never outgrows its container.
 */
function GoldenDivider({ className = '', width }) {
  // Caramel by default, unless the caller passes its own text colour.
  const colourClass = className.includes('text-') ? '' : 'text-caramel-500'
  const sizeClass = width ? '' : 'w-40 md:w-60'

  return (
    <svg
      viewBox="0 0 240 24"
      width={width}
      aria-hidden="true"
      focusable="false"
      className={`mx-auto block h-auto max-w-full ${sizeClass} ${colourClass} ${className}`}
    >
      <DividerHalf />
      <g transform="translate(240 0) scale(-1 1)">
        <DividerHalf />
      </g>
      {/* Centre diamond */}
      <path d="M120 6.5 L125.5 12 L120 17.5 L114.5 12 Z" fill="currentColor" />
    </svg>
  )
}

export default GoldenDivider