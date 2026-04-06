'use client';

// Weapon category mapping
const WEAPON_CATEGORIES: Record<string, string> = {
  // Sidearms
  'Classic': 'サイドアーム',
  'Shorty': 'サイドアーム',
  'Frenzy': 'サイドアーム',
  'Ghost': 'サイドアーム',
  'Sheriff': 'サイドアーム',
  // SMGs
  'Stinger': 'SMG',
  'Spectre': 'SMG',
  // Shotguns
  'Bucky': 'ショットガン',
  'Judge': 'ショットガン',
  // Rifles
  'Bulldog': 'ライフル',
  'Guardian': 'ライフル',
  'Phantom': 'ライフル',
  'Vandal': 'ライフル',
  // Snipers
  'Marshal': 'スナイパー',
  'Outlaw': 'スナイパー',
  'Operator': 'スナイパー',
  // Machine Guns
  'Ares': 'マシンガン',
  'Odin': 'マシンガン',
  // Melee
  'Melee': '近接',
  // Other
  'Bandit': 'ライフル',
};

interface WeaponStat {
  weaponName: string;
  category: string;
  kills: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
}

interface WeaponStatsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[];
  puuid: string;
}

function aggregateWeaponStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[],
  puuid: string
): WeaponStat[] {
  const weaponMap = new Map<string, WeaponStat>();

  // Track per-round weapon usage for H/B/L attribution
  for (const match of matches) {
    const kills = match.kills;
    const rounds = match.rounds;

    // Count kills per weapon from kills array
    if (kills && Array.isArray(kills)) {
      for (const kill of kills) {
        if (kill.killer?.puuid !== puuid) continue;
        const weaponName = kill.weapon?.name;
        if (!weaponName) continue;
        if (kill.weapon?.type !== 'Weapon') continue; // skip ability kills

        const existing = weaponMap.get(weaponName) || {
          weaponName,
          category: WEAPON_CATEGORIES[weaponName] || 'その他',
          kills: 0,
          headshots: 0,
          bodyshots: 0,
          legshots: 0,
        };
        existing.kills += 1;
        weaponMap.set(weaponName, existing);
      }
    }

    // Attribute H/B/L from rounds data based on equipped weapon
    if (rounds && Array.isArray(rounds)) {
      for (const round of rounds) {
        if (!round.stats || !Array.isArray(round.stats)) continue;
        for (const stat of round.stats) {
          if (stat.player?.puuid !== puuid) continue;
          const weaponName = stat.economy?.weapon?.name;
          if (!weaponName) continue;

          const existing = weaponMap.get(weaponName);
          if (!existing) continue; // Only add H/B/L for weapons we have kill data for

          existing.headshots += stat.stats?.headshots || 0;
          existing.bodyshots += stat.stats?.bodyshots || 0;
          existing.legshots += stat.stats?.legshots || 0;
        }
      }
    }
  }

  // Sort by kills descending, take top 5
  return Array.from(weaponMap.values())
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 5);
}

export default function WeaponStats({ matches, puuid }: WeaponStatsProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  const weapons = aggregateWeaponStats(matches, puuid);

  if (weapons.length === 0) {
    return null;
  }

  const maxKills = weapons[0]?.kills || 1;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] transition-shadow duration-200 overflow-hidden">
      <div className="w-full h-0.5 bg-[#334155]" />
      <div className="p-4 sm:p-6">
        <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-4">
          武器統計
        </h2>

        <div className="flex flex-col gap-3">
          {weapons.map((weapon) => {
            const totalShots = weapon.headshots + weapon.bodyshots + weapon.legshots;
            const headPct = totalShots > 0 ? (weapon.headshots / totalShots) * 100 : 0;
            const bodyPct = totalShots > 0 ? (weapon.bodyshots / totalShots) * 100 : 0;
            const legPct = totalShots > 0 ? (weapon.legshots / totalShots) * 100 : 0;
            const killBarWidth = (weapon.kills / maxKills) * 100;

            return (
              <div
                key={weapon.weaponName}
                className="bg-white rounded-xl p-3 sm:p-4 border border-[#E2E8F0]"
              >
                {/* Header: name, category, kills */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0F172A] text-sm font-semibold">{weapon.weaponName}</span>
                    <span className="text-[#64748B] text-xs px-1.5 py-0.5 rounded-md bg-white border border-[#E2E8F0]">
                      {weapon.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#0F172A] text-lg font-mono font-bold">{weapon.kills}</span>
                    <span className="text-[#64748B] text-xs">キル</span>
                  </div>
                </div>

                {/* Kill bar */}
                <div className="w-full h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-[#0D9488] transition-all"
                    style={{ width: `${killBarWidth}%` }}
                  />
                </div>

                {/* H/B/L breakdown */}
                {totalShots > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    {/* Stacked bar */}
                    <div className="flex-1 h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden flex">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${headPct}%`,
                          backgroundColor: '#D97706',
                        }}
                      />
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${bodyPct}%`,
                          backgroundColor: 'rgba(15,23,42,0.8)',
                        }}
                      />
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${legPct}%`,
                          backgroundColor: 'rgba(148,163,184,0.5)',
                        }}
                      />
                    </div>

                    {/* Labels */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#D97706] font-mono font-medium">
                        H {headPct.toFixed(0)}%
                      </span>
                      <span className="text-[#0F172A] font-mono font-medium">
                        B {bodyPct.toFixed(0)}%
                      </span>
                      <span className="text-[#94A3B8] font-mono font-medium">
                        L {legPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
