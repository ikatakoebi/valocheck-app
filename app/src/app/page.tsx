import SearchForm from '@/components/SearchForm';
import SearchHistory from '@/components/SearchHistory';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            <span className="text-indigo-600">VALO</span>
            <span className="text-slate-800">CHECK</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Valorant戦績トラッカー
          </p>
        </div>

        {/* Search Form */}
        <SearchForm />

        {/* Hint */}
        <p className="text-muted-foreground/70 text-xs text-center">
          Riot IDを入力して戦績を検索（例: Player#JP1）
        </p>

        {/* Search History */}
        <SearchHistory />
      </div>
    </div>
  );
}
