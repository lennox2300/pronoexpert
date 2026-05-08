interface StatsCardProps {
  label: string;
  value: string;
  icon: string;
  borderColor: string;
  textColor: string;
}

export function StatsCard({ label, value, icon, borderColor, textColor }: StatsCardProps) {
  return (
    <div className={`bg-gray-900 rounded-lg p-4 border-l-4 ${borderColor}`}>
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
          <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}
