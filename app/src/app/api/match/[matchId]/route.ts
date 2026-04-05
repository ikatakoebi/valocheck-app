import { NextRequest } from 'next/server';
import { getMatch, ApiError } from '@/lib/valorant-api';

// v2 response types
interface V2Player {
  puuid: string;
  name: string;
  tag: string;
  team: string;
  level: number;
  character: string;
  currenttier: number;
  currenttier_patched: string;
  stats: {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
  };
  damage_made: number;
  damage_received: number;
  ability_casts: Record<string, number>;
}

interface V2Team {
  has_won: boolean;
  rounds_won: number;
  rounds_lost: number;
}

interface V2RoundPlayerStat {
  player_puuid: string;
  player_display_name: string;
  player_team: string;
  kills: number;
  score: number;
  damage: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  economy: {
    loadout_value: number;
    remaining: number;
    spent: number;
    weapon: {
      id: string;
      name: string;
    } | null;
    armor: {
      id: string;
      name: string;
    } | null;
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
  kill_events: Array<{
    kill_time_in_round: number;
    kill_time_in_match: number;
    killer_puuid: string;
    killer_display_name: string;
    killer_team: string;
    victim_puuid: string;
    victim_display_name: string;
    victim_team: string;
    damage_weapon_id: string;
    damage_weapon_name: string;
    assistants: Array<{
      assistant_puuid: string;
      assistant_display_name: string;
      assistant_team: string;
    }>;
  }>;
  was_afk: boolean;
  was_penalized: boolean;
  stayed_in_spawn: boolean;
}

interface V2Round {
  winning_team: string;
  end_type: string;
  bomb_planted: boolean;
  bomb_defused: boolean;
  player_stats: V2RoundPlayerStat[];
}

interface V2Kill {
  kill_time_in_round: number;
  kill_time_in_match: number;
  round: number;
  killer_puuid: string;
  killer_display_name: string;
  killer_team: string;
  victim_puuid: string;
  victim_display_name: string;
  victim_team: string;
  damage_weapon_id: string;
  damage_weapon_name: string;
  assistants: Array<{
    assistant_puuid: string;
    assistant_display_name: string;
    assistant_team: string;
  }>;
}

interface V2MatchData {
  metadata: {
    matchid: string;
    map: string;
    game_version: string;
    game_length: number;
    game_start: number;
    game_start_patched: string;
    rounds_played: number;
    mode: string;
    mode_id: string;
    queue: string;
    platform: string;
    region: string;
  };
  players: {
    all_players: V2Player[];
    red: V2Player[];
    blue: V2Player[];
  };
  teams: {
    red: V2Team;
    blue: V2Team;
  };
  rounds: V2Round[];
  kills: V2Kill[];
}

// Agent name to UUID mapping for icon display
const AGENT_UUID_MAP: Record<string, string> = {
  'Astra': '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
  'Breach': '5f8d3a7f-467b-97f3-062c-13acf203c006',
  'Brimstone': '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  'Chamber': '22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
  'Clove': '1dbf2edd-4729-0984-3115-daa5eed44993',
  'Cypher': '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
  'Deadlock': 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
  'Fade': 'dade69b4-4f5a-8528-247b-219e5a1facd6',
  'Gekko': 'e370fa57-4757-3604-3648-499e1f642d3f',
  'Harbor': '95b78ed7-4637-86d9-7e41-71ba8c293152',
  'Iso': '0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
  'Jett': 'add6443a-41bd-e414-f6ad-e58d267f4e95',
  'KAY/O': '601dbbe7-43ce-be57-2a40-4abd24953621',
  'Killjoy': '1e58de9c-4950-5125-93e9-a0aee9f98746',
  'Miks': '7c8a4701-4de6-9355-b254-e09bc2a34b72',
  'Neon': 'bb2a4828-46eb-8cd1-e765-15848195d751',
  'Omen': '8e253930-4c05-31dd-1b6c-968525494517',
  'Phoenix': 'eb93336a-449b-9c1b-0a54-a891f7921d69',
  'Raze': 'f94c3b30-42be-e959-889c-5aa313dba261',
  'Reyna': 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
  'Sage': '569fdd95-4d10-43ab-ca70-79becc718b46',
  'Skye': '6f2a04ca-43e0-be17-7f36-b3908627744d',
  'Sova': '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  'Tejo': 'b444168c-4e35-8076-db47-ef9bf368f384',
  'Veto': '92eeef5d-43b5-1d4a-8d03-b3927a09034b',
  'Viper': '707eab51-4836-f488-046a-cda6bf494859',
  'Vyse': 'efba5359-4016-a1e5-7626-b1ae76895940',
  'Waylay': 'df1cb487-4902-002e-5c17-d28e83e78588',
  'Yoru': '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
};

// Transform v2 response to the format MatchDetail.tsx expects
function transformV2ToMatchData(v2Data: V2MatchData) {
  const metadata = {
    match_id: v2Data.metadata.matchid,
    map: {
      id: '',
      name: v2Data.metadata.map,
    },
    game_length_in_ms: v2Data.metadata.game_length * 1000,
    started_at: v2Data.metadata.game_start_patched,
    queue: {
      id: v2Data.metadata.mode_id,
      name: v2Data.metadata.mode,
      mode_type: v2Data.metadata.queue,
    },
    region: v2Data.metadata.region,
  };

  const players = v2Data.players.all_players.map((p) => ({
    puuid: p.puuid,
    name: p.name,
    tag: p.tag,
    team_id: p.team,
    agent: {
      id: AGENT_UUID_MAP[p.character] || '',
      name: p.character,
    },
    stats: {
      score: p.stats.score,
      kills: p.stats.kills,
      deaths: p.stats.deaths,
      assists: p.stats.assists,
      headshots: p.stats.headshots,
      bodyshots: p.stats.bodyshots,
      legshots: p.stats.legshots,
      damage: {
        dealt: p.damage_made,
        received: p.damage_received,
      },
    },
    tier: {
      id: p.currenttier,
      name: p.currenttier_patched || '',
    },
    account_level: p.level,
    ability_casts: p.ability_casts || {},
  }));

  const teams = [
    {
      team_id: 'Blue',
      rounds: {
        won: v2Data.teams.blue.rounds_won,
        lost: v2Data.teams.blue.rounds_lost,
      },
      won: v2Data.teams.blue.has_won,
    },
    {
      team_id: 'Red',
      rounds: {
        won: v2Data.teams.red.rounds_won,
        lost: v2Data.teams.red.rounds_lost,
      },
      won: v2Data.teams.red.has_won,
    },
  ];

  // Transform rounds data
  const rounds = (v2Data.rounds || []).map((r, index) => ({
    id: index,
    winning_team: r.winning_team,
    end_type: r.end_type,
    bomb_planted: r.bomb_planted,
    bomb_defused: r.bomb_defused,
    stats: r.player_stats.map((ps) => ({
      player: {
        puuid: ps.player_puuid,
        name: ps.player_display_name.split('#')[0] || ps.player_display_name,
        tag: ps.player_display_name.split('#')[1] || '',
        team: ps.player_team,
      },
      stats: {
        score: ps.score,
        kills: ps.kills,
        headshots: ps.headshots,
        bodyshots: ps.bodyshots,
        legshots: ps.legshots,
        damage: ps.damage,
      },
      economy: {
        loadout_value: ps.economy.loadout_value,
        remaining: ps.economy.remaining,
        spent: ps.economy.spent,
        weapon: ps.economy.weapon ? {
          id: ps.economy.weapon.id,
          name: ps.economy.weapon.name,
        } : null,
        armor: ps.economy.armor ? {
          id: ps.economy.armor.id,
          name: ps.economy.armor.name,
        } : null,
      },
      ability_casts: ps.ability_casts,
      damage_events: ps.damage_events || [],
    })),
  }));

  // Transform kills data
  const kills = (v2Data.kills || []).map((k) => ({
    time_in_round_in_ms: k.kill_time_in_round,
    time_in_match_in_ms: k.kill_time_in_match,
    round: k.round,
    killer: {
      puuid: k.killer_puuid,
      name: k.killer_display_name.split('#')[0] || k.killer_display_name,
      tag: k.killer_display_name.split('#')[1] || '',
      team: k.killer_team,
    },
    victim: {
      puuid: k.victim_puuid,
      name: k.victim_display_name.split('#')[0] || k.victim_display_name,
      tag: k.victim_display_name.split('#')[1] || '',
      team: k.victim_team,
    },
    assistants: (k.assistants || []).map((a) => ({
      puuid: a.assistant_puuid,
      name: a.assistant_display_name.split('#')[0] || a.assistant_display_name,
      tag: a.assistant_display_name.split('#')[1] || '',
      team: a.assistant_team,
    })),
    damage_weapon_id: k.damage_weapon_id,
    damage_weapon_name: k.damage_weapon_name,
  }));

  return { metadata, players, teams, rounds, kills };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const response = await getMatch(matchId);
    const transformed = transformV2ToMatchData(response.data as unknown as V2MatchData);
    return Response.json({ status: response.status, data: transformed });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return Response.json(
      { error: 'ネットワークエラーが発生しました。接続を確認してください。' },
      { status: 500 }
    );
  }
}
