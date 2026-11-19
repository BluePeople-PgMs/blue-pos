export function LogoPizza({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="14" fill="#f4d48a" stroke="#c47a2c" strokeWidth="2" />
      <circle cx="16" cy="16" r="10.5" fill="#d6453d" />
      <circle cx="16" cy="16" r="8.2" fill="#f6e27a" />
      <circle cx="12" cy="14" r="1.7" fill="#9a2d2d" />
      <circle cx="18.5" cy="12.5" r="1.5" fill="#9a2d2d" />
      <circle cx="17" cy="18.5" r="1.8" fill="#9a2d2d" />
      <circle cx="12.5" cy="19" r="1.15" fill="#3d6b45" />
      <circle cx="20" cy="16.5" r="1.05" fill="#3d6b45" />
    </svg>
  );
}
