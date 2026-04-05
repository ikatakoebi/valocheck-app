import MatchDetail from '@/components/MatchDetail';

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ name?: string; tag?: string }>;
}) {
  const { matchId } = await params;
  const { name, tag } = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <MatchDetail
        matchId={matchId}
        highlightName={name}
        highlightTag={tag}
      />
    </div>
  );
}
