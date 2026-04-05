import { Suspense } from 'react';
import PlayerContent from '@/components/PlayerContent';
import LoadingSpinner from '@/components/LoadingSpinner';

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ name: string; tag: string }>;
}) {
  const { name, tag } = await params;
  const decodedName = decodeURIComponent(name);
  const decodedTag = decodeURIComponent(tag);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Suspense fallback={<LoadingSpinner message="プレイヤーデータを取得中..." />}>
        <PlayerContent name={decodedName} tag={decodedTag} />
      </Suspense>
    </div>
  );
}
