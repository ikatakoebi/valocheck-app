import { NextRequest } from 'next/server';
import { getMmr, ApiError } from '@/lib/valorant-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; tag: string }> }
) {
  const { name, tag } = await params;
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get('region') || 'ap';
  const platform = searchParams.get('platform') || 'pc';

  try {
    const data = await getMmr(name, tag, region, platform);
    // seasonal data is included in the MMR v3 response
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
