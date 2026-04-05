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
    <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
      <h3 className="text-foreground text-sm font-bold mb-3">ラウンドタイムライン</h3>
      <div className="flex flex-wrap items-center gap-1">
        {roundData.map((rd) => (
          <div key={rd.round} className="flex items-center">
            <div
              className="relative flex flex-col items-center"
              title={`R${rd.round}: ${getEndTypeLabel(rd.endType)} (${rd.myScore}-${rd.enemyScore})`}
            >
              {/* Round number */}
              <span className="text-[10px] text-muted-foreground/50 mb-0.5">{rd.round}</span>
              {/* Win/Loss indicator */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs cursor-default ${
                  rd.myWin
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-600'
                    : 'bg-rose-100 border border-rose-300 text-rose-500'
                }`}
              >
                {getEndTypeIcon(rd.endType)}
              </div>
            </div>
            {/* Half divider */}
            {rd.isHalf && rd.round < rounds.length && (
              <div className="mx-1 w-px h-8 bg-border shrink-0" />
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span>💀</span> 殲滅</span>
        <span className="flex items-center gap-1"><span>💣</span> 爆破</span>
        <span className="flex items-center gap-1"><span>🛡️</span> 解除</span>
        <span className="flex items-center gap-1"><span>⏱️</span> 時間切れ</span>
      </div>
    </div>
  );
}
