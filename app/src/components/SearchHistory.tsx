'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSearchHistory, clearSearchHistory, SearchHistoryEntry } from '@/lib/search-history';
import { translateRankTier, getRankIconUrl } from '@/lib/constants';

export default function SearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(getSearchHistory());
  }, []);

  if (!mounted || history.length === 0) {
    return null;
  }

  function handleClear() {
    clearSearchHistory();
    setHistory([]);
  }

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[#0F172A] text-sm font-semibold uppercase tracking-wider">
          最近の検索
        </h2>
        <button
          onClick={handleClear}
          className="text-[#64748B] hover:text-[#0F172A] text-xs transition-colors"
        >
          履歴をクリア
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {history.map((entry) => {
          const isUnranked = !entry.rankTier || !entry.rankTierNumber || entry.rankTierNumber === 0;
          const translatedRank = isUnranked
            ? 'ランクなし'
            : translateRankTier(entry.rankTier!);
          const iconUrl = isUnranked ? '' : getRankIconUrl(entry.rankTierNumber!);

          return (
            <Link
              key={`${entry.name}#${entry.tag}`}
              href={`/player/${encodeURIComponent(entry.name)}/${encodeURIComponent(entry.tag)}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0D9488]/30 hover:shadow-sm transition-all group"
            >
              {/* Rank icon */}
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={translatedRank}
                  className="w-7 h-7 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#F8FAFC] flex items-center justify-center shrink-0">
                  <span className="text-[#94A3B8] text-[8px]">N/A</span>
                </div>
              )}

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <span className="text-[#0F172A] text-sm font-medium group-hover:text-[#0D9488] transition-colors truncate block">
                  {entry.name}
                  <span className="text-[#64748B] font-normal">#{entry.tag}</span>
                </span>
              </div>

              {/* Rank */}
              <span className="text-[#64748B] text-xs shrink-0">
                {translatedRank}
              </span>

              {/* Arrow */}
              <svg
                className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0D9488] transition-colors shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
