/**
 * src/hooks/useAlerts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time Price and Technical Indicator Alerting Engine for MyFinances.
 * Persists in localStorage and checks conditions on market price updates.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

export type AlertType =
  | "PRICE_ABOVE"
  | "PRICE_BELOW"
  | "RSI_OVERSOLD"
  | "RSI_OVERBOUGHT";

export type AlertStatus = "ACTIVE" | "TRIGGERED" | "DISMISSED";

export interface StockAlert {
  id: string;
  ticker: string;
  name: string;
  type: AlertType;
  threshold: number;
  status: AlertStatus;
  createdAt: string;
  triggeredAt?: string;
  lastCheckedPrice?: number;
  message?: string;
}

const STORAGE_KEY = "myfinances_stock_alerts";

export function useAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Save alerts to localStorage
  const persistAlerts = useCallback((newAlerts: StockAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
    } catch (e) {
      console.error("Failed to save alerts:", e);
    }
  }, []);

  // Ask for browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      setHasRequestedPermission(true);
      return permission === "granted";
    }
    return false;
  }, []);

  // Create a new alert
  const createAlert = useCallback(
    async (params: {
      ticker: string;
      name?: string;
      type: AlertType;
      threshold: number;
    }) => {
      const newAlert: StockAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ticker: params.ticker.trim().toUpperCase(),
        name: params.name || params.ticker.trim().toUpperCase(),
        type: params.type,
        threshold: Number(params.threshold),
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      const updated = [newAlert, ...alerts];
      persistAlerts(updated);

      toast.success(
        `Alerte configurée sur ${newAlert.ticker} (${getAlertLabel(newAlert.type, newAlert.threshold)})`,
      );

      // Proactively ask for notification permission on first alert creation
      if (!hasRequestedPermission) {
        requestNotificationPermission();
      }

      return newAlert;
    },
    [alerts, hasRequestedPermission, persistAlerts, requestNotificationPermission],
  );

  // Delete an alert
  const deleteAlert = useCallback(
    (id: string) => {
      const updated = alerts.filter((a) => a.id !== id);
      persistAlerts(updated);
      toast.success("Alerte supprimée");
    },
    [alerts, persistAlerts],
  );

  // Toggle active/dismissed
  const toggleAlert = useCallback(
    (id: string) => {
      const updated = alerts.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status: a.status === "ACTIVE" ? ("DISMISSED" as const) : ("ACTIVE" as const),
          };
        }
        return a;
      });
      persistAlerts(updated);
    },
    [alerts, persistAlerts],
  );

  // Dismiss triggered alert
  const dismissAlert = useCallback(
    (id: string) => {
      const updated = alerts.map((a) => {
        if (a.id === id) {
          return { ...a, status: "DISMISSED" as const };
        }
        return a;
      });
      persistAlerts(updated);
    },
    [alerts, persistAlerts],
  );

  // Check alerts against a price / indicator map
  const checkAlerts = useCallback(
    (quotes: Record<string, { price: number; rsi?: number }>) => {
      if (!alerts.length || !quotes) return;

      let hasChanges = false;
      const updated = alerts.map((alert) => {
        if (alert.status !== "ACTIVE") return alert;

        const q = quotes[alert.ticker];
        if (!q || typeof q.price !== "number" || q.price <= 0) return alert;

        let isTriggered = false;
        let msg = "";

        if (alert.type === "PRICE_ABOVE" && q.price >= alert.threshold) {
          isTriggered = true;
          msg = `${alert.name} a dépassé ${alert.threshold} € (cours actuel : ${q.price.toFixed(2)} €)`;
        } else if (alert.type === "PRICE_BELOW" && q.price <= alert.threshold) {
          isTriggered = true;
          msg = `${alert.name} est tombé sous ${alert.threshold} € (cours actuel : ${q.price.toFixed(2)} €)`;
        } else if (
          alert.type === "RSI_OVERSOLD" &&
          typeof q.rsi === "number" &&
          q.rsi <= alert.threshold
        ) {
          isTriggered = true;
          msg = `${alert.name} en survente extrême : RSI à ${q.rsi.toFixed(0)}`;
        } else if (
          alert.type === "RSI_OVERBOUGHT" &&
          typeof q.rsi === "number" &&
          q.rsi >= alert.threshold
        ) {
          isTriggered = true;
          msg = `${alert.name} en surachat : RSI à ${q.rsi.toFixed(0)}`;
        }

        if (isTriggered) {
          hasChanges = true;

          // In-App Toast
          toast(msg, {
            icon: "🔔",
            duration: 6000,
            style: {
              background: "#18181b",
              color: "#fff",
              border: "1px solid #8b5cf6",
            },
          });

          // Browser Push Notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`Alerte de cours : ${alert.ticker}`, {
                body: msg,
                icon: "/favicon.ico",
              });
            } catch (e) {
              console.error("Browser notification failed:", e);
            }
          }

          return {
            ...alert,
            status: "TRIGGERED" as const,
            triggeredAt: new Date().toISOString(),
            lastCheckedPrice: q.price,
            message: msg,
          };
        }

        return { ...alert, lastCheckedPrice: q.price };
      });

      if (hasChanges) {
        persistAlerts(updated);
      }
    },
    [alerts, persistAlerts],
  );

  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE"),
    [alerts],
  );
  const triggeredAlerts = useMemo(
    () => alerts.filter((a) => a.status === "TRIGGERED"),
    [alerts],
  );
  const unreadCount = triggeredAlerts.length;

  return {
    alerts,
    activeAlerts,
    triggeredAlerts,
    unreadCount,
    isModalOpen,
    setIsModalOpen,
    createAlert,
    deleteAlert,
    toggleAlert,
    dismissAlert,
    checkAlerts,
    requestNotificationPermission,
  };
}

export function getAlertLabel(type: AlertType, threshold: number): string {
  switch (type) {
    case "PRICE_ABOVE":
      return `Cours ≥ ${threshold.toFixed(2)} €`;
    case "PRICE_BELOW":
      return `Cours ≤ ${threshold.toFixed(2)} €`;
    case "RSI_OVERSOLD":
      return `RSI ≤ ${threshold} (Survente)`;
    case "RSI_OVERBOUGHT":
      return `RSI ≥ ${threshold} (Surachat)`;
  }
}
