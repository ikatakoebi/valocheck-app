'use client';

interface MapStatEntry {
  mapName: string;
  gamesPlayed: number;
  wins: number;
}

interface MapStatsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[];
  puuid: string;
  playerName: string;
  playerTag: string;
}

export default function MapStats({ matches, puuid, playerName, playerTag }: MapStatsProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  // Aggregate stats per map
  const mapStatsMap = new Map<string, MapStatEntry>();

  for (const match of matches) {
    const mapName = match.metadata?.map?.name;
    if (!mapName) continue;

    // Find this player in the match
    const player = match.players?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) =>
        p.puuid === puuid ||
        (p.name?.toLowerCase() === playerName.toLowerCase() &&
          p.tag?.toLowerCase() === playerTag.toLowerCase())
    );

    if (!player) continue;

    const existing = mapStatsMap.get(mapName) || {
      mapName,
      gamesPlayed: 0,
      wins: 0,
    };

    existing.gamesPlayed += 1;

    // Determine win
    const playerTeam = match.teams?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.team_id === player.team_id
    );
    if (playerTeam?.won) {
      existing.wins += 1;
    }

    mapStatsMap.set(mapName, existing);
  }

  // Sort by games played (descending)
  const sortedMaps = Array.from(mapStatsMap.values()).sort(
    (a, b) => b.gamesPlayed - a.gamesPlayed
  );

  if (sortedMaps.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-foreground text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">
        マップ統計
      </h2>
      <div className="flex flex-col gap-3">
        {sortedMaps.map((mapStat) => {
          const winRate = mapStat.gamesPlayed > 0
            ? Math.round((mapStat.wins / mapStat.gamesPlayed) * 100)
            : 0;

          return (
            <div key={mapStat.mapName} className="px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
              {/* Map info row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-foreground text-sm font-medium">{mapStat.mapName}</span>
                  <span className="text-muted-foreground/70 text-xs">{mapStat.gamesPlayed}試合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {mapStat.wins}勝 {mapStat.gamesPlayed - mapStat.wins}敗
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      winRate >= 50 ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {winRate}%
                  </span>
                </div>
              </div>

              {/* Win rate bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
