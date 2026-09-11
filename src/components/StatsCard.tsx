interface StatsCardProps {
  label: string;
  value: string;
  icon: string;
  borderColor: string;
  textColor: string;
}

export function StatsCard({ label, value, icon, textColor }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="text-xl text-brand" aria-hidden="true">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-textsec">{label}</div>
          <div className={`font-mono-nums mt-1 text-2xl font-semibold ${textColor}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}
