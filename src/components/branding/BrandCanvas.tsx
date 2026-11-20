import type { ReactNode } from "react";

type BrandCanvasProps = {
  children: ReactNode;
  className?: string;
  center?: boolean;
};

export function BrandCanvas({
  children,
  className = "",
  center = false,
}: BrandCanvasProps) {
  return (
    <div
      className={`brand-canvas flex min-h-full flex-1 flex-col ${center ? "items-center justify-center px-4 py-10" : ""} ${className}`}
    >
      {children}
    </div>
  );
}