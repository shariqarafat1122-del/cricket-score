import { Timestamp } from "firebase/firestore";

export interface PlayerRecord {
  matchId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  status: "batting" | "out";
  strikeRate?: number;
  firstSeenAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface MatchHistory {
  matchId: string;
  innings: number;
  players: PlayerSnapshot[];
}

export interface PlayerSnapshot {
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  status: "batting" | "out";
}

// Cricbuzz API response types
export interface CricbuzzBatsman {
  name: string;
  runs: string | number;
  balls: string | number;
  fours: string | number;
  sixes: string | number;
  strikeRate?: string | number;
}

export interface CricbuzzInnings {
  batsman?: CricbuzzBatsman[];
  batsmanStriker?: CricbuzzBatsman;
  batsmanNonStriker?: CricbuzzBatsman;
}

export interface CricbuzzLivescore {
  matchHeader?: {
    matchId?: number | string;
    matchDescription?: string;
    status?: string;
  };
  miniscore?: {
    batsmanStriker?: CricbuzzBatsman;
    batsmanNonStriker?: CricbuzzBatsman;
    inningsId?: number;
    batTeam?: {
      teamInnings?: {
        batsman?: CricbuzzBatsman[];
      };
    };
  };
}

export interface TrackerState {
  matchId: string;
  isPolling: boolean;
  lastFetched: Date | null;
  error: string | null;
  currentBatsmen: CricbuzzBatsman[];
}
