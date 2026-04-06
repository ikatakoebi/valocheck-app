'use client';

import { translateRankTier, getRankIconUrl } from '@/lib/constants';

interface RankDisplayProps {
  tierName: string | null;
  tierNumber: number | null;
  rr: number | null;
  lastChange: number | null;
}

export default function RankDisplay({ tierName, tierNumber, rr, lastChange }: RankDisplayProps) {
  const isUnranked = !tierName || !tierNumber || tierNumber === 0;
  const translatedTier = isUnranked ? 'ランクなし' : translateRankTier(tierName);
  const iconUrl = isUnranked ? '' : getRankIconUrl(tierNumber);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] transition-shadow duration-200 overflow-hidden">
      <div className="w-full h-0.5 bg-[#0D9488]" />
      <div className="p-4 sm:p-6">
        <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3 sm:mb-4">
          コンペティティブ
        </h2>
        <div className="flex items-center gap-4 sm:gap-5">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={translatedTier}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F8FAFC] flex items-center justify-center shrink-0">
              <span className="text-[#94A3B8] text-xs">N/A</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-[#0F172A] text-xl sm:text-2xl font-bold">{translatedTier}</span>
            {!isUnranked && rr !== null && (
              <div className="flex items-center gap-3">
                <span className="text-[#64748B] text-base sm:text-lg font-mono">{rr} RR</span>
                {lastChange !== null && lastChange !== 0 && (
                  <span
                    className={`text-sm font-mono font-medium ${
                      lastChange > 0 ? 'text-[#10B981]' : 'text-[#E11D48]'
                    }`}
                  >
                    {lastChange > 0 ? '+' : ''}
                    {lastChange}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
