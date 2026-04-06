'use client';

import type { MatchRound } from './MatchDetail';

interface RoundTimelineProps {
  rounds: MatchRound[];
  myTeamId: string;
  enemyTeamId: string;
}

// Elimination icon (X pattern like tracker.gg)
function EliminatedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3L8 8M8 8L13 3M8 8L3 13M8 8L13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M1 1L5 5M11 1L7 5M1 15L5 11M11 15L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

// Spike detonated icon
function DetonatedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1V4M8 12V15M1 8H4M12 8H15M3 3L5 5M11 3L9 5M3 13L5 11M11 13L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );
}

// Spike defused icon
function DefusedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2L13 5.5V10.5L8 14L3 10.5V5.5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Timer expired icon (running person like tracker.gg)
function TimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="3.5" r="1.5" fill="currentColor" />
      <path d="M6 7L8 5.5L10 7L9 10L11 13M7 10L5 13M8 5.5L7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getRoundIcon(endType: string, size: string) {
  switch (endType) {
    case 'Eliminated':
      return <EliminatedIcon className={size} />;
    case 'Bomb detonated':
      return <DetonatedIcon className={size} />;
    case 'Bomb defused':
      return <DefusedIcon className={size} />;
    case 'Round timer expired':
      return <TimerIcon className={size} />;
    default:
      return <EliminatedIcon className={size} />;
  }
}

function getEndTypeLabel(endType: string): string {
  switch (endType) {
    case 'Eliminated': return '殲滅';
    case 'Bomb detonated': return '爆破';
    case 'Bomb defused': return '解除';
    case 'Round timer expired': return '時間切れ';
    default: return endType;
  }
}

export default function RoundTimeline({ rounds, myTeamId, enemyTeamId }: RoundTimelineProps) {
  let myScore = 0;
  let enemyScore = 0;
  const halfPoint = 12;

  const roundData = rounds.map((round, idx) => {
    const myWin = round.winning_team === myTeamId;
    if (myWin) myScore++;
    else enemyScore++;
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

      {/* 2-row layout like tracker.gg */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col min-w-fit">
          {/* Row labels + Score */}
          <div className="flex items-center gap-0">
            {/* My team row */}
            <div className="w-20 shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">味方</span>
              <span className="text-sm font-mono font-bold text-[#10B981]">{myScore}</span>
            </div>
            <div className="flex items-center">
              {roundData.map((rd) => (
                <div key={`my-${rd.round}`} className="flex items-center">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    title={`R${rd.round}: ${getEndTypeLabel(rd.endType)} (${rd.myScore}-${rd.enemyScore})`}
                  >
                    {rd.myWin ? (
                      <span className="text-[#10B981]">
                        {getRoundIcon(rd.endType, 'w-4 h-4')}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                    )}
                  </div>
                  {rd.isHalf && rd.round < rounds.length && (
                    <div className="w-px h-7 bg-[#E2E8F0] mx-0.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Enemy team row */}
          <div className="flex items-center gap-0">
            <div className="w-20 shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">敵</span>
              <span className="text-sm font-mono font-bold text-[#E11D48]">{enemyScore}</span>
            </div>
            <div className="flex items-center">
              {roundData.map((rd) => (
                <div key={`enemy-${rd.round}`} className="flex items-center">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    title={`R${rd.round}: ${getEndTypeLabel(rd.endType)} (${rd.myScore}-${rd.enemyScore})`}
                  >
                    {!rd.myWin ? (
                      <span className="text-[#E11D48]">
                        {getRoundIcon(rd.endType, 'w-4 h-4')}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                    )}
                  </div>
                  {rd.isHalf && rd.round < rounds.length && (
                    <div className="w-px h-7 bg-[#E2E8F0] mx-0.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Round numbers */}
          <div className="flex items-center gap-0 mt-0.5">
            <div className="w-20 shrink-0" />
            <div className="flex items-center">
              {roundData.map((rd) => (
                <div key={`num-${rd.round}`} className="flex items-center">
                  <div className="w-7 text-center">
                    <span className="text-[10px] text-[#94A3B8] font-mono">{rd.round}</span>
                  </div>
                  {rd.isHalf && rd.round < rounds.length && (
                    <div className="w-px mx-0.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
