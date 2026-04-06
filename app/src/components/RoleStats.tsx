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
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] transition-shadow duration-200 overflow-hidden">
      <div className="w-full h-0.5 bg-[#0F172A]" />
      <div className="p-4 sm:p-6">
        <h2 className="text-[#0F172A] text-sm font-semibold uppercase tracking-wider mb-4">
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
            const isDuelist = roleStat.role === 'Duelist';

            return (
              <div
                key={roleStat.role}
                className="bg-white rounded-xl p-3 sm:p-4 border border-[#E2E8F0]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ROLE_ICONS[roleStat.role]}</span>
                    <div>
                      <span className="text-[#0F172A] text-sm font-semibold">
                        {ROLE_JAPANESE[roleStat.role]}
                      </span>
                      <span className="text-[#64748B] text-xs ml-2 font-mono">
                        {roleStat.gamesPlayed}試合
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[#64748B] text-xs block">KDA</span>
                      <span className="text-[#0F172A] text-sm font-mono font-semibold">{kda.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-mono font-bold ${
                        winRate >= 50 ? 'text-[#059669]' : 'text-[#E11D48]'
                      }`}
                    >
                      {winRate}%
                    </span>
                    <span className="text-[#64748B] text-xs font-mono">
                      {roleStat.wins}W - {losses}L
                    </span>
                  </div>
                  <div className="text-sm font-mono">
                    <span className="text-[#10B981]">{avgKills}</span>
                    <span className="text-[#94A3B8]"> / </span>
                    <span className="text-[#E11D48]">{avgDeaths}</span>
                    <span className="text-[#94A3B8]"> / </span>
                    <span className="text-[#64748B]">{avgAssists}</span>
                  </div>
                </div>

                {/* Win rate bar */}
                <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${isDuelist ? 'bg-[#0F172A]' : 'bg-[#334155]'}`}
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
