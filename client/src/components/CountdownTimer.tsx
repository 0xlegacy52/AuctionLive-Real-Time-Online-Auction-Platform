import { useState, useEffect } from "react";

interface Props {
  endTime: string;
  onEnd?: () => void;
  size?: "sm" | "md" | "lg";
}

function formatTime(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds };
}

export default function CountdownTimer({ endTime, onEnd, size = "md" }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, new Date(endTime).getTime() - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(endTime).getTime() - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onEnd?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  if (timeLeft === 0) {
    return <span className="text-red-600 font-semibold">Ended</span>;
  }

  const { days, hours, minutes, seconds } = formatTime(timeLeft);
  const isUrgent = timeLeft < 300000;
  const isCritical = timeLeft < 60000;

  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";

  if (size === "lg") {
    return (
      <div className="flex gap-3">
        {days > 0 && (
          <div className="text-center">
            <div className={`${textSize} font-bold tabular-nums ${isCritical ? "text-red-600 animate-pulse-fast" : isUrgent ? "text-orange-600" : "text-gray-900"}`}>
              {days}
            </div>
            <div className="text-xs text-gray-500 uppercase">Days</div>
          </div>
        )}
        <div className="text-center">
          <div className={`${textSize} font-bold tabular-nums ${isCritical ? "text-red-600 animate-pulse-fast" : isUrgent ? "text-orange-600" : "text-gray-900"}`}>
            {String(hours).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-500 uppercase">Hours</div>
        </div>
        <div className={`${textSize} font-bold ${isCritical ? "text-red-600" : "text-gray-400"}`}>:</div>
        <div className="text-center">
          <div className={`${textSize} font-bold tabular-nums ${isCritical ? "text-red-600 animate-pulse-fast" : isUrgent ? "text-orange-600" : "text-gray-900"}`}>
            {String(minutes).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-500 uppercase">Min</div>
        </div>
        <div className={`${textSize} font-bold ${isCritical ? "text-red-600" : "text-gray-400"}`}>:</div>
        <div className="text-center">
          <div className={`${textSize} font-bold tabular-nums ${isCritical ? "text-red-600 animate-pulse-fast" : isUrgent ? "text-orange-600" : "text-gray-900"}`}>
            {String(seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-500 uppercase">Sec</div>
        </div>
      </div>
    );
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);

  return (
    <span
      className={`${textSize} font-mono font-semibold tabular-nums ${
        isCritical ? "text-red-600 animate-pulse-fast" : isUrgent ? "text-orange-600" : "text-gray-700"
      }`}
    >
      {parts.join(" ")}
    </span>
  );
}
