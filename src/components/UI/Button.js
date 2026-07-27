import React from "react";

const Button = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
  };

  const variantClasses = {
    primary:
      "bg-blue-500 text-white shadow-theme-xs hover:bg-blue-600 disabled:bg-blue-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
    warning:
      "bg-yellow-500/85 text-white shadow-theme-xs hover:bg-yellow-600/85 disabled:bg-yellow-300/80",
    danger:
      "bg-red-500/85 text-white shadow-theme-xs hover:bg-red-600/80 disabled:bg-red-300/80",
    success:
      "bg-green-500/85 text-white shadow-theme-xs hover:bg-green-600/80 disabled:bg-green-300/80",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${sizeClasses[size] || ""
        } ${variantClasses[variant] || ""} ${disabled ? "cursor-not-allowed opacity-50" : ""
        } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
