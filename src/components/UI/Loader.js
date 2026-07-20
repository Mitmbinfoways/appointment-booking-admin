import React from "react";

const Loader = ({ size = "md", speed = "normal", variant = "blue" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-8 h-8 border-[3px]",
    xl: "w-12 h-12 border-4",
  };

  const variantClasses = {
    white: "border-white border-t-transparent",
    blue: "border-blue-600 border-t-transparent",
    gray: "border-gray-600 border-t-transparent",
  };

  const speedDurations = {
    slow: 2000,
    normal: 1000,
    fast: 500,
  };

  const isCustomSpeed = typeof speed === "number";
  const animationDuration = isCustomSpeed
    ? speed
    : speedDurations[speed] || speedDurations.normal;

  const animationStyle = {
    animation: `spin ${animationDuration}ms linear infinite`,
  };

  return (
    <div
      className={`${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.blue} border-solid rounded-full`}
      style={animationStyle}
    ></div>
  );
};

export default Loader;
