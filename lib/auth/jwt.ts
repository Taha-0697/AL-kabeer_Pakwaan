import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  permissions: string[];  // embedded at login so middleware needs no DB call
}

const secretKey = new TextEncoder().encode(config.jwt.secret);

export async function signJWT(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwt.expiresIn)
    .sign(secretKey);
}

export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, secretKey);
    return verified.payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
