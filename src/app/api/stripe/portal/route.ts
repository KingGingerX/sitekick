import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { assertString } from '@/lib/validate';
import { apiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerId = assertString(body.customerId, 'customerId');
    const returnUrl = assertString(body.returnUrl, 'returnUrl');

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return apiError(err);
  }
}
