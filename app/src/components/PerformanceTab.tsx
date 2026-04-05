'use client';

import type { MatchRound, MatchKill, MatchPlayer } from './MatchDetail';

interface PerformanceTabProps {
  rounds: MatchRound[];
  kills: MatchKill[];
  players: MatchPlayer[];
  myTeamId: string;
  enemyTeamId: string;
  totalRounds: number;
}

interface PlayerRoundPerf {
  kills: number;
  deaths: number;
  isDead: boolean;
}

export default function PerformanceTab({
  rounds,
  kills,
  players,
  myTeamId,
  enemyTeamId,
  totalRounds,
}: PerformanceTabProps) {
  const myPlayers = players.filter(p => p.team_id === myTeamId);
  const enemyPlayers = players.filter(p => p.team_id === enemyTeamId);

  // Pre-compute per-player per-round stats
  function getPlayerRoundPerf(puuid: string, roundIdx: number): PlayerRoundPerf {
    const roundKills = kills.filter(k => k.round === roundIdx);
    const playerKills = roundKills.filter(k => k.killer.puuid === puuid).length;
    const playerDeaths = roundKills.filter(k => k.victim.puuid === puuid).length;
    return {
      kills: playerKills,
      deaths: playerDeaths,
      isDead: playerDeaths > 0,
    };
  }

  // Sort players by ACS descending
  const sortByACS = (a: MatchPlayer, b: MatchPlayer) => {
    const acsA = totalRounds > 0 ? a.stats.score / totalRounds : 0;
    const acsB = totalRounds > 0 ? b.stats.score / totalRounds : 0;
    return acsB - acsA;
  };

  const sortedMyPlayers = [...myPlayers].sort(sortByACS);
  const sortedEnemyPlayers = [...enemyPlayers].sort(sortByACS);

  const renderTeamPerf = (teamPlayers: MatchPlayer[], teamLabel: string, teamColorClass: string) => (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border">
        <span className={`font-bold text-sm ${teamColorClass}`}>{teamLabel}</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Round numbers header */}
          <div className="grid gap-0 px-2 py-1 border-b border-border/50" style={{
            gridTemplateColumns: `140px repeat(${rounds.length}, 1fr)`,
          }}>
            <span className="text-muted-foreground text-xs px-2">プレイヤー</span>
            {rounds.map((_, idx) => (
              <span key={idx} className="text-muted-foreground/50 text-[10px] text-center">{idx + 1}</span>
            ))}
          </div>

          {/* Player rows */}
          {teamPlayers.map((player) => (
            <div
              key={player.puuid}
              className="grid gap-0 px-2 py-1 border-b border-border/20 items-center hover:bg-slate-50/50"
              style={{
                gridTemplateColumns: `140px repeat(${rounds.length}, 1fr)`,
              }}
            >
              <div className="text-foreground text-xs truncate px-2">{player.name}</div>
              {rounds.map((_, rIdx) => {
                const perf = getPlayerRoundPerf(player.puuid, rIdx);
                return (
                  <div key={rIdx} className="flex items-center justify-center">
                    {perf.kills > 0 && !perf.isDead && (
                      <span className="text-emerald-600 text-[11px] font-bold">{perf.kills}</span>
                    )}
                    {perf.kills > 0 && perf.isDead && (
                      <span className="text-amber-600 text-[11px] font-bold">{perf.kills}</span>
                    )}
                    {perf.kills === 0 && perf.isDead && (
                      <span className="text-rose-500 text-[11px]">✕</span>
                    )}
                    {perf.kills === 0 && !perf.isDead && (
                      <span className="text-slate-300 text-[11px]">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="text-emerald-600 font-bold">N</span> = キル数（生存）
        </span>
        <span className="flex items-center gap-1">
          <span className="text-amber-600 font-bold">N</span> = キル数（死亡）
        </span>
        <span className="flex items-center gap-1">
          <span className="text-rose-500">✕</span> = 死亡（キル無し）
        </span>
        <span className="flex items-center gap-1">
          <span className="text-slate-300">-</span> = 参加なし/生存
        </span>
      </div>

      {renderTeamPerf(sortedMyPlayers, '味方チーム', 'text-emerald-600')}
      {renderTeamPerf(sortedEnemyPlayers, '敵チーム', 'text-rose-500')}
    </div>
  );
}
