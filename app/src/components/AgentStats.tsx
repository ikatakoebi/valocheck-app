'use client';

interface AgentStatEntry {
  agentName: string;
  agentId: string;
  gamesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalScore: number;
  totalRounds: number;
  mapStats: Map<string, { wins: number; losses: number }>;
}

interface AgentStatsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[];
  puuid: string;
  playerName: string;
  playerTag: string;
}

function getAgentIconUrl(agentId: string): string {
  if (!agentId) return '';
  return `https://media.valorant-api.com/agents/${agentId}/displayicon.png`;
}

export default function AgentStats({ matches, puuid, playerName, playerTag }: AgentStatsProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  // Aggregate stats per agent
  const agentMap = new Map<string, AgentStatEntry>();

  for (const match of matches) {
    // Find this player in the match
    const player = match.players?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) =>
        p.puuid === puuid ||
        (p.name?.toLowerCase() === playerName.toLowerCase() &&
          p.tag?.toLowerCase() === playerTag.toLowerCase())
    );

    if (!player || !player.agent?.name) continue;

    const agentName = player.agent.name;
    const agentId = player.agent?.id || '';
    const existing = agentMap.get(agentName) || {
      agentName,
      agentId,
      gamesPlayed: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      totalScore: 0,
      totalRounds: 0,
      mapStats: new Map<string, { wins: number; losses: number }>(),
    };

    existing.gamesPlayed += 1;

    // Determine win & map
    const playerTeam = match.teams?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.team_id === player.team_id
    );
    const isWin = playerTeam?.won ?? false;
    if (isWin) {
      existing.wins += 1;
    }

    // Map stats for Best Map
    const mapName = match.metadata?.map?.name || '不明';
    const mapEntry = existing.mapStats.get(mapName) || { wins: 0, losses: 0 };
    if (isWin) {
      mapEntry.wins += 1;
    } else {
      mapEntry.losses += 1;
    }
    existing.mapStats.set(mapName, mapEntry);

    // Total rounds in this match
    const roundsInMatch = match.teams?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, t: any) => sum + (t.rounds?.won || 0),
      0
    ) || 0;
    existing.totalRounds += roundsInMatch;

    existing.kills += player.stats?.kills || 0;
    existing.deaths += player.stats?.deaths || 0;
    existing.assists += player.stats?.assists || 0;
    existing.totalDamageDealt += player.stats?.damage?.dealt || 0;
    existing.totalDamageReceived += player.stats?.damage?.received || 0;
    existing.totalScore += player.stats?.score || 0;

    agentMap.set(agentName, existing);
  }

  // Sort by games played (descending)
  const sortedAgents = Array.from(agentMap.values()).sort(
    (a, b) => b.gamesPlayed - a.gamesPlayed
  );

  if (sortedAgents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">
        エージェント統計
      </h2>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="grid grid-cols-[minmax(140px,1.5fr)_60px_60px_65px_60px_60px_65px_110px] gap-2 px-3 py-2 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
            <span>エージェント</span>
            <span className="text-center">試合</span>
            <span className="text-center">勝率</span>
            <span className="text-center">K/D</span>
            <span className="text-center">ADR</span>
            <span className="text-center">ACS</span>
            <span className="text-center">{`DD\u0394`}</span>
            <span className="text-center">Best Map</span>
          </div>

          {sortedAgents.map((agent) => {
            const winRate = agent.gamesPlayed > 0
              ? Math.round((agent.wins / agent.gamesPlayed) * 100)
              : 0;
            const kd = agent.deaths > 0
              ? (agent.kills / agent.deaths)
              : agent.kills;
            const adr = agent.totalRounds > 0
              ? (agent.totalDamageDealt / agent.totalRounds)
              : 0;
            const acs = agent.totalRounds > 0
              ? (agent.totalScore / agent.totalRounds)
              : 0;
            const ddDelta = agent.totalRounds > 0
              ? ((agent.totalDamageDealt - agent.totalDamageReceived) / agent.totalRounds)
              : 0;

            // Best Map calculation
            let bestMapName = '-';
            let bestMapWinRate = 0;
            agent.mapStats.forEach((stats, map) => {
              const total = stats.wins + stats.losses;
              if (total >= 1) {
                const wr = (stats.wins / total) * 100;
                if (wr > bestMapWinRate || (wr === bestMapWinRate && total > 0)) {
                  bestMapWinRate = wr;
                  bestMapName = map;
                }
              }
            });

            const agentIconUrl = getAgentIconUrl(agent.agentId);

            return (
              <div
                key={agent.agentName}
                className="grid grid-cols-[minmax(140px,1.5fr)_60px_60px_65px_60px_60px_65px_110px] gap-2 px-3 py-3 items-center hover:bg-slate-50 transition-colors rounded-lg"
              >
                {/* Agent name with icon */}
                <div className="flex items-center gap-2 min-w-0">
                  {agentIconUrl && (
                    <img
                      src={agentIconUrl}
                      alt={agent.agentName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 bg-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-foreground text-sm font-medium truncate">{agent.agentName}</span>
                </div>

                {/* Games played */}
                <div className="text-center">
                  <span className="text-slate-600 text-sm">{agent.gamesPlayed}</span>
                </div>

                {/* Win rate */}
                <div className="text-center">
                  <span
                    className={`text-sm font-medium ${
                      winRate >= 50 ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {winRate}%
                  </span>
                </div>

                {/* K/D */}
                <div className="text-center">
                  <span className={`text-sm ${kd >= 1 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {kd.toFixed(2)}
                  </span>
                </div>

                {/* ADR */}
                <div className="text-center">
                  <span className="text-slate-600 text-sm">{adr.toFixed(0)}</span>
                </div>

                {/* ACS */}
                <div className="text-center">
                  <span className="text-slate-600 text-sm">{acs.toFixed(0)}</span>
                </div>

                {/* DDΔ */}
                <div className="text-center">
                  <span className={`text-sm ${ddDelta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {ddDelta >= 0 ? '+' : ''}{ddDelta.toFixed(1)}
                  </span>
                </div>

                {/* Best Map */}
                <div className="text-center">
                  <span className="text-slate-600 text-xs">{bestMapName}</span>
                  {bestMapName !== '-' && (
                    <span className={`text-xs ml-1 ${bestMapWinRate >= 50 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {bestMapWinRate.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile cards - shown on small screens */}
      <div className="sm:hidden mt-2">
        {sortedAgents.map((agent) => {
          const winRate = agent.gamesPlayed > 0
            ? Math.round((agent.wins / agent.gamesPlayed) * 100)
            : 0;
          const kd = agent.deaths > 0
            ? (agent.kills / agent.deaths)
            : agent.kills;
          const adr = agent.totalRounds > 0
            ? (agent.totalDamageDealt / agent.totalRounds)
            : 0;
          const acs = agent.totalRounds > 0
            ? (agent.totalScore / agent.totalRounds)
            : 0;
          const ddDelta = agent.totalRounds > 0
            ? ((agent.totalDamageDealt - agent.totalDamageReceived) / agent.totalRounds)
            : 0;

          let bestMapName = '-';
          let bestMapWinRate = 0;
          agent.mapStats.forEach((stats, map) => {
            const total = stats.wins + stats.losses;
            if (total >= 1) {
              const wr = (stats.wins / total) * 100;
              if (wr > bestMapWinRate || (wr === bestMapWinRate && total > 0)) {
                bestMapWinRate = wr;
                bestMapName = map;
              }
            }
          });

          const agentIconUrl = getAgentIconUrl(agent.agentId);

          return (
            <div key={`mobile-${agent.agentName}`} className="p-3 border-b border-border last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {agentIconUrl && (
                    <img
                      src={agentIconUrl}
                      alt={agent.agentName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 bg-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-foreground text-sm font-medium">{agent.agentName}</span>
                </div>
                <span className="text-muted-foreground text-xs">{agent.gamesPlayed}試合</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`text-sm font-medium ${
                    winRate >= 50 ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  勝率 {winRate}%
                </span>
                <span className={`text-sm ${kd >= 1 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  K/D {kd.toFixed(2)}
                </span>
                <span className="text-slate-600 text-xs">
                  ADR {adr.toFixed(0)}
                </span>
                <span className="text-slate-600 text-xs">
                  ACS {acs.toFixed(0)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs ${ddDelta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {`DD\u0394`} {ddDelta >= 0 ? '+' : ''}{ddDelta.toFixed(1)}
                </span>
                {bestMapName !== '-' && (
                  <span className="text-muted-foreground text-xs">
                    Best: {bestMapName} <span className={bestMapWinRate >= 50 ? 'text-emerald-600' : 'text-rose-500'}>{bestMapWinRate.toFixed(0)}%</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
