'use client';

import { getRankIconUrl } from '@/lib/constants';

interface MatchPlayerInfo {
  puuid: string;
  name: string;
  tag: string;
  agent: { id: string; name: string };
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
    damage: {
      dealt: number;
      received: number;
    };
  };
  team_id: string;
  tier: { id: number; name: string };
}

interface MatchTeamInfo {
  team_id: string;
  rounds: { won: number; lost: number };
  won: boolean;
}

interface MatchInfo {
  metadata: {
    match_id: string;
    map: { name: string };
    started_at: string;
    queue: { name: string; mode_type: string };
  };
  players: MatchPlayerInfo[];
  teams: MatchTeamInfo[];
}

interface MatchListProps {
  matches: MatchInfo[];
  playerName: string;
  playerTag: string;
  puuid: string;
  onMatchClick?: (matchId: string) => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

function getAgentIconUrl(agentId: string): string {
  if (!agentId) return '';
  return `https://media.valorant-api.com/agents/${agentId}/displayicon.png`;
}

function formatElapsedTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 1) return '今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffWeeks < 4) return `${diffWeeks}週間前`;
    return `${diffMonths}ヶ月前`;
  } catch {
    return '';
  }
}

function getDateKey(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '不明';
  }
}

function getDateLabel(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';

    const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
    }) + ` (${weekday})`;
  } catch {
    return '不明';
  }
}

interface ProcessedMatch {
  match: MatchInfo;
  player: MatchPlayerInfo;
  isWin: boolean;
  teamRoundsWon: number;
  opponentRoundsWon: number;
  totalRounds: number;
  acs: number;
  hsPercent: number;
  ddDelta: number;
  ranking: number; // position among all players by ACS
  rankLabel: string;
}

interface DayGroup {
  dateKey: string;
  dateLabel: string;
  matches: ProcessedMatch[];
  summary: {
    wins: number;
    losses: number;
    totalKills: number;
    totalDeaths: number;
    hsPercent: number;
    avgAcs: number;
  };
}

function processMatches(
  matches: MatchInfo[],
  puuid: string,
  playerName: string,
  playerTag: string
): ProcessedMatch[] {
  const processed: ProcessedMatch[] = [];

  for (const match of matches) {
    const player = match.players?.find(
      (p) =>
        p.puuid === puuid ||
        (p.name?.toLowerCase() === playerName.toLowerCase() &&
          p.tag?.toLowerCase() === playerTag.toLowerCase())
    ) as MatchPlayerInfo | undefined;

    if (!player) continue;

    const playerTeam = match.teams?.find((t) => t.team_id === player.team_id);
    const isWin = playerTeam?.won ?? false;
    const teamRoundsWon = playerTeam?.rounds?.won ?? 0;
    const opponentTeam = match.teams?.find((t) => t.team_id !== player.team_id);
    const opponentRoundsWon = opponentTeam?.rounds?.won ?? 0;
    const totalRounds = teamRoundsWon + opponentRoundsWon;

    const acs = totalRounds > 0 ? (player.stats?.score || 0) / totalRounds : 0;
    const totalShots = (player.stats?.headshots || 0) + (player.stats?.bodyshots || 0) + (player.stats?.legshots || 0);
    const hsPercent = totalShots > 0 ? ((player.stats?.headshots || 0) / totalShots) * 100 : 0;
    const ddDelta = totalRounds > 0
      ? ((player.stats?.damage?.dealt || 0) - (player.stats?.damage?.received || 0)) / totalRounds
      : 0;

    // Calculate ranking by ACS (all players in this match)
    const allPlayersAcs = match.players
      ?.map((p) => {
        const r = match.teams?.reduce((s: number, t: MatchTeamInfo) => s + (t.rounds?.won || 0), 0) || 1;
        return { puuid: p.puuid, acs: r > 0 ? (p.stats?.score || 0) / r : 0 };
      })
      .sort((a, b) => b.acs - a.acs) || [];

    const ranking = allPlayersAcs.findIndex((p) => p.puuid === player.puuid) + 1;
    let rankLabel = `${ranking}位`;
    if (ranking === 1) rankLabel = 'MVP';
    else if (ranking === 2) rankLabel = '2nd';
    else if (ranking === 3) rankLabel = '3rd';

    processed.push({
      match,
      player,
      isWin,
      teamRoundsWon,
      opponentRoundsWon,
      totalRounds,
      acs,
      hsPercent,
      ddDelta,
      ranking,
      rankLabel,
    });
  }

  return processed;
}

function groupByDay(processedMatches: ProcessedMatch[]): DayGroup[] {
  const groups = new Map<string, ProcessedMatch[]>();

  for (const pm of processedMatches) {
    const dateKey = getDateKey(pm.match.metadata.started_at);
    const existing = groups.get(dateKey) || [];
    existing.push(pm);
    groups.set(dateKey, existing);
  }

  const result: DayGroup[] = [];
  for (const [dateKey, dayMatches] of groups) {
    // Calculate summary
    let wins = 0;
    let losses = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalHeadshots = 0;
    let totalShots = 0;
    let totalAcs = 0;

    for (const pm of dayMatches) {
      if (pm.isWin) wins++;
      else losses++;
      totalKills += pm.player.stats?.kills || 0;
      totalDeaths += pm.player.stats?.deaths || 0;
      totalHeadshots += pm.player.stats?.headshots || 0;
      totalShots += (pm.player.stats?.headshots || 0) + (pm.player.stats?.bodyshots || 0) + (pm.player.stats?.legshots || 0);
      totalAcs += pm.acs;
    }

    const hsPercent = totalShots > 0 ? (totalHeadshots / totalShots) * 100 : 0;
    const avgAcs = dayMatches.length > 0 ? totalAcs / dayMatches.length : 0;

    result.push({
      dateKey,
      dateLabel: getDateLabel(dayMatches[0].match.metadata.started_at),
      matches: dayMatches,
      summary: {
        wins,
        losses,
        totalKills,
        totalDeaths,
        hsPercent,
        avgAcs,
      },
    });
  }

  return result;
}

export default function MatchList({
  matches,
  playerName,
  playerTag,
  puuid,
  onMatchClick,
  onLoadMore,
  loadingMore = false,
  hasMore = true,
}: MatchListProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
        <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">
          マッチ履歴
        </h2>
        <p className="text-muted-foreground text-center py-8 text-sm">マッチ履歴がありません</p>
      </div>
    );
  }

  const processedMatches = processMatches(matches, puuid, playerName, playerTag);
  const dayGroups = groupByDay(processedMatches);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">
        マッチ履歴
      </h2>

      <div className="flex flex-col gap-6">
        {dayGroups.map((group) => {
          const kd = group.summary.totalDeaths > 0
            ? (group.summary.totalKills / group.summary.totalDeaths)
            : group.summary.totalKills;

          return (
            <div key={group.dateKey}>
              {/* Day header with summary */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-foreground text-sm font-semibold">{group.dateLabel}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-medium ${group.summary.wins >= group.summary.losses ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {group.summary.wins}W-{group.summary.losses}L
                  </span>
                  <span className={`${kd >= 1 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    K/D {kd.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    HS {group.summary.hsPercent.toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">
                    ACS {group.summary.avgAcs.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Matches in this day */}
              <div className="flex flex-col gap-1.5">
                {group.matches.map((pm) => {
                  const { match, player, isWin, teamRoundsWon, opponentRoundsWon } = pm;
                  const agentName = player.agent?.name ?? '不明';
                  const agentIconUrl = getAgentIconUrl(player.agent?.id);
                  const mapName = match.metadata.map?.name ?? '不明';
                  const elapsed = formatElapsedTime(match.metadata.started_at);
                  const rankIconUrl = player.tier?.id ? getRankIconUrl(player.tier.id) : '';
                  const { kills, deaths, assists } = player.stats;

                  return (
                    <button
                      type="button"
                      key={match.metadata.match_id}
                      onClick={() => onMatchClick?.(match.metadata.match_id)}
                      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer text-left w-full ${
                        isWin
                          ? 'border-l-4 border-l-emerald-500 border-t-border border-r-border border-b-border bg-emerald-50/50 hover:bg-emerald-50'
                          : 'border-l-4 border-l-rose-400 border-t-border border-r-border border-b-border bg-rose-50/50 hover:bg-rose-50'
                      }`}
                    >
                      {/* Win/Loss + Rank indicator */}
                      <div className="flex flex-col items-center gap-0.5 w-6 shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            isWin ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isWin ? 'W' : 'L'}
                        </span>
                        {rankIconUrl && (
                          <img
                            src={rankIconUrl}
                            alt=""
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      {/* Agent icon + name */}
                      <div className="flex items-center gap-1.5 w-24 sm:w-28 shrink-0 min-w-0">
                        {agentIconUrl && (
                          <img
                            src={agentIconUrl}
                            alt={agentName}
                            className="w-7 h-7 rounded-full object-cover shrink-0 bg-slate-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-foreground text-sm font-medium truncate">{agentName}</span>
                      </div>

                      {/* Map */}
                      <div className="w-16 sm:w-20 shrink-0 hidden sm:block">
                        <span className="text-foreground/70 text-sm truncate block">{mapName}</span>
                      </div>

                      {/* Score */}
                      <div className="w-12 sm:w-14 shrink-0 text-center">
                        <span
                          className={`text-sm font-semibold ${
                            isWin ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {teamRoundsWon}-{opponentRoundsWon}
                        </span>
                      </div>

                      {/* K/D/A */}
                      <div className="w-16 sm:w-20 shrink-0">
                        <span className="text-sm">
                          <span className="text-emerald-600">{kills}</span>
                          <span className="text-muted-foreground/50">/</span>
                          <span className="text-rose-500">{deaths}</span>
                          <span className="text-muted-foreground/50">/</span>
                          <span className="text-slate-600">{assists}</span>
                        </span>
                      </div>

                      {/* Additional stats: ACS, HS%, DDdelta */}
                      <div className="hidden sm:flex items-center gap-2.5 text-xs flex-1 min-w-0">
                        <span className="text-muted-foreground">
                          ACS <span className="text-foreground font-medium">{pm.acs.toFixed(0)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          HS <span className="text-foreground font-medium">{pm.hsPercent.toFixed(0)}%</span>
                        </span>
                        <span className={`${pm.ddDelta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {`DD\u0394`} {pm.ddDelta >= 0 ? '+' : ''}{pm.ddDelta.toFixed(0)}
                        </span>
                      </div>

                      {/* Ranking */}
                      <div className="shrink-0">
                        <span
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                            pm.ranking === 1
                              ? 'bg-amber-100 text-amber-700'
                              : pm.ranking <= 3
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-slate-50 text-muted-foreground'
                          }`}
                        >
                          {pm.rankLabel}
                        </span>
                      </div>

                      {/* Elapsed time */}
                      <div className="shrink-0 hidden sm:block w-14 text-right">
                        <span className="text-muted-foreground/70 text-xs">{elapsed}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>読み込み中...</span>
              </>
            ) : (
              <span>もっと読み込む</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
