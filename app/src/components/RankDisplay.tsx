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
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-muted-foreground text-xs">N/A</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-foreground text-xl sm:text-2xl font-bold">{translatedTier}</span>
          {!isUnranked && rr !== null && (
            <div className="flex items-center gap-3">
              <span className="text-slate-600 text-base sm:text-lg">{rr} RR</span>
              {lastChange !== null && lastChange !== 0 && (
                <span
                  className={`text-sm font-medium ${
                    lastChange > 0 ? 'text-emerald-600' : 'text-rose-500'
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
  );
}
