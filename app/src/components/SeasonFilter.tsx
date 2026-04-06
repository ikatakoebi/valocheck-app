'use client';

interface SeasonOption {
  short: string;
  label: string;
}

interface SeasonFilterProps {
  seasons: SeasonOption[];
  current: string;
  onChange: (season: string) => void;
  loading?: boolean;
}

export function parseSeasonShort(short: string): string {
  // e7a3 → EP7 ACT3, e11a2 → EP11 ACT2
  const match = short.match(/^e(\d+)a(\d+)$/);
  if (!match) return short.toUpperCase();
  return `EP${match[1]} ACT${match[2]}`;
}

export default function SeasonFilter({ seasons, current, onChange, loading }: SeasonFilterProps) {
  if (seasons.length === 0) return null;

  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] ${
          current
            ? 'border-[#0D9488] text-[#0D9488]'
            : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0D9488]/30'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="">全シーズン</option>
        {seasons.map((season) => (
          <option key={season.short} value={season.short}>
            {season.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
