export function AtlasMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 26 14 6h4l10 20h-6L16 13l-6 13H4Z" fill="currentColor" />
      <path d="M12 23h8" stroke="currentColor" strokeWidth="3" />
      <circle cx="16" cy="28" r="2" fill="var(--signal)" />
    </svg>
  );
}
