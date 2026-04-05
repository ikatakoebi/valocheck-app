import { NextRequest } from 'next/server';
import { getMatches, ApiError } from '@/lib/valorant-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; tag: string }> }
) {
  const { name, tag } = await params;
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get('region') || 'ap';
  const platform = searchParams.get('platform') || 'pc';

  try {
    const size = parseInt(searchParams.get('size') || '20', 10);
    const mode = searchParams.get('mode') || undefined;
    const startParam = searchParams.get('start');
    const start = startParam ? parseInt(startParam, 10) : undefined;
    const season = searchParams.get('season') || undefined;
    const data = await getMatches(name, tag, region, platform, size, mode, start, season);
    return Response.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return Response.json(
      { error: 'ネットワークエラーが発生しました。接続を確認してください。' },
      { status: 500 }
    );
  }
}
