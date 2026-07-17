import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export async function GET() {
  try {
    const client = getClient();
    await client.execute('SELECT 1');
    return NextResponse.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: String(err) },
      { status: 503 }
    );
  }
}
