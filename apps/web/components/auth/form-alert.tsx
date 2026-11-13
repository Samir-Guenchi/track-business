interface FormAlertProps {
  readonly message: string | null;
  readonly tone?: 'error' | 'success';
  readonly className?: string;
}

/** Announced to screen readers as soon as it appears. */
export function FormAlert({ message, tone = 'error', className }: FormAlertProps) {
  if (!message) return null;
  const toneClass = tone === 'error' ? 'border-stamp text-stamp' : 'border-tape text-tape';
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-control border px-3 py-2 text-sm ${toneClass} ${className ?? ''}`}
    >
      {message}
    </p>
  );
}
