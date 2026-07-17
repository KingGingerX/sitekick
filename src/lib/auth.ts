function getKey(): string {
  const secret = process.env.ADMIN_PASSWORD || '';
  if (!secret || secret.length < 8) {
    throw new Error('ADMIN_PASSWORD must be set and at least 8 characters');
  }
  return secret;
}

async function webSign(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function webVerify(key: string, message: string, signatureB64: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, encoder.encode(message));
  } catch {
    return false;
  }
}

export async function signSession(): Promise<string> {
  const key = getKey();
  const payload = JSON.stringify({ admin: true, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  const sig = await webSign(key, payload);
  return `${btoa(payload)}.${sig}`;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const key = getKey();
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return false;

    const payload = atob(b64);
    const valid = await webVerify(key, payload, sig);
    if (!valid) return false;

    const data = JSON.parse(payload) as { admin?: boolean; exp?: number };
    if (data.admin !== true) return false;
    if (data.exp && Date.now() > data.exp) return false;

    return true;
  } catch {
    return false;
  }
}
