"use client";

import { useEffect } from "react";

export default function ErrorMonitor() {
  useEffect(() => {
    function sendLog(payload: any) {
      try {
        void fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // ignore
      }
    }

    function handleError(event: ErrorEvent) {
      const payload = {
        type: "error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: typeof event.error === "object" ? (event.error?.stack ?? String(event.error)) : String(event.error),
        timestamp: Date.now()
      };
      console.error("Captured window error:", payload);
      sendLog(payload);
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const payload = {
        type: "unhandledrejection",
        reason: typeof reason === "object" ? (reason?.stack ?? JSON.stringify(reason)) : String(reason),
        timestamp: Date.now()
      };
      console.error("Captured unhandledrejection:", payload);
      sendLog(payload);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
