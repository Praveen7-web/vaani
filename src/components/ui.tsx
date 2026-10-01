import React from "react";
import { Mic } from "lucide-react";

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "yellow" | "green" | "red" | "white";
  size?: "default" | "large";
  icon?: React.ReactNode;
}

export const BigButton: React.FC<BigButtonProps> = ({
  children,
  variant = "yellow",
  size = "default",
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseColors = {
    yellow: "bg-[#FFD600] text-black active:translate-x-1 active:translate-y-1 active:shadow-none",
    green: "bg-[#22C55E] text-white active:translate-x-1 active:translate-y-1 active:shadow-none",
    red: "bg-[#EF4444] text-white active:translate-x-1 active:translate-y-1 active:shadow-none",
    white: "bg-white text-black active:translate-x-1 active:translate-y-1 active:shadow-none",
  };

  const sizeClasses = {
    default: "min-h-[64px] px-6 py-4 text-xl font-bold rounded-2xl",
    large: "min-h-[80px] px-8 py-5 text-2xl font-extrabold rounded-2xl",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`
        border-3 border-black shadow-brutal flex items-center justify-center gap-3 transition-transform text-center
        ${sizeClasses[size]}
        ${baseColors[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed shadow-none" : "cursor-pointer"}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0 text-2xl">{icon}</span>}
      <span className="w-full flex flex-col items-center justify-center">{children}</span>
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`bg-white border-3 border-black shadow-brutal rounded-3xl p-6 ${className}`}
    {...props}
  >
    {children}
  </div>
);

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export const MicButton: React.FC<MicButtonProps> = ({
  isListening,
  onClick,
  disabled,
  label,
}) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label || (isListening ? "Listening" : "Start speaking")}
        className={`
          w-[130px] h-[130px] rounded-full border-3 border-black shadow-brutal flex items-center justify-center
          transition-all cursor-pointer relative
          ${
            isListening
              ? "bg-[#EF4444] text-white scale-105 animate-pulse"
              : "bg-[#FFD600] text-black hover:scale-102"
          }
          ${disabled ? "opacity-50 cursor-not-allowed shadow-none" : ""}
        `}
      >
        <Mic className={`w-14 h-14 ${isListening ? "animate-bounce" : ""}`} />
      </button>
      {label && (
        <span className="text-xl font-bold text-center select-none text-black">
          {label}
        </span>
      )}
    </div>
  );
};

interface BadgeProps {
  icon?: React.ReactNode;
  label: string;
  variant?: "green" | "yellow" | "red" | "gray";
}

export const Badge: React.FC<BadgeProps> = ({
  icon,
  label,
  variant = "yellow",
}) => {
  const variantStyles = {
    green: "bg-[#22C55E] text-white",
    yellow: "bg-[#FFD600] text-black",
    red: "bg-[#EF4444] text-white",
    gray: "bg-gray-200 text-black",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-black font-bold text-sm shadow-brutal-sm ${variantStyles[variant]}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
