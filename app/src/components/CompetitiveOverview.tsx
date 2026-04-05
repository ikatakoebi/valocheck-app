'use client';

interface CompetitiveOverviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[];
  puuid: string;
  playerName: string;
  playerTag: string;
}

interface AggregatedStats {
  totalMatches: number;
  wins: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalRounds: number;
  totalScore: number;
  totalHeadshots: number;
  totalBodyshots: number;
  totalLegshots: number;
}

function aggregateStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[],
  puuid: string,
  playerName: string,
  playerTag: string
): AggregatedStats {
  const stats: AggregatedStats = {
    totalMatches: 0,
    wins: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalAssists: 0,
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    totalRounds: 0,
    totalScore: 0,
    totalHeadshots: 0,
    totalBodyshots: 0,
    totalLegshots: 0,
  };

  for (const match of matches) {
    const player = match.players?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) =>
        p.puuid === puuid ||
        (p.name?.toLowerCase() === playerName.toLowerCase() &&
          p.tag?.toLowerCase() === playerTag.toLowerCase())
    );
    if (!player) continue;

    stats.totalMatches += 1;

    const playerTeam = match.teams?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.team_id === player.team_id
    );
    if (playerTeam?.won) {
      stats.wins += 1;
    }

    // Total rounds in this match
    const roundsInMatch = match.teams?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, t: any) => sum + (t.rounds?.won || 0),
      0
    ) || 0;
    stats.totalRounds += roundsInMatch;

    stats.totalKills += player.stats?.kills || 0;
    stats.totalDeaths += player.stats?.deaths || 0;
    stats.totalAssists += player.stats?.assists || 0;
    stats.totalDamageDealt += player.stats?.damage?.dealt || 0;
    stats.totalDamageReceived += player.stats?.damage?.received || 0;
    stats.totalScore += player.stats?.score || 0;
    stats.totalHeadshots += player.stats?.headshots || 0;
    stats.totalBodyshots += player.stats?.bodyshots || 0;
    stats.totalLegshots += player.stats?.legshots || 0;
  }

  return stats;
}

function StatCard({ label, value, subLabel }: { label: string; value: string; subLabel?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-border flex flex-col items-center justify-center min-w-0">
      <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1 text-center whitespace-nowrap">{label}</span>
      <span className="text-foreground text-lg sm:text-2xl font-bold">{value}</span>
      {subLabel && <span className="text-muted-foreground text-xs mt-0.5">{subLabel}</span>}
    </div>
  );
}

export default function CompetitiveOverview({ matches, puuid, playerName, playerTag }: CompetitiveOverviewProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  const stats = aggregateStats(matches, puuid, playerName, playerTag);
  if (stats.totalMatches === 0) return null;

  // Calculate derived metrics
  const kdRatio = stats.totalDeaths > 0 ? (stats.totalKills / stats.totalDeaths) : stats.totalKills;
  const kadRatio = stats.totalDeaths > 0 ? ((stats.totalKills + stats.totalAssists) / stats.totalDeaths) : (stats.totalKills + stats.totalAssists);
  const totalShots = stats.totalHeadshots + stats.totalBodyshots + stats.totalLegshots;
  const headshotPct = totalShots > 0 ? (stats.totalHeadshots / totalShots * 100) : 0;
  const winPct = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches * 100) : 0;
  const damagePerRound = stats.totalRounds > 0 ? (stats.totalDamageDealt / stats.totalRounds) : 0;
  const acs = stats.totalRounds > 0 ? (stats.totalScore / stats.totalRounds) : 0;
  const killsPerRound = stats.totalRounds > 0 ? (stats.totalKills / stats.totalRounds) : 0;
  const ddDeltaPerRound = stats.totalRounds > 0 ? ((stats.totalDamageDealt - stats.totalDamageReceived) / stats.totalRounds) : 0;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-4">
        Competitive Overview
      </h2>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <StatCard
          label="Damage/R"
          value={damagePerRound.toFixed(1)}
        />
        <StatCard
          label="K/D Ratio"
          value={kdRatio.toFixed(2)}
        />
        <StatCard
          label="Headshot%"
          value={`${headshotPct.toFixed(1)}%`}
        />
        <StatCard
          label="Win%"
          value={`${winPct.toFixed(0)}%`}
          subLabel={`${stats.wins}W ${stats.totalMatches - stats.wins}L`}
        />
      </div>

      {/* Secondary stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">ACS</span>
          <span className="text-foreground text-lg font-semibold">{acs.toFixed(1)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">KAD Ratio</span>
          <span className="text-foreground text-lg font-semibold">{kadRatio.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Kills/R</span>
          <span className="text-foreground text-lg font-semibold">{killsPerRound.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">{`DD\u0394/R`}</span>
          <span className={`text-lg font-semibold ${ddDeltaPerRound >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {ddDeltaPerRound >= 0 ? '+' : ''}{ddDeltaPerRound.toFixed(1)}
          </span>
        </div>
      </div>

      {/* K/D/A totals */}
      <div className="flex items-center gap-4 sm:gap-6 pt-3 border-t border-border">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Kills</span>
          <span className="text-emerald-600 text-lg font-semibold">{stats.totalKills}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Deaths</span>
          <span className="text-rose-500 text-lg font-semibold">{stats.totalDeaths}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Assists</span>
          <span className="text-slate-600 text-lg font-semibold">{stats.totalAssists}</span>
        </div>
        <div className="flex flex-col ml-auto">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">試合数</span>
          <span className="text-foreground text-lg font-semibold">{stats.totalMatches}</span>
        </div>
      </div>
    </div>
  );
}
