import { DEFAULT_REGION, DEFAULT_PLATFORM } from './constants';

const API_BASE = process.env.VALORANT_API_BASE || 'https://api.henrikdev.xyz';
const API_KEY = process.env.VALORANT_API_KEY || '';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

async function apiFetch<T>(path: string, skipCache = false): Promise<T> {
  const cacheKey = path;
  if (!skipCache) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Authorization': API_KEY,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('ネットワークエラーが発生しました。接続を確認してください。', 0);
  }

  if (!res.ok) {
    // Try to parse error body for better message
    let errorMessage = '';
    try {
      const errorJson = await res.json();
      if (errorJson.errors && Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
        const code = errorJson.errors[0].code;
        if (code === 22) {
          errorMessage = 'プレイヤーが見つかりません';
        } else if (code === 23 || code === 24) {
          errorMessage = 'プレイヤーが見つかりません';
        }
      }
    } catch {
      // ignore parse errors
    }

    if (res.status === 404) {
      throw new ApiError(errorMessage || 'プレイヤーが見つかりません', 404);
    }

    if (res.status === 429) {
      throw new ApiError('しばらく待ってから再試行してください', 429);
    }

    throw new ApiError(errorMessage || `APIエラーが発生しました (${res.status})`, res.status);
  }

  const json = await res.json();

  // Some successful responses may still contain errors field
  if (json.errors && Array.isArray(json.errors) && json.errors.length > 0) {
    throw new ApiError('プレイヤーが見つかりません', 404);
  }

  setCache(cacheKey, json);
  return json as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export interface AccountData {
  puuid: string;
  region: string;
  account_level: number;
  name: string;
  tag: string;
  card: {
    small: string;
    large: string;
    wide: string;
    id: string;
  };
}

export interface AccountResponse {
  status: number;
  data: AccountData;
}

export async function getAccount(name: string, tag: string): Promise<AccountResponse> {
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  return apiFetch<AccountResponse>(`/valorant/v2/account/${encodedName}/${encodedTag}`);
}

export interface SeasonalData {
  season: {
    short: string;
    id: string;
  };
  wins: number;
  games: number;
  end_tier: {
    id: number;
    name: string;
  };
}

export interface MmrData {
  current: {
    tier: {
      id: number;
      name: string;
    };
    rr: number;
    last_change: number;
    elo: number;
  } | null;
  highest: {
    tier: {
      id: number;
      name: string;
    };
    rr: number;
    season: string;
  } | null;
  peak: {
    tier: {
      id: number;
      name: string;
    };
    rr: number;
    season: {
      short: string;
      id: string;
    };
  } | null;
  seasonal?: SeasonalData[];
}

export interface MmrResponse {
  status: number;
  data: MmrData;
}

export async function getMmr(
  name: string,
  tag: string,
  region: string = DEFAULT_REGION,
  platform: string = DEFAULT_PLATFORM
): Promise<MmrResponse> {
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  return apiFetch<MmrResponse>(
    `/valorant/v3/mmr/${region}/${platform}/${encodedName}/${encodedTag}`
  );
}

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
  ability_casts: Record<string, number>;
}

export interface MatchTeam {
  team_id: string;
  rounds: {
    won: number;
    lost: number;
  };
  won: boolean;
}

export interface MatchData {
  metadata: {
    match_id: string;
    map: {
      id: string;
      name: string;
    };
    game_version: string;
    game_length_in_ms: number;
    started_at: string;
    season: {
      id: string;
      short: string;
    };
    platform: string;
    queue: {
      id: string;
      name: string;
      mode_type: string;
    };
    region: string;
  };
  players: MatchPlayer[];
  teams: MatchTeam[];
}

export interface MatchesResponse {
  status: number;
  data: MatchData[];
}

export async function getMatches(
  name: string,
  tag: string,
  region: string = DEFAULT_REGION,
  platform: string = DEFAULT_PLATFORM,
  size: number = 10,
  mode?: string,
  start?: number,
  season?: string
): Promise<MatchesResponse> {
  const encodedName = encodeURIComponent(name);
  const encodedTag = encodeURIComponent(tag);
  let url = `/valorant/v4/matches/${region}/${platform}/${encodedName}/${encodedTag}?size=${size}`;
  if (start && start > 0) {
    url += `&start=${start}`;
  }
  if (mode) {
    url += `&mode=${encodeURIComponent(mode)}`;
  }
  if (season) {
    url += `&season=${encodeURIComponent(season)}`;
  }
  return apiFetch<MatchesResponse>(url);
}

// v2 match endpoint returns a different structure than v4 matches endpoint.
// The route handler transforms this into the MatchData format.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SingleMatchResponse {
  status: number;
  data: Record<string, unknown>;
}

export async function getMatch(
  matchId: string
): Promise<SingleMatchResponse> {
  return apiFetch<SingleMatchResponse>(
    `/valorant/v2/match/${matchId}`
  );
}
