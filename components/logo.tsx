import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "text-only" | "icon-text";
}

const sizeClasses = {
  sm: "text-base sm:text-lg",
  md: "text-lg sm:text-xl md:text-2xl",
  lg: "text-xl sm:text-2xl md:text-3xl",
};

const iconSizeClasses = {
  sm: "w-5 h-5",
  md: "w-6 h-6 sm:w-7 sm:h-7",
  lg: "w-7 h-7 sm:w-8 sm:h-8",
};

export default function Logo({ 
  href = "/", 
  className,
  size = "md",
  variant = "text-only"
}: LogoProps) {
  const textStyle = {
    background: "linear-gradient(90deg, #EDEEF0 0%, #D1D5DB 50%, #EDEEF0 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textFillColor: "transparent",
  };

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      {variant === "icon-text" && (
        <div 
          className={cn(
            "rounded-md flex items-center justify-center flex-shrink-0",
            iconSizeClasses[size]
          )}
          style={{
            background: "linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)",
          }}
        >
          <div 
            className="w-2/3 h-2/3 rounded-sm"
            style={{ backgroundColor: "#0B0D10" }}
          ></div>
        </div>
      )}
      <span 
        className={cn(
          "font-bold tracking-[0.02em]",
          sizeClasses[size]
        )}
        style={textStyle}
      >
        Creatr
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
