/**
 * src/hooks/usePositionNotes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Stocke les notes d'investissement par ticker dans localStorage.
 * Parfait pour noter sa thèse d'investissement, ses raisons d'achat, etc.
 *
 * Clé localStorage : "myfinances_position_notes"
 *
 * Structure stockée :
 *   { "AIR.PA": { note: "...", updatedAt: "2026-03-01T..." }, ... }
 */

"use client";

import { useLocalStorage } from "./useLocalStorage";

interface NoteEntry {
  note: string;
  updatedAt: string; // ISO string
}

type PositionNotes = Record<string, NoteEntry>;

export function usePositionNotes() {
  const [notes, setNotes] = useLocalStorage<PositionNotes>(
    "myfinances_position_notes",
    {},
  );

  const setNote = (ticker: string, note: string) => {
    setNotes((prev) => {
      if (!note.trim()) {
        const next = { ...prev };
        delete next[ticker];
        return next;
      }
      return {
        ...prev,
        [ticker]: { note: note.trim(), updatedAt: new Date().toISOString() },
      };
    });
  };

  const getNote = (ticker: string): string => {
    return notes[ticker]?.note ?? "";
  };

  const hasNote = (ticker: string): boolean => {
    return !!notes[ticker]?.note;
  };

  return { notes, setNote, getNote, hasNote };
}
