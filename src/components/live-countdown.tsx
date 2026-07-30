"use client";

import { useEffect, useMemo, useState } from "react";

type LiveCountdownProps = {
  className: string;
  eventDate: string;
  eventTime: string;
};

type CountdownValue = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const emptyCountdown: CountdownValue = {
  days: "--",
  hours: "--",
  minutes: "--",
  seconds: "--"
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function calculateCountdown(targetTime: number, now: number): CountdownValue {
  const distance = Math.max(0, targetTime - now);

  return {
    days: String(Math.floor(distance / 86_400_000)),
    hours: pad(Math.floor((distance / 3_600_000) % 24)),
    minutes: pad(Math.floor((distance / 60_000) % 60)),
    seconds: pad(Math.floor((distance / 1_000) % 60))
  };
}

export function LiveCountdown({
  className,
  eventDate,
  eventTime
}: LiveCountdownProps) {
  const targetTime = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return null;
    }

    const normalizedTime = eventTime || "00:00";
    const timeWithSeconds =
      normalizedTime.length === 5 ? `${normalizedTime}:00` : normalizedTime;
    const date = new Date(`${eventDate}T${timeWithSeconds}`);

    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }, [eventDate, eventTime]);
  const [countdown, setCountdown] = useState<CountdownValue>(emptyCountdown);

  useEffect(() => {
    if (targetTime === null) {
      setCountdown(emptyCountdown);
      return;
    }

    const updateCountdown = () => {
      setCountdown(calculateCountdown(targetTime, Date.now()));
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [targetTime]);

  return (
    <div className={className} aria-label="Conto alla rovescia dell’evento">
      <div>
        <strong>{countdown.days}</strong>
        <span>Giorni</span>
      </div>
      <div>
        <strong>{countdown.hours}</strong>
        <span>Ore</span>
      </div>
      <div>
        <strong>{countdown.minutes}</strong>
        <span>Minuti</span>
      </div>
      <div>
        <strong>{countdown.seconds}</strong>
        <span>Secondi</span>
      </div>
    </div>
  );
}
