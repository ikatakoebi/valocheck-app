'use client';

import type { MatchRound } from './MatchDetail';

interface RoundTimelineProps {
  rounds: MatchRound[];
  myTeamId: string;
  enemyTeamId: string;
}

// SVG icons for round end types
function EliminatedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BombIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4V2M6.5 2.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DefuseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2L8 6M8 10L8 14M2 8H6M10 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6.5V9L9.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function getEndTypeIcon(endType: string) {
  const cls = "w-3.5 h-3.5";
  switch (endType) {
    case 'Eliminated':
      return <EliminatedIcon className={cls} />;
    case 'Bomb detonated':
      return <BombIcon className={cls} />;
    case 'Bomb defused':
      return <DefuseIcon className={cls} />;
    case 'Round timer expired':
      return <TimerIcon className={cls} />;
    default:
      return <span className="text-xs">•</span>;
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
  let myScore = 0;
  let enemyScore = 0;
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
              <span className="text-[10px] text-[#94A3B8] mb-0.5 font-mono">{rd.round}</span>
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center cursor-default ${
                  rd.myWin
                    ? 'bg-[#F0FDF4] border border-[#DCFCE7] text-[#10B981]'
                    : 'bg-rose-50 border border-rose-100 text-[#E11D48]'
                }`}
              >
                {getEndTypeIcon(rd.endType)}
              </div>
            </div>
            {rd.isHalf && rd.round < rounds.length && (
              <div className="mx-1 w-px h-8 bg-[#E2E8F0] shrink-0" />
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[#64748B]">
        <span className="flex items-center gap-1"><EliminatedIcon className="w-3 h-3" /> 殲滅</span>
        <span className="flex items-center gap-1"><BombIcon className="w-3 h-3" /> 爆破</span>
        <span className="flex items-center gap-1"><DefuseIcon className="w-3 h-3" /> 解除</span>
        <span className="flex items-center gap-1"><TimerIcon className="w-3 h-3" /> 時間切れ</span>
      </div>
    </div>
  );
}
