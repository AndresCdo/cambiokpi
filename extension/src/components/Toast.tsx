import { CheckCircle, XCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle size={16} className="text-profit flex-shrink-0" />,
    error: <XCircle size={16} className="text-loss flex-shrink-0" />,
    info: <Info size={16} className="text-primary flex-shrink-0" />,
  };

  const borders = {
    success: "border-l-profit",
    error: "border-l-loss",
    info: "border-l-primary",
  };

  return (
    <div
      className={`toast border-l-2 ${borders[type]} cursor-pointer`}
      onClick={onClose}
    >
      <div className="flex items-center gap-2">
        {icons[type]}
        <span>{message}</span>
      </div>
    </div>
  );
}
