"use client";

import { motion } from "framer-motion";
import ButtonLoader from "./ButtonLoader";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary:
    "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white",
  secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
  outline: "border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10",
  ghost: "text-white/70 hover:text-white hover:bg-white/10",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export default function LoadingButton({
  loading = false,
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      disabled={isDisabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        rounded-lg font-medium
        transition-all duration-200
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading && <ButtonLoader size={size} />}
      <span className={loading ? "opacity-70" : ""}>{children}</span>
    </motion.button>
  );
}
