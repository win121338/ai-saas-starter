"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function StatusRefresher() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(timer);
  }, [router]);
  return (
    <p className="text-xs text-muted-foreground">
      This page refreshes every 10 seconds while your job is running.
    </p>
  );
}
