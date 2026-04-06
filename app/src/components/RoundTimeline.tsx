'use client';

import type { MatchRound } from './MatchDetail';

interface RoundTimelineProps {
  rounds: MatchRound[];
  myTeamId: string;
  enemyTeamId: string;
}

function getEndTypeIcon(endType: string): string {
  switch (endType) {
    case 'Eliminated':
      return '💀';
    case 'Bomb detonated':
      return '💣';
    case 'Bomb defused':
      return '🛡️';
    case 'Round timer expired':
      return '⏱️';
    default:
      return '•';
  }
}

function getEndTypeLabel(endType: string): string {
  switch (endType) {
    case 'Eliminated':
      return '殲滅';
    case 'Bomb detonated':
      return '爆破';
    case 'Bomb defused':
      return '解除';
    case 'Round timer expired':
      return '時間切れ';
    default:
      return endType;
  }
}

export default function RoundTimeline({ rounds, myTeamId, enemyTeamId }: RoundTimelineProps) {
  // Compute running score
  let myScore = 0;
  let enemyScore = 0;

  // Find half point (usually round 12 in standard game)
  const halfPoint = 12;

  const roundData = rounds.map((round, idx) => {
    const myWin = round.winning_team === myTeamId;
    const enemyWin = round.winning_team === enemyTeamId;
    if (myWin) myScore++;
    if (enemyWin) enemyScore++;
    return {
      round: idx + 1,
      myWin,
      endType: round.end_type,
      myScore,
      enemyScore,
      isHalf: idx + 1 === halfPoint,
    };
  });

  return (
    <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]">
      <h3 className="text-[#0F172A] text-sm font-bold mb-3">ラウンドタイムライン</h3>
      <div className="flex flex-wrap items-center gap-1">
        {roundData.map((rd) => (
          <div key={rd.round} className="flex items-center">
            <div
              className="relative flex flex-col items-center"
              title={`R${rd.round}: ${getEndTypeLabel(rd.endType)} (${rd.myScore}-${rd.enemyScore})`}
            >
              {/* Round number */}
              <span className="text-[10px] text-[#94A3B8] mb-0.5 font-mono">{rd.round}</span>
              {/* Win/Loss indicator */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs cursor-default ${
                  rd.myWin
                    ? 'bg-[#F0FDF4] border border-[#DCFCE7] text-[#10B981]'
                    : 'bg-rose-50 border border-rose-100 text-[#E11D48]'
                }`}
              >
                {getEndTypeIcon(rd.endType)}
              </div>
            </div>
            {/* Half divider */}
            {rd.isHalf && rd.round < rounds.length && (
              <div className="mx-1 w-px h-8 bg-[#E2E8F0] shrink-0" />
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[#64748B]">
        <span className="flex items-center gap-1"><span>💀</span> 殲滅</span>
        <span className="flex items-center gap-1"><span>💣</span> 爆破</span>
        <span className="flex items-center gap-1"><span>🛡️</span> 解除</span>
        <span className="flex items-center gap-1"><span>⏱️</span> 時間切れ</span>
      </div>
    </div>
  );
}
