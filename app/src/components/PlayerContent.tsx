'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RankDisplay from './RankDisplay';
import MatchList from './MatchList';
import MatchDetailModal from './MatchDetailModal';
import AgentStats from './AgentStats';
import MapStats from './MapStats';
import CompetitiveOverview from './CompetitiveOverview';
import Accuracy from './Accuracy';
import RoleStats from './RoleStats';
import WeaponStats from './WeaponStats';
import PlaylistFilter from './PlaylistFilter';
import SeasonFilter, { parseSeasonShort } from './SeasonFilter';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { addSearchHistory } from '@/lib/search-history';
import { translateRankTier, getRankIconUrl } from '@/lib/constants';

interface PlayerContentProps {
  name: string;
  tag: string;
}

interface AccountData {
  puuid: string;
  name: string;
  tag: string;
  account_level: number;
  region: string;
  card: {
    small: string;
    large: string;
    wide: string;
  };
}

interface SeasonalEntry {
  season: { short: string; id: string };
  wins: number;
  games: number;
  end_tier: { id: number; name: string };
}

interface MmrData {
  current: {
    tier: { id: number; name: string };
    rr: number;
    last_change: number;
  } | null;
  peak: {
    tier: { id: number; name: string };
    rr: number;
    season: { short: string; id: string };
  } | null;
  seasonal?: SeasonalEntry[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MatchData = any;

const REGION_LABELS: Record<string, string> = {
  'ap': 'AP',
  'na': 'NA',
  'eu': 'EU',
  'kr': 'KR',
  'br': 'BR',
  'latam': 'LATAM',
};

const VALID_PLAYLISTS = ['', 'competitive', 'unrated', 'teamdeathmatch'];
const MATCHES_PER_PAGE = 20;

export default function PlayerContent({ name, tag }: PlayerContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPlaylist = (() => {
    const p = searchParams.get('playlist') || '';
    return VALID_PLAYLISTS.includes(p) ? p : '';
  })();
  const initialSeason = searchParams.get('season') || '';

  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [mmr, setMmr] = useState<MmrData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [season, setSeason] = useState(initialSeason);
  const [seasonOptions, setSeasonOptions] = useState<{ short: string; label: string }[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Modal state
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleMatchClick = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedMatchId(null);
  }, []);

  // Fetch matches with optional mode and season filter
  const fetchMatches = useCallback(async (mode: string, start: number = 0, seasonFilter: string = '') => {
    const modeParam = mode ? `&mode=${encodeURIComponent(mode)}` : '';
    const startParam = start > 0 ? `&start=${start}` : '';
    const seasonParam = seasonFilter ? `&season=${encodeURIComponent(seasonFilter)}` : '';
    const matchesRes = await fetch(
      `/api/matches/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${MATCHES_PER_PAGE}${startParam}${modeParam}${seasonParam}`
    );
    if (matchesRes.ok) {
      const matchesData = await matchesRes.json();
      return matchesData.data || [];
    }
    return [];
  }, [name, tag]);

  // Load more matches
  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const newMatches = await fetchMatches(playlist, matches.length, season);
      if (newMatches.length === 0 || newMatches.length < MATCHES_PER_PAGE) {
        setHasMore(false);
      }
      if (newMatches.length > 0) {
        // Filter out duplicates by match_id
        const existingIds = new Set(matches.map((m: MatchData) => m.metadata?.match_id));
        const uniqueNew = newMatches.filter((m: MatchData) => !existingIds.has(m.metadata?.match_id));
        setMatches((prev: MatchData[]) => [...prev, ...uniqueNew]);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, fetchMatches, playlist, season, matches]);

  // Initial full data fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch account first to validate player exists
      const accountRes = await fetch(`/api/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
      if (!accountRes.ok) {
        const err = await accountRes.json();
        throw new Error(err.error || 'プレイヤーが見つかりません');
      }
      const accountData = await accountRes.json();
      setAccount(accountData.data);

      // Fetch MMR and matches in parallel
      const [mmrRes, matchesData] = await Promise.allSettled([
        fetch(`/api/mmr/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`),
        fetchMatches(playlist, 0, season),
      ]);

      // Handle MMR
      let mmrResult: MmrData | null = null;
      if (mmrRes.status === 'fulfilled' && mmrRes.value.ok) {
        const mmrData = await mmrRes.value.json();
        mmrResult = mmrData.data;
        setMmr(mmrResult);

        // Extract season options from seasonal data
        if (mmrResult?.seasonal && Array.isArray(mmrResult.seasonal)) {
          const options = mmrResult.seasonal
            .filter((s: SeasonalEntry) => s.season?.short)
            .map((s: SeasonalEntry) => ({
              short: s.season.short,
              label: parseSeasonShort(s.season.short),
            }))
            // Sort newest first: compare episode then act descending
            .sort((a: { short: string }, b: { short: string }) => {
              const parseEA = (s: string) => {
                const m = s.match(/^e(\d+)a(\d+)$/);
                return m ? { ep: parseInt(m[1]), act: parseInt(m[2]) } : { ep: 0, act: 0 };
              };
              const aEA = parseEA(a.short);
              const bEA = parseEA(b.short);
              if (bEA.ep !== aEA.ep) return bEA.ep - aEA.ep;
              return bEA.act - aEA.act;
            });
          setSeasonOptions(options);
        }
      } else {
        setMmr(null);
      }

      // Save to search history
      addSearchHistory({
        name: accountData.data.name || name,
        tag: accountData.data.tag || tag,
        rankTier: mmrResult?.current?.tier?.name ?? null,
        rankTierNumber: mmrResult?.current?.tier?.id ?? null,
      });

      // Handle matches
      if (matchesData.status === 'fulfilled') {
        const fetchedMatches = matchesData.value;
        setMatches(fetchedMatches);
        setHasMore(fetchedMatches.length >= MATCHES_PER_PAGE);
      } else {
        setMatches([]);
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [name, tag, playlist, season, fetchMatches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle playlist change
  const handlePlaylistChange = useCallback(async (newPlaylist: string) => {
    if (newPlaylist === playlist) return;

    setPlaylist(newPlaylist);

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString());
    if (newPlaylist) {
      params.set('playlist', newPlaylist);
    } else {
      params.delete('playlist');
    }
    if (season) {
      params.set('season', season);
    }
    const newUrl = `/player/${encodeURIComponent(name)}/${encodeURIComponent(tag)}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });

    // Fetch matches with new filter
    setMatchesLoading(true);
    try {
      const newMatches = await fetchMatches(newPlaylist, 0, season);
      setMatches(newMatches);
      setHasMore(newMatches.length >= MATCHES_PER_PAGE);
    } catch {
      setMatches([]);
      setHasMore(false);
    } finally {
      setMatchesLoading(false);
    }
  }, [playlist, season, searchParams, name, tag, router, fetchMatches]);

  // Handle season change
  const handleSeasonChange = useCallback(async (newSeason: string) => {
    if (newSeason === season) return;

    setSeason(newSeason);

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString());
    if (newSeason) {
      params.set('season', newSeason);
    } else {
      params.delete('season');
    }
    if (playlist) {
      params.set('playlist', playlist);
    }
    const newUrl = `/player/${encodeURIComponent(name)}/${encodeURIComponent(tag)}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });

    // Fetch matches with new filter
    setMatchesLoading(true);
    try {
      const newMatches = await fetchMatches(playlist, 0, newSeason);
      setMatches(newMatches);
      setHasMore(newMatches.length >= MATCHES_PER_PAGE);
    } catch {
      setMatches([]);
      setHasMore(false);
    } finally {
      setMatchesLoading(false);
    }
  }, [season, playlist, searchParams, name, tag, router, fetchMatches]);

  if (loading) {
    return <LoadingSpinner message="プレイヤーデータを取得中..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  if (!account) {
    return <ErrorMessage message="プレイヤーが見つかりません" />;
  }

  const regionLabel = REGION_LABELS[account.region?.toLowerCase()] || account.region?.toUpperCase() || '';
  const peakRank = mmr?.peak;
  const peakTierTranslated = peakRank?.tier?.name ? translateRankTier(peakRank.tier.name) : null;
  const peakIconUrl = peakRank?.tier?.id ? getRankIconUrl(peakRank.tier.id) : '';

  return (
    <div className="flex flex-col gap-6">
      {/* Player Header */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3 sm:gap-4">
          {account.card?.wide && (
            <img
              src={account.card.wide}
              alt=""
              className="w-16 h-10 sm:w-24 sm:h-14 object-cover rounded-lg shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-foreground text-lg sm:text-2xl font-bold truncate">
                {account.name}
                <span className="text-muted-foreground font-normal">#{account.tag}</span>
              </h1>
              {regionLabel && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0FDFA] text-[#0D9488] shrink-0">
                  {regionLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-muted-foreground text-sm">
                レベル <span className="text-foreground font-mono font-semibold">{account.account_level}</span>
              </span>
              {peakTierTranslated && (
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  ピーク:
                  {peakIconUrl && (
                    <img
                      src={peakIconUrl}
                      alt={peakTierTranslated}
                      className="w-5 h-5 object-contain inline-block"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-[#D97706] font-medium">
                    {peakTierTranslated}
                  </span>
                  {peakRank?.rr !== undefined && (
                    <span className="text-muted-foreground/70 text-xs font-mono">({peakRank.rr} RR)</span>
                  )}
                  {peakRank?.season?.short && (
                    <span className="text-muted-foreground/70 text-xs">- {peakRank.season.short}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rank */}
      <RankDisplay
        tierName={mmr?.current?.tier?.name ?? null}
        tierNumber={mmr?.current?.tier?.id ?? null}
        rr={mmr?.current?.rr ?? null}
        lastChange={mmr?.current?.last_change ?? null}
      />

      {/* Playlist & Season Filter */}
      <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-muted-foreground text-sm font-medium shrink-0">プレイリスト:</span>
          <PlaylistFilter
            current={playlist}
            onChange={handlePlaylistChange}
            loading={matchesLoading}
          />
          {seasonOptions.length > 0 && (
            <>
              <span className="text-border hidden sm:inline">|</span>
              <span className="text-muted-foreground text-sm font-medium shrink-0">シーズン:</span>
              <SeasonFilter
                seasons={seasonOptions}
                current={season}
                onChange={handleSeasonChange}
                loading={matchesLoading}
              />
            </>
          )}
        </div>
      </div>

      {/* Loading overlay for playlist change */}
      {matchesLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">データを更新中...</span>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className={`flex flex-col lg:flex-row gap-6 ${matchesLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Left Column: Accuracy, Role Stats, Weapon Stats */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0">
          <Accuracy
            matches={matches}
            puuid={account.puuid}
            playerName={account.name}
            playerTag={account.tag}
          />
          <RoleStats
            matches={matches}
            puuid={account.puuid}
            playerName={account.name}
            playerTag={account.tag}
          />
          <WeaponStats
            matches={matches}
            puuid={account.puuid}
          />
        </div>

        {/* Right Column: Competitive Overview, Agent Stats, Map Stats */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <CompetitiveOverview
            matches={matches}
            puuid={account.puuid}
            playerName={account.name}
            playerTag={account.tag}
          />
          <AgentStats
            matches={matches}
            puuid={account.puuid}
            playerName={account.name}
            playerTag={account.tag}
          />
          <MapStats
            matches={matches}
            puuid={account.puuid}
            playerName={account.name}
            playerTag={account.tag}
          />
        </div>
      </div>

      {/* Match History - Full width below two-column layout */}
      <div className={matchesLoading ? 'opacity-50 pointer-events-none' : ''}>
        <MatchList
          matches={matches}
          playerName={account.name}
          playerTag={account.tag}
          puuid={account.puuid}
          onMatchClick={handleMatchClick}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          hasMore={hasMore}
        />
      </div>

      {/* Match Detail Modal */}
      <MatchDetailModal
        matchId={selectedMatchId}
        open={modalOpen}
        onClose={handleModalClose}
        playerName={account.name}
        playerTag={account.tag}
      />
    </div>
  );
}
