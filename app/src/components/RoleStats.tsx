'use client';

// Agent to Role mapping
const AGENT_ROLES: Record<string, string> = {
  // Duelist
  'Jett': 'Duelist',
  'Phoenix': 'Duelist',
  'Reyna': 'Duelist',
  'Raze': 'Duelist',
  'Yoru': 'Duelist',
  'Neon': 'Duelist',
  'Iso': 'Duelist',
  'Waylay': 'Duelist',
  // Controller
  'Brimstone': 'Controller',
  'Viper': 'Controller',
  'Omen': 'Controller',
  'Astra': 'Controller',
  'Harbor': 'Controller',
  'Clove': 'Controller',
  // Initiator
  'Sova': 'Initiator',
  'Breach': 'Initiator',
  'Skye': 'Initiator',
  'KAY/O': 'Initiator',
  'Fade': 'Initiator',
  'Gekko': 'Initiator',
  'Tejo': 'Initiator',
  // Sentinel
  'Sage': 'Sentinel',
  'Cypher': 'Sentinel',
  'Killjoy': 'Sentinel',
  'Chamber': 'Sentinel',
  'Deadlock': 'Sentinel',
  'Vyse': 'Sentinel',
  'Miks': 'Sentinel',
};

const ROLE_ORDER = ['Duelist', 'Controller', 'Initiator', 'Sentinel'];

const ROLE_JAPANESE: Record<string, string> = {
  'Duelist': 'デュエリスト',
  'Controller': 'コントローラー',
  'Initiator': 'イニシエーター',
  'Sentinel': 'センチネル',
};

const ROLE_ICONS: Record<string, string> = {
  'Duelist': '⚔',
  'Controller': '☁',
  'Initiator': '◎',
  'Sentinel': '🛡',
};

interface RoleStat {
  role: string;
  gamesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface RoleStatsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[];
  puuid: string;
  playerName: string;
  playerTag: string;
}

function aggregateRoleStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[],
  puuid: string,
  playerName: string,
  playerTag: string
): Map<string, RoleStat> {
  const roleMap = new Map<string, RoleStat>();

  // Initialize all roles
  for (const role of ROLE_ORDER) {
    roleMap.set(role, {
      role,
      gamesPlayed: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    });
  }

  for (const match of matches) {
    const player = match.players?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) =>
        p.puuid === puuid ||
        (p.name?.toLowerCase() === playerName.toLowerCase() &&
          p.tag?.toLowerCase() === playerTag.toLowerCase())
    );
    if (!player || !player.agent?.name) continue;

    const agentName = player.agent.name;
    const role = AGENT_ROLES[agentName];
    if (!role) continue;

    const existing = roleMap.get(role)!;
    existing.gamesPlayed += 1;

    const playerTeam = match.teams?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.team_id === player.team_id
    );
    if (playerTeam?.won) {
      existing.wins += 1;
    }

    existing.kills += player.stats?.kills || 0;
    existing.deaths += player.stats?.deaths || 0;
    existing.assists += player.stats?.assists || 0;
  }

  return roleMap;
}

export default function RoleStats({ matches, puuid, playerName, playerTag }: RoleStatsProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  const roleMap = aggregateRoleStats(matches, puuid, playerName, playerTag);
  const roles = ROLE_ORDER.map((role) => roleMap.get(role)!).filter((r) => r.gamesPlayed > 0);

  if (roles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-4">
        ロール別統計
      </h2>

      <div className="flex flex-col gap-3">
        {roles.map((roleStat) => {
          const winRate = roleStat.gamesPlayed > 0
            ? Math.round((roleStat.wins / roleStat.gamesPlayed) * 100)
            : 0;
          const losses = roleStat.gamesPlayed - roleStat.wins;
          const kda = roleStat.deaths > 0
            ? ((roleStat.kills + roleStat.assists) / roleStat.deaths)
            : (roleStat.kills + roleStat.assists);
          const avgKills = (roleStat.kills / roleStat.gamesPlayed).toFixed(1);
          const avgDeaths = (roleStat.deaths / roleStat.gamesPlayed).toFixed(1);
          const avgAssists = (roleStat.assists / roleStat.gamesPlayed).toFixed(1);

          return (
            <div
              key={roleStat.role}
              className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ROLE_ICONS[roleStat.role]}</span>
                  <div>
                    <span className="text-foreground text-sm font-semibold">
                      {ROLE_JAPANESE[roleStat.role]}
                    </span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {roleStat.gamesPlayed}試合
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-muted-foreground text-xs block">KDA</span>
                    <span className="text-foreground text-sm font-semibold">{kda.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      winRate >= 50 ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {winRate}%
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {roleStat.wins}W - {losses}L
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-emerald-600">{avgKills}</span>
                  <span className="text-muted-foreground/50"> / </span>
                  <span className="text-rose-500">{avgDeaths}</span>
                  <span className="text-muted-foreground/50"> / </span>
                  <span className="text-slate-600">{avgAssists}</span>
                </div>
              </div>

              {/* Win rate bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-400'
                  }`}
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
