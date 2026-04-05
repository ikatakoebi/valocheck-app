'use client';

import type { MatchKill, MatchPlayer } from './MatchDetail';

interface DuelsTabProps {
  kills: MatchKill[];
  players: MatchPlayer[];
  myTeamId: string;
  enemyTeamId: string;
}

interface DuelRecord {
  kills: number;   // times row player killed column player
  deaths: number;  // times row player was killed by column player
}

export default function DuelsTab({ kills, players, myTeamId, enemyTeamId }: DuelsTabProps) {
  const myPlayers = players.filter(p => p.team_id === myTeamId);
  const enemyPlayers = players.filter(p => p.team_id === enemyTeamId);

  // Build duel matrix: myPlayers (rows) vs enemyPlayers (columns)
  // matrix[myPuuid][enemyPuuid] = { kills, deaths }
  const matrix = new Map<string, Map<string, DuelRecord>>();

  for (const mp of myPlayers) {
    const row = new Map<string, DuelRecord>();
    for (const ep of enemyPlayers) {
      row.set(ep.puuid, { kills: 0, deaths: 0 });
    }
    matrix.set(mp.puuid, row);
  }

  // Populate from kills data
  for (const kill of kills) {
    // My player killed enemy player
    const myRow = matrix.get(kill.killer.puuid);
    if (myRow) {
      const cell = myRow.get(kill.victim.puuid);
      if (cell) cell.kills++;
    }

    // My player was killed by enemy player
    const victimRow = matrix.get(kill.victim.puuid);
    if (victimRow) {
      const cell = victimRow.get(kill.killer.puuid);
      if (cell) cell.deaths++;
    }
  }

  // Compute totals per my player
  const myPlayerTotals = new Map<string, { totalKills: number; totalDeaths: number }>();
  for (const mp of myPlayers) {
    const row = matrix.get(mp.puuid);
    let totalKills = 0;
    let totalDeaths = 0;
    if (row) {
      for (const cell of row.values()) {
        totalKills += cell.kills;
        totalDeaths += cell.deaths;
      }
    }
    myPlayerTotals.set(mp.puuid, { totalKills, totalDeaths });
  }

  // Compute totals per enemy player
  const enemyPlayerTotals = new Map<string, { totalKills: number; totalDeaths: number }>();
  for (const ep of enemyPlayers) {
    let totalKills = 0;
    let totalDeaths = 0;
    for (const mp of myPlayers) {
      const row = matrix.get(mp.puuid);
      if (row) {
        const cell = row.get(ep.puuid);
        if (cell) {
          totalKills += cell.deaths; // enemy killed my player
          totalDeaths += cell.kills;  // enemy was killed by my player
        }
      }
    }
    enemyPlayerTotals.set(ep.puuid, { totalKills, totalDeaths });
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-foreground text-sm font-bold">対面キルマトリクス</span>
        <span className="text-muted-foreground text-xs ml-2">(味方 vs 敵)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-3 py-2 text-left text-muted-foreground text-xs uppercase min-w-[120px]">
                味方 ＼ 敵
              </th>
              {enemyPlayers.map(ep => (
                <th key={ep.puuid} className="px-2 py-2 text-center text-rose-500 text-xs font-medium min-w-[70px]">
                  <div className="truncate max-w-[70px]" title={`${ep.name}#${ep.tag}`}>
                    {ep.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{ep.agent?.name || ''}</div>
                </th>
              ))}
              <th className="px-2 py-2 text-center text-muted-foreground text-xs uppercase border-l border-border">
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            {myPlayers.map(mp => {
              const row = matrix.get(mp.puuid);
              const totals = myPlayerTotals.get(mp.puuid);
              return (
                <tr key={mp.puuid} className="border-b border-border/20 hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <div className="text-emerald-600 text-xs font-medium truncate max-w-[120px]">
                      {mp.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{mp.agent?.name || ''}</div>
                  </td>
                  {enemyPlayers.map(ep => {
                    const cell = row?.get(ep.puuid);
                    const k = cell?.kills || 0;
                    const d = cell?.deaths || 0;
                    const diff = k - d;
                    return (
                      <td key={ep.puuid} className="px-2 py-2 text-center">
                        <div className="flex flex-col items-center">
                          <div className="text-xs">
                            <span className="text-emerald-600">{k}</span>
                            <span className="text-muted-foreground/40 mx-0.5">:</span>
                            <span className="text-rose-500">{d}</span>
                          </div>
                          {(k > 0 || d > 0) && (
                            <div className={`text-[10px] ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center border-l border-border">
                    <div className="text-xs">
                      <span className="text-emerald-600 font-medium">{totals?.totalKills || 0}</span>
                      <span className="text-muted-foreground/40 mx-0.5">:</span>
                      <span className="text-rose-500 font-medium">{totals?.totalDeaths || 0}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Enemy totals row */}
            <tr className="border-t border-border">
              <td className="px-3 py-2 text-muted-foreground text-xs uppercase">合計</td>
              {enemyPlayers.map(ep => {
                const totals = enemyPlayerTotals.get(ep.puuid);
                return (
                  <td key={ep.puuid} className="px-2 py-2 text-center">
                    <div className="text-xs">
                      <span className="text-rose-500 font-medium">{totals?.totalKills || 0}</span>
                      <span className="text-muted-foreground/40 mx-0.5">:</span>
                      <span className="text-emerald-600 font-medium">{totals?.totalDeaths || 0}</span>
                    </div>
                  </td>
                );
              })}
              <td className="px-2 py-2 border-l border-border" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Explanation */}
      <div className="px-4 py-2 border-t border-border/50 text-xs text-muted-foreground">
        各セル: <span className="text-emerald-600">味方キル数</span> : <span className="text-rose-500">敵キル数</span>
      </div>
    </div>
  );
}
