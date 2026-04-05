'use client';

interface PlaylistFilterProps {
  current: string;
  onChange: (playlist: string) => void;
  loading?: boolean;
}

const PLAYLISTS = [
  { id: '', label: '全モード' },
  { id: 'competitive', label: 'コンペティティブ' },
  { id: 'unrated', label: 'アンレート' },
  { id: 'teamdeathmatch', label: 'チームデスマッチ' },
] as const;

export default function PlaylistFilter({ current, onChange, loading }: PlaylistFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLAYLISTS.map((playlist) => {
        const isActive = current === playlist.id;
        return (
          <button
            key={playlist.id}
            onClick={() => onChange(playlist.id)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
              isActive
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-border text-muted-foreground hover:border-indigo-300 hover:text-indigo-600'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {playlist.label}
          </button>
        );
      })}
    </div>
  );
}
