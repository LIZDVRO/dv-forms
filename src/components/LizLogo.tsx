/** The LIZ logo as inline SVG, the same drawing as the lizbreakfree.org header, so it stays sharp at any size. */
export function LizLogo({ className = "" }: { className?: string }) {
  return (
    <svg role="img" aria-label="LIZ" viewBox="0 0 853 307" fill="#662D91" className={className}>
      <g transform="translate(14 -3) scale(.985 .97)">
        <path d="M25.9 157A115 115 0 0 1 126 56.9" fill="none" stroke="#662D91" strokeWidth="35" />
        <path d="M126 10L182 58L126 107Z" />
        <path d="M25.9 185A115 115 0 0 0 126 285.1" fill="none" stroke="#662D91" strokeWidth="35" />
        <path d="M154 285.1A115 115 0 0 0 254.1 185" fill="none" stroke="#662D91" strokeWidth="35" />
      </g>
      <path d="M375 43H399.5V282H547V303H375Z" />
      <path d="M574 43H598.5V303H574Z" />
      <path d="M629 43H832V65L655 281H832V303H629V281L806 65H629Z" />
    </svg>
  );
}
