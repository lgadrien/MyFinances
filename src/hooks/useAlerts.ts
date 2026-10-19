/**
 * src/hooks/useAlerts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time Price and Technical Indicator Alerting Engine for MyFinances.
 * Persists in localStorage and checks conditions on market price updates.
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
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

// One list for the whole app: each useAlerts() caller used to keep its own copy and overwrite the others
const useAlertStore = create<{ alerts: StockAlert[] }>(() => ({ alerts: [] }));
let loadedFromStorage = false;

function loadFromStorage() {
  if (loadedFromStorage) return;
  loadedFromStorage = true;
  try {
    useAlertStore.setState({ alerts: JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") });
  } catch {
    // Unreadable storage: start with no alerts
  }
}

// Writes read storage first, so an early write can't drop the saved alerts
function currentAlerts() {
  loadFromStorage();
  return useAlertStore.getState().alerts;
}

// Save alerts to localStorage
function persistAlerts(newAlerts: StockAlert[]) {
  useAlertStore.setState({ alerts: newAlerts });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
  } catch (e) {
    console.error("Failed to save alerts:", e);
  }
}

export function useAlerts() {
  const alerts = useAlertStore((s) => s.alerts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Read storage after mount, not during render, so the server HTML and the first client render match
  useEffect(loadFromStorage, []);

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

      persistAlerts([newAlert, ...currentAlerts()]);

      toast.success(
        `Alerte configurée sur ${newAlert.ticker} (${getAlertLabel(newAlert.type, newAlert.threshold)})`,
      );

      // Proactively ask for notification permission on first alert creation
      if (!hasRequestedPermission) {
        requestNotificationPermission();
      }

      return newAlert;
    },
    [hasRequestedPermission, requestNotificationPermission],
  );

  // Delete an alert
  const deleteAlert = useCallback((id: string) => {
    persistAlerts(currentAlerts().filter((a) => a.id !== id));
    toast.success("Alerte supprimée");
  }, []);

  // Toggle active/dismissed
  const toggleAlert = useCallback(
    (id: string) => {
      const updated = currentAlerts().map((a) => {
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
    [],
  );

  // Check alerts against a price / indicator map
  const checkAlerts = useCallback(
    (quotes: Record<string, { price: number; rsi?: number }>) => {
      const alerts = currentAlerts();
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
    [],
  );

  const triggeredAlerts = useMemo(
    () => alerts.filter((a) => a.status === "TRIGGERED"),
    [alerts],
  );
  const unreadCount = triggeredAlerts.length;

  return {
    alerts,
    triggeredAlerts,
    unreadCount,
    isModalOpen,
    setIsModalOpen,
    createAlert,
    deleteAlert,
    toggleAlert,
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
