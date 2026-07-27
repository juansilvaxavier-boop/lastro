export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}
