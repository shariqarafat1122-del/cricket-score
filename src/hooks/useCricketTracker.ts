import { useEffect, useRef, useState, useCallback } from "react";
import { PlayerRecord, MatchHistory, CricbuzzBatsman } from "../types/cricket";
import {
  subscribeToMatchPlayers,
  subscribeToMatchHistory,
  processBatsmen,
} from "../services/firestoreService";
import { pollingService } from "../services/pollingService";

// ─── Realtime players hook ────────────────────────────────────────────────────

export function useMatchPlayers(matchId: string) {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);

    const unsub = subscribeToMatchPlayers(matchId, (data) => {
      setPlayers(data);
      setLoading(false);
    });

    return () => unsub();
  }, [matchId]);

  const battingPlayers = players
    .filter((p) => p.status === "batting")
    .sort((a, b) => b.runs - a.runs);

  const outPlayers = players
    .filter((p) => p.status === "out")
    .sort((a, b) => b.runs - a.runs);

  return { players, battingPlayers, outPlayers, loading };
}

// ─── Realtime match history hook ──────────────────────────────────────────────

export function useMatchHistory(matchId: string) {
  const [history, setHistory] = useState<MatchHistory[]>([]);

  useEffect(() => {
    if (!matchId) return;
    const unsub = subscribeToMatchHistory(matchId, setHistory);
    return () => unsub();
  }, [matchId]);

  return { history };
}

// ─── Polling + Firestore sync hook ────────────────────────────────────────────

export function usePollingTracker(matchId: string) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentBatsmen, setCurrentBatsmen] = useState<CricbuzzBatsman[]>([]);
  const [pollCount, setPollCount] = useState(0);
  const previousBatsmen = useRef<Set<string>>(new Set());

  const handleData = useCallback(
    async (batsmen: CricbuzzBatsman[]) => {
      setCurrentBatsmen(batsmen);
      setLastFetched(new Date());
      setError(null);
      setPollCount((c) => c + 1);

      if (matchId && batsmen.length > 0) {
        try {
          await processBatsmen(matchId, batsmen, previousBatsmen);
        } catch (err) {
          console.error("Firestore write error:", err);
        }
      }
    },
    [matchId]
  );

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    console.error("Polling error:", err);
  }, []);

  const startPolling = useCallback(() => {
    if (!matchId) return;
    setIsPolling(true);
    setError(null);
    previousBatsmen.current = new Set();
    pollingService.start(matchId, handleData, handleError);
  }, [matchId, handleData, handleError]);

  const stopPolling = useCallback(() => {
    pollingService.stop();
    setIsPolling(false);
  }, []);

  // Cleanup on unmount or matchId change
  useEffect(() => {
    return () => {
      pollingService.stop();
    };
  }, [matchId]);

  return {
    isPolling,
    lastFetched,
    error,
    currentBatsmen,
    pollCount,
    startPolling,
    stopPolling,
  };
}
