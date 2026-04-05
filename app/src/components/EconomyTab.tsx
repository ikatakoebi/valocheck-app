'use client';

import type { MatchRound } from './MatchDetail';

interface EconomyTabProps {
  rounds: MatchRound[];
  myTeamId: string;
  enemyTeamId: string;
}

interface TeamRoundEconomy {
  roundNum: number;
  avgLoadout: number;
  avgBank: number;
  totalLoadout: number;
  totalBank: number;
  playerCount: number;
}

function computeTeamEconomy(rounds: MatchRound[], teamId: string): TeamRoundEconomy[] {
  return rounds.map((round, idx) => {
    const teamStats = round.stats.filter(s => s.player.team === teamId);
    const playerCount = teamStats.length || 1;
    const totalLoadout = teamStats.reduce((sum, s) => sum + (s.economy?.loadout_value || 0), 0);
    const totalBank = teamStats.reduce((sum, s) => sum + (s.economy?.remaining || 0), 0);
    return {
      roundNum: idx + 1,
      avgLoadout: Math.round(totalLoadout / playerCount),
      avgBank: Math.round(totalBank / playerCount),
      totalLoadout,
      totalBank,
      playerCount,
    };
  });
}

function BarChart({
  data,
  maxValue,
  label,
  colorClass,
  bgClass,
}: {
  data: TeamRoundEconomy[];
  maxValue: number;
  label: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
      <div className="flex items-end gap-px h-24 sm:h-32">
        {data.map((d) => {
          const loadoutH = maxValue > 0 ? (d.avgLoadout / maxValue) * 100 : 0;
          const bankH = maxValue > 0 ? (d.avgBank / maxValue) * 100 : 0;
          return (
            <div
              key={d.roundNum}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              {/* Stacked bar: loadout on top of bank */}
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full ${bgClass} rounded-t-sm opacity-40`}
                  style={{ height: `${Math.max(bankH, 1)}%` }}
                />
                <div
                  className={`w-full ${bgClass} rounded-t-sm`}
                  style={{ height: `${Math.max(loadoutH, 1)}%` }}
                />
              </div>
              {/* Tooltip */}
              <div className="hidden group-hover:block absolute bottom-full mb-1 bg-white border border-border rounded-lg px-2 py-1 text-[10px] text-foreground whitespace-nowrap z-10 shadow-md">
                <div>R{d.roundNum}</div>
                <div>装備: {d.avgLoadout.toLocaleString()}</div>
                <div>残金: {d.avgBank.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Round numbers */}
      <div className="flex gap-px">
        {data.map((d) => (
          <div key={d.roundNum} className="flex-1 text-center text-[9px] text-muted-foreground/50">
            {d.roundNum}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EconomyTab({ rounds, myTeamId, enemyTeamId }: EconomyTabProps) {
  const myEconomy = computeTeamEconomy(rounds, myTeamId);
  const enemyEconomy = computeTeamEconomy(rounds, enemyTeamId);

  // Find max value for consistent scale
  const allValues = [...myEconomy, ...enemyEconomy];
  const maxLoadout = Math.max(...allValues.map(v => v.avgLoadout));
  const maxBank = Math.max(...allValues.map(v => v.avgBank));
  const maxValue = Math.max(maxLoadout + maxBank, 1);

  // Summary
  const myAvgLoadout = myEconomy.length > 0
    ? Math.round(myEconomy.reduce((s, e) => s + e.avgLoadout, 0) / myEconomy.length)
    : 0;
  const enemyAvgLoadout = enemyEconomy.length > 0
    ? Math.round(enemyEconomy.reduce((s, e) => s + e.avgLoadout, 0) / enemyEconomy.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <div className="text-emerald-600 text-xs font-medium mb-1">味方チーム 平均装備価値</div>
          <div className="text-foreground text-xl font-bold">{myAvgLoadout.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <div className="text-rose-500 text-xs font-medium mb-1">敵チーム 平均装備価値</div>
          <div className="text-foreground text-xl font-bold">{enemyAvgLoadout.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
        <h3 className="text-foreground text-sm font-bold mb-4">ラウンド別エコノミー推移</h3>
        <div className="flex flex-col gap-6">
          <BarChart
            data={myEconomy}
            maxValue={maxValue}
            label="味方チーム（装備価値 / 残金）"
            colorClass="text-emerald-600"
            bgClass="bg-emerald-500"
          />
          <BarChart
            data={enemyEconomy}
            maxValue={maxValue}
            label="敵チーム（装備価値 / 残金）"
            colorClass="text-rose-500"
            bgClass="bg-rose-400"
          />
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> /
            <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> 装備価値
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 opacity-40 inline-block" /> /
            <span className="w-3 h-3 rounded-sm bg-rose-400 opacity-40 inline-block" /> 残金
          </span>
        </div>
      </div>

      {/* Per-round detail table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-foreground text-sm font-bold">ラウンド別詳細</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase">
                <th className="px-3 py-2 text-left">R</th>
                <th className="px-3 py-2 text-right">味方 装備</th>
                <th className="px-3 py-2 text-right">味方 残金</th>
                <th className="px-3 py-2 text-right">敵 装備</th>
                <th className="px-3 py-2 text-right">敵 残金</th>
                <th className="px-3 py-2 text-center">差額</th>
              </tr>
            </thead>
            <tbody>
              {myEconomy.map((my, idx) => {
                const enemy = enemyEconomy[idx];
                const diff = my.avgLoadout - (enemy?.avgLoadout || 0);
                return (
                  <tr key={idx} className="border-b border-border/20 hover:bg-slate-50/50">
                    <td className="px-3 py-1.5 text-muted-foreground">{my.roundNum}</td>
                    <td className="px-3 py-1.5 text-right text-emerald-600">{my.avgLoadout.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-emerald-600/50">{my.avgBank.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-rose-500">{enemy?.avgLoadout.toLocaleString() || '-'}</td>
                    <td className="px-3 py-1.5 text-right text-rose-500/50">{enemy?.avgBank.toLocaleString() || '-'}</td>
                    <td className={`px-3 py-1.5 text-center ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                      {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
