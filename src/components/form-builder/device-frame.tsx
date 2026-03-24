"use client";

import { Monitor, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";

interface DeviceFrameProps {
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  children: React.ReactNode;
}

export function DeviceFrame({ device, onDeviceChange, children }: DeviceFrameProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">
      {/* Toggle */}
      <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
        <button
          onClick={() => onDeviceChange("desktop")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            device === "desktop"
              ? "bg-surface-container-lowest text-primary shadow-sm"
              : "text-on-surface/50 hover:text-on-surface/80"
          )}
        >
          <Monitor className="h-3.5 w-3.5" />
          Desktop
        </button>
        <button
          onClick={() => onDeviceChange("mobile")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            device === "mobile"
              ? "bg-surface-container-lowest text-primary shadow-sm"
              : "text-on-surface/50 hover:text-on-surface/80"
          )}
        >
          <Smartphone className="h-3.5 w-3.5" />
          Mobile
        </button>
      </div>

      {/* Frame */}
      <div
        className={cn(
          "rounded-2xl bg-white shadow-ambient overflow-hidden transition-all duration-300",
          device === "desktop" ? "w-full max-w-[900px]" : "w-[375px]"
        )}
        style={{ height: device === "desktop" ? "calc(100% - 60px)" : "calc(100% - 60px)" }}
      >
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
