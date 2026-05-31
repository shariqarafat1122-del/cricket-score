import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  PlayerRecord,
  MatchHistory,
  PlayerSnapshot,
  CricbuzzBatsman,
} from "../types/cricket";

const PLAYERS_COLLECTION = "live_players";
const HISTORY_COLLECTION = "match_history";

// ─── Document ID helpers ────────────────────────────────────────────────────

const makeDocId = (matchId: string, playerName: string): string =>
  `${matchId}_${playerName.replace(/\s+/g, "_")}`;

// ─── Upsert batsmen ──────────────────────────────────────────────────────────

export async function upsertBatsman(
  matchId: string,
  batsman: CricbuzzBatsman,
  previouslyTracked: Set<string>
): Promise<void> {
  const playerName = batsman.name;
  const docId = makeDocId(matchId, playerName);
  const ref = doc(db, PLAYERS_COLLECTION, docId);
  const snap = await getDoc(ref);

  const runs = Number(batsman.runs) || 0;
  const balls = Number(batsman.balls) || 0;
  const fours = Number(batsman.fours) || 0;
  const sixes = Number(batsman.sixes) || 0;

  if (snap.exists()) {
    // Update existing player
    await updateDoc(ref, {
      runs,
      balls,
      fours,
      sixes,
      status: "batting",
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new player
    const newPlayer: Omit<PlayerRecord, "firstSeenAt" | "updatedAt"> & {
      firstSeenAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      matchId,
      playerName,
      runs,
      balls,
      fours,
      sixes,
      status: "batting",
      firstSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, newPlayer);
  }

  previouslyTracked.add(playerName);
}

// ─── Mark batsmen as out ─────────────────────────────────────────────────────

export async function markPlayersOut(
  matchId: string,
  currentBatsmenNames: Set<string>,
  previousBatsmenNames: Set<string>
): Promise<void> {
  const departed = [...previousBatsmenNames].filter(
    (name) => !currentBatsmenNames.has(name)
  );

  for (const name of departed) {
    const docId = makeDocId(matchId, name);
    const ref = doc(db, PLAYERS_COLLECTION, docId);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().status === "batting") {
      await updateDoc(ref, {
        status: "out",
        updatedAt: serverTimestamp(),
      });
    }
  }
}

// ─── Batch process live batsmen ──────────────────────────────────────────────

export async function processBatsmen(
  matchId: string,
  currentBatsmen: CricbuzzBatsman[],
  previousBatsmenRef: React.MutableRefObject<Set<string>>
): Promise<void> {
  const currentNames = new Set(currentBatsmen.map((b) => b.name));

  // Mark previous batsmen who disappeared as out
  await markPlayersOut(matchId, currentNames, previousBatsmenRef.current);

  // Upsert all current batsmen
  for (const batsman of currentBatsmen) {
    await upsertBatsman(matchId, batsman, previousBatsmenRef.current);
  }

  // Update reference
  previousBatsmenRef.current = currentNames;
}

// ─── Match history ───────────────────────────────────────────────────────────

export async function upsertMatchHistory(
  matchId: string,
  innings: number,
  players: PlayerSnapshot[]
): Promise<void> {
  const docId = `${matchId}_innings_${innings}`;
  const ref = doc(db, HISTORY_COLLECTION, docId);
  await setDoc(
    ref,
    {
      matchId,
      innings,
      players,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Realtime listeners ──────────────────────────────────────────────────────

export function subscribeToMatchPlayers(
  matchId: string,
  callback: (players: PlayerRecord[]) => void
): Unsubscribe {
  const q = query(
    collection(db, PLAYERS_COLLECTION),
    where("matchId", "==", matchId)
  );

  return onSnapshot(q, (snapshot) => {
    const players: PlayerRecord[] = snapshot.docs.map(
      (d) => ({ ...d.data() } as PlayerRecord)
    );
    callback(players);
  });
}

export function subscribeToMatchHistory(
  matchId: string,
  callback: (history: MatchHistory[]) => void
): Unsubscribe {
  const q = query(
    collection(db, HISTORY_COLLECTION),
    where("matchId", "==", matchId)
  );

  return onSnapshot(q, (snapshot) => {
    const history: MatchHistory[] = snapshot.docs.map(
      (d) => ({ ...d.data() } as MatchHistory)
    );
    callback(history);
  });
}

export async function getAllMatchPlayers(
  matchId: string
): Promise<PlayerRecord[]> {
  const q = query(
    collection(db, PLAYERS_COLLECTION),
    where("matchId", "==", matchId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PlayerRecord);
}
