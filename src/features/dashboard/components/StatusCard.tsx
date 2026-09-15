interface Props {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'bad';
}

const TONE_CLASSES: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'text-slate-900',
  good: 'text-emerald-700',
  bad: 'text-red-700',
};

/**
 * A single labelled metric. Uses <dl> rather than divs so the label/value
 * relationship is exposed to screen readers instead of being purely visual.
 */
export function StatusCard({ label, value, tone = 'neutral' }: Props) {
  return (
    <dl className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold ${TONE_CLASSES[tone]}`}>{value}</dd>
    </dl>
  );
}
