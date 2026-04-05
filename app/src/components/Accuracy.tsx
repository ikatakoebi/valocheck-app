'use client';

interface AccuracyProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[];
  puuid: string;
  playerName: string;
  playerTag: string;
}

interface HitStats {
  headshots: number;
  bodyshots: number;
  legshots: number;
}

function aggregateHits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[],
  puuid: string,
  playerName: string,
  playerTag: string
): HitStats {
  const stats: HitStats = { headshots: 0, bodyshots: 0, legshots: 0 };

  for (const match of matches) {
    const player = match.players?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) =>
        p.puuid === puuid ||
        (p.name?.toLowerCase() === playerName.toLowerCase() &&
          p.tag?.toLowerCase() === playerTag.toLowerCase())
    );
    if (!player) continue;

    stats.headshots += player.stats?.headshots || 0;
    stats.bodyshots += player.stats?.bodyshots || 0;
    stats.legshots += player.stats?.legshots || 0;
  }

  return stats;
}

function HitBar({ label, count, percentage, color, barColor }: { label: string; count: number; percentage: number; color: string; barColor: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{count}ヒット</span>
          <span className={`text-sm font-bold ${color}`}>{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}

export default function Accuracy({ matches, puuid, playerName, playerTag }: AccuracyProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  const hits = aggregateHits(matches, puuid, playerName, playerTag);
  const total = hits.headshots + hits.bodyshots + hits.legshots;

  if (total === 0) return null;

  const headPct = (hits.headshots / total) * 100;
  const bodyPct = (hits.bodyshots / total) * 100;
  const legPct = (hits.legshots / total) * 100;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-4">
        Accuracy
      </h2>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Silhouette visualization */}
        <div className="flex flex-col items-center justify-center shrink-0 sm:w-32">
          <div className="relative w-20 h-36 flex flex-col items-center">
            {/* Head */}
            <div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
              style={{
                borderColor: '#e11d48',
                backgroundColor: `rgba(225, 29, 72, ${Math.min(headPct / 100, 0.5)})`,
                color: '#e11d48',
              }}
            >
              {headPct.toFixed(0)}%
            </div>
            {/* Body */}
            <div
              className="w-12 h-14 rounded-lg border-2 mt-1 flex items-center justify-center text-xs font-bold"
              style={{
                borderColor: '#6366f1',
                backgroundColor: `rgba(99, 102, 241, ${Math.min(bodyPct / 100, 0.5)})`,
                color: '#6366f1',
              }}
            >
              {bodyPct.toFixed(0)}%
            </div>
            {/* Legs */}
            <div className="flex gap-1 mt-1">
              <div
                className="w-5 h-12 rounded-md border-2 flex items-center justify-center"
                style={{
                  borderColor: '#94a3b8',
                  backgroundColor: `rgba(148, 163, 184, ${Math.min(legPct / 100, 0.5)})`,
                }}
              />
              <div
                className="w-5 h-12 rounded-md border-2 flex items-center justify-center"
                style={{
                  borderColor: '#94a3b8',
                  backgroundColor: `rgba(148, 163, 184, ${Math.min(legPct / 100, 0.5)})`,
                }}
              />
            </div>
            <span className="text-muted-foreground text-xs mt-1">{legPct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Bar stats */}
        <div className="flex-1 flex flex-col gap-3">
          <HitBar label="Head" count={hits.headshots} percentage={headPct} color="text-rose-600" barColor="#e11d48" />
          <HitBar label="Body" count={hits.bodyshots} percentage={bodyPct} color="text-indigo-600" barColor="#6366f1" />
          <HitBar label="Legs" count={hits.legshots} percentage={legPct} color="text-slate-500" barColor="#94a3b8" />

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">合計ヒット数</span>
              <span className="text-foreground text-sm font-semibold">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
