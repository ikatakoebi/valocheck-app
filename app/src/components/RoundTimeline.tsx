'use client';

import type { MatchRound } from './MatchDetail';

interface RoundTimelineProps {
  rounds: MatchRound[];
  myTeamId: string;
  enemyTeamId: string;
}

// Elimination: circle with X through it (like tracker.gg)
function EliminationIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2.5" />
      <path d="M8 8L16 16M16 8L8 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Defuse: wire cutter / pliers shape (like tracker.gg)
function DefuseIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 2L12 10L15 2" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22L12 14L15 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Detonation: spike explosion (starburst)
function DetonationIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill={color} />
      <path d="M12 2V7M12 17V22M2 12H7M17 12H22M4.9 4.9L8.1 8.1M15.9 15.9L19.1 19.1M19.1 4.9L15.9 8.1M8.1 15.9L4.9 19.1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Timer expired: clock
function TimerIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="8" stroke={color} strokeWidth="2" />
      <path d="M12 9V13L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function getRoundIcon(endType: string, isWin: boolean) {
  const color = isWin ? '#10B981' : '#E11D48';
  switch (endType) {
    case 'Eliminated':
      return <EliminationIcon color={color} />;
    case 'Bomb detonated':
      return <DetonationIcon color={color} />;
    case 'Bomb defused':
      return <DefuseIcon color={color} />;
    case 'Round timer expired':
      return <TimerIcon color={color} />;
    default:
      return <EliminationIcon color={color} />;
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
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col min-w-fit">
          {/* My team row */}
          <div className="flex items-center">
            <div className="w-24 shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">味方</span>
              <span className="text-lg font-mono font-bold text-[#10B981]">{myScore}</span>
            </div>
            <div className="flex items-center">
              {roundData.map((rd) => (
                <div key={`my-${rd.round}`} className="flex items-center">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    title={`R${rd.round}: ${getEndTypeLabel(rd.endType)} (${rd.myScore}-${rd.enemyScore})`}
                  >
                    {rd.myWin ? (
                      getRoundIcon(rd.endType, true)
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                    )}
                  </div>
                  {rd.isHalf && rd.round < rounds.length && (
                    <div className="w-px h-6 bg-[#E2E8F0] mx-1 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Enemy team row */}
          <div className="flex items-center">
            <div className="w-24 shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">敵</span>
              <span className="text-lg font-mono font-bold text-[#E11D48]">{enemyScore}</span>
            </div>
            <div className="flex items-center">
              {roundData.map((rd) => (
                <div key={`enemy-${rd.round}`} className="flex items-center">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    title={`R${rd.round}: ${getEndTypeLabel(rd.endType)} (${rd.myScore}-${rd.enemyScore})`}
                  >
                    {!rd.myWin ? (
                      getRoundIcon(rd.endType, false)
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                    )}
                  </div>
                  {rd.isHalf && rd.round < rounds.length && (
                    <div className="w-px h-6 bg-[#E2E8F0] mx-1 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Round numbers */}
          <div className="flex items-center mt-0.5">
            <div className="w-24 shrink-0" />
            <div className="flex items-center">
              {roundData.map((rd) => (
                <div key={`num-${rd.round}`} className="flex items-center">
                  <div className="w-7 text-center">
                    <span className="text-[10px] text-[#94A3B8] font-mono">{rd.round}</span>
                  </div>
                  {rd.isHalf && rd.round < rounds.length && (
                    <div className="w-px mx-1 shrink-0" />
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
