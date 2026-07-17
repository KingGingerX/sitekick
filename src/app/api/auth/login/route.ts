import { NextResponse } from 'next/server';
import { signSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || adminPassword.length < 8) {
      logger.error('ADMIN_PASSWORD not configured or too short');
      return NextResponse.json(
        { error: 'Server authentication not configured' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      logger.warn('Failed login attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await signSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set('sk_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    logger.info('Admin login successful');
    return res;
  } catch (err) {
    logger.error('Login route error', { error: String(err) });
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
