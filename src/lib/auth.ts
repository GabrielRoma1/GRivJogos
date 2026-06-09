import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "griv-jogos-secreta-padrao-123456";

// Criptografa a senha usando scrypt
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Verifica se a senha confere
export function verifyPassword(password: string, storedValue: string): boolean {
  try {
    const [salt, key] = storedValue.split(":");
    if (!salt || !key) return false;
    
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch (e) {
    return false;
  }
}

// Assina a sessão usando HMAC-SHA256
export function signSession(payload: any): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

// Valida a assinatura e decodifica a sessão
export function verifySession(token: string): any | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const expectedSignature = createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
    const sigBuffer = Buffer.from(signature, "base64url");
    const expBuffer = Buffer.from(expectedSignature, "base64url");

    if (sigBuffer.length === expBuffer.length && timingSafeEqual(sigBuffer, expBuffer)) {
      const json = Buffer.from(data, "base64url").toString("utf8");
      return JSON.parse(json);
    }
  } catch (e) {
    console.error("Falha ao validar assinatura de sessão:", e);
  }
  return null;
}

// Helper para validar acesso do admin a partir do request
export function getAdminUser(cookiesHeader: string | null): any | null {
  if (!cookiesHeader) return null;
  
  const cookies = cookiesHeader.split(";").reduce((acc: any, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key) acc[key] = value;
    return acc;
  }, {});

  const sessionToken = cookies["admin_session"];
  if (!sessionToken) return null;

  const session = verifySession(sessionToken);
  if (session && session.role === "admin") {
    return session;
  }
  
  return null;
}
