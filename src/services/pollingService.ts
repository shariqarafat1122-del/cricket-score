import { CricbuzzBatsman, CricbuzzLivescore } from "../types/cricket";

const POLL_INTERVAL = 10_000; // 10 seconds

// ─── Parse API response ───────────────────────────────────────────────────────

export function parseBatsmenFromResponse(
  data: CricbuzzLivescore
): CricbuzzBatsman[] {
  const batsmen: CricbuzzBatsman[] = [];

  try {
    const miniscore = data?.miniscore;
    if (!miniscore) return batsmen;

    // Try striker and non-striker from miniscore
    if (miniscore.batsmanStriker?.name) {
      batsmen.push(normalizeBatsman(miniscore.batsmanStriker));
    }
    if (miniscore.batsmanNonStriker?.name) {
      batsmen.push(normalizeBatsman(miniscore.batsmanNonStriker));
    }

    // Also try batTeam > teamInnings > batsman array
    const batsmanArr = miniscore.batTeam?.teamInnings?.batsman;
    if (Array.isArray(batsmanArr) && batsmen.length === 0) {
      for (const b of batsmanArr) {
        if (b?.name) batsmen.push(normalizeBatsman(b));
      }
    }
  } catch {
    // silently ignore parse errors
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return batsmen.filter((b) => {
    if (seen.has(b.name)) return false;
    seen.add(b.name);
    return true;
  });
}

function normalizeBatsman(raw: CricbuzzBatsman): CricbuzzBatsman {
  return {
    name: String(raw.name || "Unknown").trim(),
    runs: Number(raw.runs) || 0,
    balls: Number(raw.balls) || 0,
    fours: Number(raw.fours) || 0,
    sixes: Number(raw.sixes) || 0,
    strikeRate: raw.strikeRate != null ? Number(raw.strikeRate) : undefined,
  };
}

// ─── Fetch live score ─────────────────────────────────────────────────────────

export async function fetchLivescore(
  matchId: string
): Promise<{ batsmen: CricbuzzBatsman[]; raw: CricbuzzLivescore }> {
  const proxyBase =
    import.meta.env.VITE_CORS_PROXY_URL || "https://corsproxy.io/?";
  const cricbuzzUrl = `https://www.cricbuzz.com/api/mcenter/livescore/${matchId}`;
  const url = `${proxyBase}${encodeURIComponent(cricbuzzUrl)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Cricbuzz API error: ${res.status} ${res.statusText}`);
  }

  const raw: CricbuzzLivescore = await res.json();
  const batsmen = parseBatsmenFromResponse(raw);

  return { batsmen, raw };
}

// ─── Polling service class ────────────────────────────────────────────────────

export class PollingService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private matchId: string = "";
  private onData: ((batsmen: CricbuzzBatsman[]) => void) | null = null;
  private onError: ((err: Error) => void) | null = null;

  start(
    matchId: string,
    onData: (batsmen: CricbuzzBatsman[]) => void,
    onError: (err: Error) => void
  ): void {
    this.stop();
    this.matchId = matchId;
    this.onData = onData;
    this.onError = onError;

    // Immediate first poll
    this.poll();

    this.timerId = setInterval(() => this.poll(), POLL_INTERVAL);
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const { batsmen } = await fetchLivescore(this.matchId);
      this.onData?.(batsmen);
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export const pollingService = new PollingService();
