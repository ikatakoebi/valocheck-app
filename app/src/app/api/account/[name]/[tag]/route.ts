import { NextRequest } from 'next/server';
import { getAccount, ApiError } from '@/lib/valorant-api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string; tag: string }> }
) {
  const { name, tag } = await params;

  try {
    const data = await getAccount(name, tag);
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
