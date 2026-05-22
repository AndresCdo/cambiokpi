import {
  LayoutDashboard,
  Calculator,
  History,
  MessageSquare,
  Settings,
} from "lucide-react";

interface BottomNavProps {
  current: string;
  onNavigate: (route: any) => void;
  badge?: number;
}

const tabs = [
  { id: "dashboard", icon: LayoutDashboard, label: "Inicio" },
  { id: "calculator", icon: Calculator, label: "Calc" },
  { id: "history", icon: History, label: "Historial" },
  { id: "requests", icon: MessageSquare, label: "Solicitudes" },
  { id: "settings", icon: Settings, label: "Ajustes" },
];

export default function BottomNav({
  current,
  onNavigate,
  badge,
}: BottomNavProps) {
  return (
    <nav className="flex-shrink-0 border-t border-surface-border bg-surface">
      <div className="flex items-center justify-around py-1">
        {tabs.map((tab) => {
          const isActive = current === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative
                ${isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"}`}
            >
              <Icon size={16} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.id === "requests" && badge && badge > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 bg-loss text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
