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
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="px-4 py-3 border-b border-[#E2E8F0]">
        <span className={`font-bold text-sm ${teamColorClass}`}>{teamLabel}</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Round numbers header */}
          <div className="grid gap-0 px-2 py-1 border-b border-[#E2E8F0]/50" style={{
            gridTemplateColumns: `140px repeat(${rounds.length}, 1fr)`,
          }}>
            <span className="text-[#64748B] text-xs px-2">プレイヤー</span>
            {rounds.map((_, idx) => (
              <span key={idx} className="text-[#94A3B8] text-[10px] text-center font-mono">{idx + 1}</span>
            ))}
          </div>

          {/* Player rows */}
          {teamPlayers.map((player) => (
            <div
              key={player.puuid}
              className="grid gap-0 px-2 py-1 border-b border-[#E2E8F0]/20 items-center hover:bg-[#F8FAFC]/50"
              style={{
                gridTemplateColumns: `140px repeat(${rounds.length}, 1fr)`,
              }}
            >
              <div className="text-[#0F172A] text-xs truncate px-2">{player.name}</div>
              {rounds.map((_, rIdx) => {
                const perf = getPlayerRoundPerf(player.puuid, rIdx);
                return (
                  <div key={rIdx} className="flex items-center justify-center">
                    {perf.kills > 0 && !perf.isDead && (
                      <span className="text-[#10B981] text-[11px] font-mono font-bold">{perf.kills}</span>
                    )}
                    {perf.kills > 0 && perf.isDead && (
                      <span className="text-[#D97706] text-[11px] font-mono font-bold">{perf.kills}</span>
                    )}
                    {perf.kills === 0 && perf.isDead && (
                      <span className="text-[#E11D48] text-[11px]">✕</span>
                    )}
                    {perf.kills === 0 && !perf.isDead && (
                      <span className="text-[#E2E8F0] text-[11px]">-</span>
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
      <div className="flex items-center gap-4 text-xs text-[#64748B]">
        <span className="flex items-center gap-1">
          <span className="text-[#10B981] font-mono font-bold">N</span> = キル数（生存）
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#D97706] font-mono font-bold">N</span> = キル数（死亡）
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#E11D48]">✕</span> = 死亡（キル無し）
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#E2E8F0]">-</span> = 参加なし/生存
        </span>
      </div>

      {renderTeamPerf(sortedMyPlayers, '味方チーム', 'text-[#10B981]')}
      {renderTeamPerf(sortedEnemyPlayers, '敵チーム', 'text-[#E11D48]')}
    </div>
  );
}
