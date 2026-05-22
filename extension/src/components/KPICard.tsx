interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: "default" | "profit" | "loss" | "primary";
  loading?: boolean;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  accent = "default",
  loading = false,
}: KPICardProps) {
  const accentColors = {
    default: "text-text-primary",
    profit: "text-profit",
    loss: "text-loss",
    primary: "text-primary",
  };

  if (loading) {
    return (
      <div className="card-dark p-3">
        <div className="skeleton-dark h-3 w-16 mb-2" />
        <div className="skeleton-dark h-6 w-24 mb-1" />
        <div className="skeleton-dark h-3 w-20" />
      </div>
    );
  }

  return (
    <div className="card-dark p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-text-secondary">{icon}</span>}
        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-medium">
          {title}
        </p>
      </div>
      <p className={`font-mono text-lg font-bold ${accentColors[accent]}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] text-text-secondary mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
