'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import RoundTimeline from './RoundTimeline';
import PerformanceTab from './PerformanceTab';
import EconomyTab from './EconomyTab';
import DuelsTab from './DuelsTab';
import { getRankIconUrl, translateRankTier } from '@/lib/constants';

// Types
export interface MatchPlayer {
  puuid: string;
  name: string;
  tag: string;
  team_id: string;
  agent: {
    id: string;
    name: string;
  };
  stats: {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
    damage: {
      dealt: number;
      received: number;
    };
  };
  tier: {
    id: number;
    name: string;
  };
  account_level: number;
}

export interface MatchTeam {
  team_id: string;
  rounds: {
    won: number;
    lost: number;
  };
  won: boolean;
}

export interface RoundStat {
  player: {
    puuid: string;
    name: string;
    tag: string;
    team: string;
  };
  stats: {
    score: number;
    kills: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
    damage: number;
  };
  economy: {
    loadout_value: number;
    remaining: number;
    spent: number;
    weapon: { id: string; name: string } | null;
    armor: { id: string; name: string } | null;
  };
  ability_casts: Record<string, number>;
  damage_events: Array<{
    receiver_puuid: string;
    receiver_display_name: string;
    damage: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
  }>;
}

export interface MatchRound {
  id: number;
  winning_team: string;
  end_type: string;
  bomb_planted: boolean;
  bomb_defused: boolean;
  stats: RoundStat[];
}

export interface MatchKill {
  time_in_round_in_ms: number;
  time_in_match_in_ms: number;
  round: number;
  killer: {
    puuid: string;
    name: string;
    tag: string;
    team: string;
  };
  victim: {
    puuid: string;
    name: string;
    tag: string;
    team: string;
  };
  assistants: Array<{
    puuid: string;
    name: string;
    tag: string;
    team: string;
  }>;
  damage_weapon_id: string;
  damage_weapon_name: string;
}

interface MatchMetadata {
  match_id: string;
  map: {
    id: string;
    name: string;
  };
  game_length_in_ms: number;
  started_at: string;
  queue: {
    id: string;
    name: string;
    mode_type: string;
  };
  region: string;
}

interface MatchData {
  metadata: MatchMetadata;
  players: MatchPlayer[];
  teams: MatchTeam[];
  rounds: MatchRound[];
  kills: MatchKill[];
}

interface MatchDetailProps {
  matchId: string;
  highlightName?: string;
  highlightTag?: string;
}

// Extended player stats computed from rounds/kills
interface ExtendedPlayerStats {
  plusMinus: number;    // K-D
  ddDelta: number;     // Damage Dealt - Damage Received
  adr: number;         // Average Damage per Round
  kast: number;        // KAST %
  firstKills: number;  // FK
  firstDeaths: number; // FD
  multiKills: number;  // MK (3+ kills in a round)
}

type TabType = 'scoreboard' | 'performance' | 'economy' | 'duels';

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function translateMode(mode: string): string {
  const modeMap: Record<string, string> = {
    'Competitive': 'コンペティティブ',
    'Unrated': 'アンレート',
    'Spike Rush': 'スパイクラッシュ',
    'Deathmatch': 'デスマッチ',
    'Escalation': 'エスカレーション',
    'Replication': 'レプリケーション',
    'Swiftplay': 'スウィフトプレイ',
    'Premier': 'プレミア',
    'Team Deathmatch': 'チームデスマッチ',
  };
  return modeMap[mode] || mode || '不明';
}

function calculateACS(score: number, roundsPlayed: number): number {
  if (roundsPlayed === 0) return 0;
  return Math.round(score / roundsPlayed);
}

function calculateHeadshotRate(player: MatchPlayer): number {
  const total = player.stats.headshots + player.stats.bodyshots + player.stats.legshots;
  if (total === 0) return 0;
  return Math.round((player.stats.headshots / total) * 100);
}

function computeExtendedStats(
  player: MatchPlayer,
  rounds: MatchRound[],
  kills: MatchKill[],
  totalRounds: number
): ExtendedPlayerStats {
  const plusMinus = player.stats.kills - player.stats.deaths;
  const ddDelta = player.stats.damage.dealt - player.stats.damage.received;
  const adr = totalRounds > 0 ? Math.round(player.stats.damage.dealt / totalRounds) : 0;

  // KAST: Kill or Assist or Survived or Traded
  let kastRounds = 0;
  for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
    const roundKills = kills.filter(k => k.round === rIdx);

    // Kill: player got a kill this round
    const gotKill = roundKills.some(k => k.killer.puuid === player.puuid);

    // Assist: player assisted in a kill this round
    const gotAssist = roundKills.some(k =>
      k.assistants.some(a => a.puuid === player.puuid)
    );

    // Survived: player did not die this round
    const died = roundKills.some(k => k.victim.puuid === player.puuid);
    const survived = !died;

    if (gotKill || gotAssist || survived) {
      kastRounds++;
    }
  }
  const kast = totalRounds > 0 ? Math.round((kastRounds / totalRounds) * 100) : 0;

  // FK: First kills per round
  let firstKills = 0;
  let firstDeaths = 0;
  for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
    const roundKills = kills
      .filter(k => k.round === rIdx)
      .sort((a, b) => a.time_in_round_in_ms - b.time_in_round_in_ms);
    if (roundKills.length > 0) {
      if (roundKills[0].killer.puuid === player.puuid) firstKills++;
      if (roundKills[0].victim.puuid === player.puuid) firstDeaths++;
    }
  }

  // MK: Multi-kills (3+ kills in a single round)
  let multiKills = 0;
  for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
    const roundKillCount = kills.filter(
      k => k.round === rIdx && k.killer.puuid === player.puuid
    ).length;
    if (roundKillCount >= 3) multiKills++;
  }

  return { plusMinus, ddDelta, adr, kast, firstKills, firstDeaths, multiKills };
}

function computeAverageRank(players: MatchPlayer[]): string | null {
  const rankedPlayers = players.filter(p => p.tier && p.tier.id > 0);
  if (rankedPlayers.length === 0) return null;
  const avgTier = Math.round(
    rankedPlayers.reduce((sum, p) => sum + p.tier.id, 0) / rankedPlayers.length
  );
  // Map tier ID to approximate rank name
  const tierNames: Record<number, string> = {
    3: 'Iron 1', 4: 'Iron 2', 5: 'Iron 3',
    6: 'Bronze 1', 7: 'Bronze 2', 8: 'Bronze 3',
    9: 'Silver 1', 10: 'Silver 2', 11: 'Silver 3',
    12: 'Gold 1', 13: 'Gold 2', 14: 'Gold 3',
    15: 'Platinum 1', 16: 'Platinum 2', 17: 'Platinum 3',
    18: 'Diamond 1', 19: 'Diamond 2', 20: 'Diamond 3',
    21: 'Ascendant 1', 22: 'Ascendant 2', 23: 'Ascendant 3',
    24: 'Immortal 1', 25: 'Immortal 2', 26: 'Immortal 3',
    27: 'Radiant',
  };
  return tierNames[avgTier] || null;
}

function TeamTable({
  players,
  team,
  totalRounds,
  isWinningTeam,
  highlightName,
  highlightTag,
  extendedStats,
  hasRoundsData,
}: {
  players: MatchPlayer[];
  team: MatchTeam;
  totalRounds: number;
  isWinningTeam: boolean;
  highlightName?: string;
  highlightTag?: string;
  extendedStats: Map<string, ExtendedPlayerStats>;
  hasRoundsData: boolean;
}) {
  // Sort players by ACS (score/round) descending
  const sortedPlayers = [...players].sort((a, b) => {
    const acsA = totalRounds > 0 ? a.stats.score / totalRounds : 0;
    const acsB = totalRounds > 0 ? b.stats.score / totalRounds : 0;
    return acsB - acsA;
  });

  const teamLabel = isWinningTeam ? '勝利' : '敗北';
  const teamColor = isWinningTeam ? 'text-[#10B981]' : 'text-[#E11D48]';
  const borderColor = isWinningTeam ? 'border-[#10B981]' : 'border-[#E11D48]';

  return (
    <div className={`bg-white rounded-xl border border-[#E2E8F0] overflow-hidden border-t-2 ${borderColor} shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]`}>
      {/* Team Header */}
      <div className="px-4 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`font-bold ${teamColor}`}>{teamLabel}</span>
          <span className="text-[#64748B] text-sm">
            {team.team_id === 'Red' ? 'レッド' : team.team_id === 'Blue' ? 'ブルー' : team.team_id}
          </span>
        </div>
        <span className={`text-lg font-mono font-bold ${teamColor}`}>{team.rounds.won}</span>
      </div>

      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto">
        {/* Table Header */}
        <div className={`min-w-[720px] grid ${hasRoundsData ? 'grid-cols-[1fr_80px_60px_55px_50px_55px_55px_50px_35px_35px_35px]' : 'grid-cols-[1fr_80px_60px_55px]'} gap-1 px-4 py-2 border-b border-[#E2E8F0]/50 text-xs font-medium text-[#64748B] uppercase tracking-wider`}>
          <span>プレイヤー</span>
          <span className="text-center">K/D/A</span>
          <span className="text-center">ACS</span>
          <span className="text-center">HS%</span>
          {hasRoundsData && (
            <>
              <span className="text-center">+/-</span>
              <span className="text-center">DDΔ</span>
              <span className="text-center">ADR</span>
              <span className="text-center">KAST</span>
              <span className="text-center">FK</span>
              <span className="text-center">FD</span>
              <span className="text-center">MK</span>
            </>
          )}
        </div>

        {/* Players */}
        {sortedPlayers.map((player) => {
          const acs = calculateACS(player.stats.score, totalRounds);
          const hsRate = calculateHeadshotRate(player);
          const ext = extendedStats.get(player.puuid);
          const isHighlighted =
            highlightName &&
            highlightTag &&
            player.name?.toLowerCase() === highlightName.toLowerCase() &&
            player.tag?.toLowerCase() === highlightTag.toLowerCase();

          return (
            <div
              key={player.puuid}
              className={`min-w-[720px] grid ${hasRoundsData ? 'grid-cols-[1fr_80px_60px_55px_50px_55px_55px_50px_35px_35px_35px]' : 'grid-cols-[1fr_80px_60px_55px]'} gap-1 px-4 py-4 border-b border-[#E2E8F0]/50 items-center hover:bg-[#F8FAFC]/50 transition-colors ${
                isHighlighted ? 'bg-[#F0FDFA]/50' : ''
              }`}
            >
              {/* Player info */}
              <div className="flex items-center gap-2 min-w-0">
                {player.agent?.id && (
                  <img
                    src={`https://media.valorant-api.com/agents/${player.agent.id}/displayicon.png`}
                    alt={player.agent?.name || ''}
                    className="w-8 h-8 rounded-full object-cover shrink-0 bg-[#F8FAFC]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {player.tier?.id > 0 && (
                  <img
                    src={getRankIconUrl(player.tier.id)}
                    alt=""
                    className="w-5 h-5 shrink-0"
                  />
                )}
                <Link
                  href={`/player/${encodeURIComponent(player.name)}/${encodeURIComponent(player.tag)}`}
                  className="hover:text-[#0D9488] transition-colors truncate"
                >
                  <span className={`text-sm font-medium ${isHighlighted ? 'text-[#0D9488]' : 'text-[#0F172A]'}`}>
                    {player.name}
                  </span>
                  <span className="text-[#64748B] text-xs ml-1 hidden sm:inline">#{player.tag}</span>
                </Link>
                <span className="text-[#94A3B8] text-xs shrink-0 hidden md:inline">{player.agent?.name || '不明'}</span>
              </div>

              {/* K/D/A */}
              <div className="text-center text-sm font-mono">
                <span className="text-[#10B981]">{player.stats.kills}</span>
                <span className="text-[#94A3B8]">/</span>
                <span className="text-[#E11D48]">{player.stats.deaths}</span>
                <span className="text-[#94A3B8]">/</span>
                <span className="text-[#64748B]">{player.stats.assists}</span>
              </div>

              {/* ACS */}
              <div className="text-center">
                <span className="text-[#0F172A] text-sm font-mono font-medium">{acs}</span>
              </div>

              {/* HS% */}
              <div className="text-center">
                <span className="text-[#64748B] text-sm font-mono">{hsRate}%</span>
              </div>

              {/* Extended stats */}
              {hasRoundsData && ext && (
                <>
                  {/* +/- */}
                  <div className="text-center">
                    <span className={`text-sm font-mono ${ext.plusMinus > 0 ? 'text-[#10B981]' : ext.plusMinus < 0 ? 'text-[#E11D48]' : 'text-[#64748B]'}`}>
                      {ext.plusMinus > 0 ? '+' : ''}{ext.plusMinus}
                    </span>
                  </div>

                  {/* DDΔ */}
                  <div className="text-center">
                    <span className={`text-sm font-mono ${ext.ddDelta > 0 ? 'text-[#10B981]' : ext.ddDelta < 0 ? 'text-[#E11D48]' : 'text-[#64748B]'}`}>
                      {ext.ddDelta > 0 ? '+' : ''}{ext.ddDelta}
                    </span>
                  </div>

                  {/* ADR */}
                  <div className="text-center">
                    <span className="text-[#64748B] text-sm font-mono">{ext.adr}</span>
                  </div>

                  {/* KAST */}
                  <div className="text-center">
                    <span className="text-[#64748B] text-sm font-mono">{ext.kast}%</span>
                  </div>

                  {/* FK */}
                  <div className="text-center">
                    <span className="text-[#64748B] text-sm font-mono">{ext.firstKills}</span>
                  </div>

                  {/* FD */}
                  <div className="text-center">
                    <span className="text-[#64748B] text-sm font-mono">{ext.firstDeaths}</span>
                  </div>

                  {/* MK */}
                  <div className="text-center">
                    <span className="text-[#64748B] text-sm font-mono">{ext.multiKills}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MatchDetail({ matchId, highlightName, highlightTag }: MatchDetailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('scoreboard');

  const fetchMatch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/match/${encodeURIComponent(matchId)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'マッチデータの取得に失敗しました');
      }
      const json = await res.json();
      setMatch(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // Compute extended stats for all players
  const extendedStats = useMemo(() => {
    if (!match || !match.rounds || !match.kills) return new Map<string, ExtendedPlayerStats>();
    const map = new Map<string, ExtendedPlayerStats>();
    const totalRounds = match.rounds.length;
    for (const player of match.players) {
      map.set(player.puuid, computeExtendedStats(player, match.rounds, match.kills, totalRounds));
    }
    return map;
  }, [match]);

  if (loading) {
    return <LoadingSpinner message="マッチデータを取得中..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchMatch} />;
  }

  if (!match) {
    return <ErrorMessage message="マッチデータが見つかりません" />;
  }

  const { metadata, players, teams, rounds, kills } = match;
  const totalRounds = teams.reduce((sum, t) => sum + t.rounds.won, 0);
  const hasRoundsData = rounds && rounds.length > 0;
  const hasKillsData = kills && kills.length > 0;

  // Split players by team
  const team1 = teams[0];
  const team2 = teams[1];
  const team1Players = players.filter((p) => p.team_id === team1?.team_id);
  const team2Players = players.filter((p) => p.team_id === team2?.team_id);

  // Determine which team the highlighted player belongs to (for ordering)
  let myTeam = team1;
  let enemyTeam = team2;
  let myTeamPlayers = team1Players;
  let enemyTeamPlayers = team2Players;

  if (highlightName && highlightTag) {
    const highlightedPlayer = players.find(
      (p) =>
        p.name?.toLowerCase() === highlightName.toLowerCase() &&
        p.tag?.toLowerCase() === highlightTag.toLowerCase()
    );
    if (highlightedPlayer && highlightedPlayer.team_id === team2?.team_id) {
      myTeam = team2;
      enemyTeam = team1;
      myTeamPlayers = team2Players;
      enemyTeamPlayers = team1Players;
    }
  }

  const modeName = translateMode(metadata.queue?.name || '');
  const mapName = metadata.map?.name || '不明';
  const dateStr = formatDateTime(metadata.started_at);
  const duration = formatDuration(metadata.game_length_in_ms);
  const avgRank = computeAverageRank(players);
  const avgRankJa = avgRank ? translateRankTier(avgRank) : null;

  const tabs: { key: TabType; label: string; disabled: boolean }[] = [
    { key: 'scoreboard', label: 'スコアボード', disabled: false },
    { key: 'performance', label: 'Performance', disabled: !hasRoundsData },
    { key: 'economy', label: 'Economy', disabled: !hasRoundsData },
    { key: 'duels', label: 'Duels', disabled: !hasKillsData },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Match Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="w-full h-0.5 bg-[#0D9488]" />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-[#0F172A] text-lg sm:text-xl font-bold">{mapName}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[#64748B] text-sm">{modeName}</span>
                <span className="text-[#E2E8F0]">|</span>
                <span className="text-[#64748B] text-sm font-mono">{duration}</span>
                {avgRankJa && (
                  <>
                    <span className="text-[#E2E8F0]">|</span>
                    <span className="text-[#64748B] text-sm">平均ランク: {avgRankJa}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <div className="flex items-center gap-3">
                <span className={`text-2xl sm:text-3xl font-mono font-black ${myTeam?.won ? 'text-[#10B981]' : 'text-[#E11D48]'}`}>
                  {myTeam?.rounds?.won ?? 0}
                </span>
                <span className="text-[#64748B] text-lg sm:text-xl">-</span>
                <span className={`text-2xl sm:text-3xl font-mono font-black ${enemyTeam?.won ? 'text-[#10B981]' : 'text-[#E11D48]'}`}>
                  {enemyTeam?.rounds?.won ?? 0}
                </span>
              </div>
              <span className="text-[#94A3B8] text-xs mt-1">{dateStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Round Timeline */}
      {hasRoundsData && (
        <RoundTimeline
          rounds={rounds}
          myTeamId={myTeam?.team_id || 'Blue'}
          enemyTeamId={enemyTeam?.team_id || 'Red'}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#E2E8F0] overflow-x-auto shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && setActiveTab(tab.key)}
            disabled={tab.disabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#0D9488] text-white'
                : tab.disabled
                ? 'text-[#94A3B8] cursor-not-allowed'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'scoreboard' && (
        <>
          {myTeam && (
            <TeamTable
              players={myTeamPlayers}
              team={myTeam}
              totalRounds={totalRounds}
              isWinningTeam={myTeam.won}
              highlightName={highlightName}
              highlightTag={highlightTag}
              extendedStats={extendedStats}
              hasRoundsData={hasRoundsData}
            />
          )}
          {enemyTeam && (
            <TeamTable
              players={enemyTeamPlayers}
              team={enemyTeam}
              totalRounds={totalRounds}
              isWinningTeam={enemyTeam.won}
              highlightName={highlightName}
              highlightTag={highlightTag}
              extendedStats={extendedStats}
              hasRoundsData={hasRoundsData}
            />
          )}
        </>
      )}

      {activeTab === 'performance' && hasRoundsData && (
        <PerformanceTab
          rounds={rounds}
          kills={kills}
          players={players}
          myTeamId={myTeam?.team_id || 'Blue'}
          enemyTeamId={enemyTeam?.team_id || 'Red'}
          totalRounds={totalRounds}
        />
      )}

      {activeTab === 'economy' && hasRoundsData && (
        <EconomyTab
          rounds={rounds}
          myTeamId={myTeam?.team_id || 'Blue'}
          enemyTeamId={enemyTeam?.team_id || 'Red'}
        />
      )}

      {activeTab === 'duels' && hasKillsData && (
        <DuelsTab
          kills={kills}
          players={players}
          myTeamId={myTeam?.team_id || 'Blue'}
          enemyTeamId={enemyTeam?.team_id || 'Red'}
        />
      )}
    </div>
  );
}
