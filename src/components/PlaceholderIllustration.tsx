/** Ilustracao placeholder (ceu + colinas) usada em cards de imovel/construtora e no avatar do usuario. */
export function PlaceholderIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="200" height="100" fill="#dbeafe" />
      <circle cx="150" cy="28" r="14" fill="#eff6ff" />
      <circle cx="160" cy="24" r="10" fill="#eff6ff" />
      <circle cx="30" cy="20" r="10" fill="#eff6ff" />
      <circle cx="40" cy="24" r="7" fill="#eff6ff" />
      <path d="M0 70 Q 40 40 80 68 T 160 60 T 200 68 V100 H0 Z" fill="#86b466" />
      <path d="M0 82 Q 50 58 100 80 T 200 76 V100 H0 Z" fill="#5f9448" />
      <circle cx="70" cy="60" r="1.6" fill="#3f6b30" />
      <line x1="70" y1="60" x2="70" y2="66" stroke="#3f6b30" strokeWidth="1" />
    </svg>
  );
}
