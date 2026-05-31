import { useState } from "react";
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Trophy,
  Target,
  Zap,
  AlertCircle,
  Circle,
  ChevronRight,
  Users,
  BarChart3,
  Play,
  Square,
} from "lucide-react";
import {
  useMatchPlayers,
  useMatchHistory,
  usePollingTracker,
} from "../hooks/useCricketTracker";
import { PlayerRecord } from "../types/cricket";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcSR(runs: number, balls: number): string {
  if (balls === 0) return "0.00";
  return ((runs / balls) * 100).toFixed(2);
}

function timeAgo(date: Date | null): string {
  if (!date) return "Never";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({
  label,
  value,
  color = "cyan",
}: {
  label: string;
  value: string | number;
  color?: "cyan" | "green" | "red" | "yellow";
}) {
  const colors = {
    cyan: "text-[#00E5FF] border-[#00E5FF]/30 bg-[#00E5FF]/5",
    green: "text-[#00C853] border-[#00C853]/30 bg-[#00C853]/5",
    red: "text-[#FF1744] border-[#FF1744]/30 bg-[#FF1744]/5",
    yellow: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  };
  return (
    <div
      className={`flex flex-col items-center px-3 py-2 rounded-lg border ${colors[color]}`}
    >
      <span className="text-xs font-medium opacity-70 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-lg font-black mt-0.5">{value}</span>
    </div>
  );
}

function BatsmanCard({ player }: { player: PlayerRecord }) {
  const sr = calcSR(player.runs, player.balls);
  const srNum = parseFloat(sr);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#00E5FF]/20 bg-gradient-to-br from-[#151B2E] to-[#0d1424] p-5 group hover:border-[#00E5FF]/50 transition-all duration-300">
      {/* Animated pulse indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E5FF]"></span>
        </span>
        <span className="text-[#00E5FF] text-xs font-bold tracking-wider">
          LIVE
        </span>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 border border-[#00E5FF]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[#00E5FF] font-black text-lg">
            {player.playerName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base truncate">
            {player.playerName}
          </h3>
          <p className="text-[#00E5FF]/60 text-xs mt-0.5">Currently Batting</p>
        </div>
      </div>

      {/* Main runs display */}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-5xl font-black text-white tabular-nums">
          {player.runs}
        </span>
        <div className="flex flex-col">
          <span className="text-[#00E5FF]/70 text-sm font-semibold">RUNS</span>
          <span className="text-white/40 text-xs">
            ({player.balls} balls)
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBadge label="SR" value={sr} color={srNum > 150 ? "green" : srNum > 100 ? "cyan" : "yellow"} />
        <StatBadge label="4s" value={player.fours} color="green" />
        <StatBadge label="6s" value={player.sixes} color="red" />
      </div>

      {/* SR bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-white/30 mb-1">
          <span>Strike Rate</span>
          <span>{sr}</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00C853] rounded-full transition-all duration-700"
            style={{ width: `${Math.min((srNum / 200) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function OutPlayerRow({ player, index }: { player: PlayerRecord; index: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
      <span className="text-white/20 text-xs w-5 text-right font-mono">
        {index + 1}
      </span>
      <div className="w-7 h-7 rounded-lg bg-[#FF1744]/10 border border-[#FF1744]/20 flex items-center justify-center flex-shrink-0">
        <span className="text-[#FF1744] text-xs font-bold">
          {player.playerName.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-sm font-semibold truncate">
          {player.playerName}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white font-bold tabular-nums">{player.runs}</span>
        <span className="text-white/30 text-xs">({player.balls})</span>
        <span className="text-white/30 text-xs">
          SR {calcSR(player.runs, player.balls)}
        </span>
        <span className="text-[#FF1744] text-xs font-bold px-2 py-0.5 rounded-full bg-[#FF1744]/10 border border-[#FF1744]/20">
          OUT
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayerTrackerPage() {
  const [matchIdInput, setMatchIdInput] = useState("112000"); // Default example match ID
  const [activeMatchId, setActiveMatchId] = useState("");

  const {
    isPolling,
    lastFetched,
    error,
    currentBatsmen,
    pollCount,
    startPolling,
    stopPolling,
  } = usePollingTracker(activeMatchId);

  const { battingPlayers, outPlayers, loading } = useMatchPlayers(activeMatchId);
  const { history } = useMatchHistory(activeMatchId);

  const handleStart = () => {
    if (!matchIdInput.trim()) return;
    setActiveMatchId(matchIdInput.trim());
    // Slight delay to let state settle
    setTimeout(startPolling, 100);
  };

  const handleStop = () => {
    stopPolling();
  };

  const totalRuns = [...battingPlayers, ...outPlayers].reduce(
    (s, p) => s + p.runs,
    0
  );
  const totalBalls = [...battingPlayers, ...outPlayers].reduce(
    (s, p) => s + p.balls,
    0
  );

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#0B1020", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* Animated background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="relative border-b border-white/5 bg-[#0B1020]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#0066ff] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg tracking-tight">
                CRICKET<span className="text-[#00E5FF]">LIVE</span>
              </h1>
              <p className="text-white/30 text-xs tracking-widest uppercase">
                Player Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
                isPolling
                  ? "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
                  : "border-white/10 bg-white/5 text-white/40"
              }`}
            >
              {isPolling ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {isPolling ? "LIVE" : "OFFLINE"}
            </div>

            {/* Poll count */}
            {pollCount > 0 && (
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <RefreshCw className="w-3 h-3" />
                <span>{pollCount} polls</span>
              </div>
            )}

            {/* Last fetched */}
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(lastFetched)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Match ID input ── */}
        <div className="rounded-2xl border border-white/10 bg-[#151B2E] p-6">
          <h2 className="text-white/60 text-xs uppercase tracking-widest mb-4 font-bold">
            Match Configuration
          </h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={matchIdInput}
                onChange={(e) => setMatchIdInput(e.target.value)}
                placeholder="Enter Cricbuzz Match ID (e.g. 112000)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00E5FF]/50 focus:bg-white/8 transition-all text-sm font-mono"
              />
            </div>
            <button
              onClick={isPolling ? handleStop : handleStart}
              disabled={!matchIdInput.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isPolling
                  ? "bg-[#FF1744]/20 border border-[#FF1744]/40 text-[#FF1744] hover:bg-[#FF1744]/30"
                  : "bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/30"
              }`}
            >
              {isPolling ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Tracking
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20">
              <AlertCircle className="w-4 h-4 text-[#FF1744] flex-shrink-0" />
              <p className="text-[#FF1744] text-sm">{error}</p>
            </div>
          )}

          {/* Info note */}
          <p className="text-white/20 text-xs mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Note: Cricbuzz API requires a CORS proxy. Set{" "}
            <code className="text-[#00E5FF]/60">VITE_CORS_PROXY_URL</code> or
            use corsproxy.io (default). Firestore credentials required in{" "}
            <code className="text-[#00E5FF]/60">.env</code>.
          </p>
        </div>

        {/* ── Match stats summary ── */}
        {activeMatchId && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                label: "Total Players",
                value: battingPlayers.length + outPlayers.length,
                color: "cyan",
              },
              {
                icon: Target,
                label: "At Crease",
                value: battingPlayers.length,
                color: "green",
              },
              {
                icon: BarChart3,
                label: "Total Runs",
                value: totalRuns,
                color: "yellow",
              },
              {
                icon: Zap,
                label: "Team SR",
                value: calcSR(totalRuns, totalBalls),
                color: "red",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border border-white/8 bg-[#151B2E] p-4 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    color === "cyan"
                      ? "bg-[#00E5FF]/10"
                      : color === "green"
                      ? "bg-[#00C853]/10"
                      : color === "yellow"
                      ? "bg-yellow-400/10"
                      : "bg-[#FF1744]/10"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      color === "cyan"
                        ? "text-[#00E5FF]"
                        : color === "green"
                        ? "text-[#00C853]"
                        : color === "yellow"
                        ? "text-yellow-400"
                        : "text-[#FF1744]"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-white font-black text-xl">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Current batsmen ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Circle className="w-3 h-3 text-[#00E5FF] fill-[#00E5FF] animate-pulse" />
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">
              Current Batsmen
            </h2>
            <span className="text-[#00E5FF] text-xs px-2 py-0.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20">
              {battingPlayers.length} at crease
            </span>
          </div>

          {!activeMatchId ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <Activity className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                Enter a match ID and start tracking to see live data
              </p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-white/3 animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : battingPlayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                {isPolling
                  ? "Waiting for live batsmen data..."
                  : "No batting data yet. Start tracking to fetch live data."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {battingPlayers.map((p) => (
                <BatsmanCard key={p.playerName} player={p} />
              ))}
            </div>
          )}
        </section>

        {/* ── Out players ── */}
        {outPlayers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#FF1744]" />
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">
                Dismissed Batsmen
              </h2>
              <span className="text-[#FF1744] text-xs px-2 py-0.5 rounded-full bg-[#FF1744]/10 border border-[#FF1744]/20">
                {outPlayers.length} out
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#151B2E] overflow-hidden">
              <div className="p-3 space-y-1">
                {outPlayers.map((p, i) => (
                  <OutPlayerRow key={p.playerName} player={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Batting history (Firestore) ── */}
        {[...battingPlayers, ...outPlayers].length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-white/40" />
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">
                Full Batting History
              </h2>
              <span className="text-white/30 text-xs">· Firestore Realtime</span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#151B2E] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Player", "Runs", "Balls", "4s", "6s", "SR", "Status"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-white/30 text-xs uppercase tracking-widest font-semibold"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[...battingPlayers, ...outPlayers].map((p) => (
                      <tr
                        key={p.playerName}
                        className="border-b border-white/3 hover:bg-white/2 transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-semibold">
                          {p.playerName}
                        </td>
                        <td className="px-4 py-3 text-white font-black tabular-nums">
                          {p.runs}
                        </td>
                        <td className="px-4 py-3 text-white/60 tabular-nums">
                          {p.balls}
                        </td>
                        <td className="px-4 py-3 text-[#00C853] tabular-nums">
                          {p.fours}
                        </td>
                        <td className="px-4 py-3 text-[#FF1744] tabular-nums">
                          {p.sixes}
                        </td>
                        <td className="px-4 py-3 text-[#00E5FF] tabular-nums">
                          {calcSR(p.runs, p.balls)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              p.status === "batting"
                                ? "text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/20"
                                : "text-[#FF1744] bg-[#FF1744]/10 border-[#FF1744]/20"
                            }`}
                          >
                            {p.status === "batting" ? "BATTING" : "OUT"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── Match history ── */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">
                Innings History
              </h2>
            </div>
            <div className="grid gap-4">
              {history.map((h) => (
                <div
                  key={`${h.matchId}_${h.innings}`}
                  className="rounded-xl border border-white/8 bg-[#151B2E] p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-bold">
                      Innings {h.innings}
                    </span>
                    <span className="text-white/30 text-xs">
                      · {h.players?.length || 0} players
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {h.players?.map((p) => (
                      <span
                        key={p.playerName}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60"
                      >
                        {p.playerName}
                        <span className="text-white ml-1 font-bold">
                          {p.runs}
                        </span>
                        <span className="text-white/30">({p.balls})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 py-6 text-center text-white/20 text-xs">
        Cricket Live Tracker · Polls every 10s · Powered by Cricbuzz + Firebase
      </footer>
    </div>
  );
}
