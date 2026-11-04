import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "microgreen_secure_development_secret_key_2026";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Hash a plain password using secure crypto.scrypt
 */
export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

/**
 * Verify a plain password against a stored salt:hash
 */
export function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = (storedHash || "").split(":");
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, "hex");
      if (derivedKey.length !== keyBuffer.length) {
        return resolve(false);
      }
      const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
      resolve(match);
    });
  });
}

/**
 * Create a signed session token
 */
export function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SECONDS;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(header + "." + body)
    .digest("base64url");

  return header + "." + body + "." + signature;
}

/**
 * Verify and decode a session token
 */
export function verifyToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(header + "." + body)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user payload from incoming request cookies
 */
export function getAuthUser(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (!match) return null;
  return verifyToken(match[1]);
}

/**
 * Require ADMIN role check. Returns true or false.
 */
export function requireAdmin(request) {
  const user = getAuthUser(request);
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return user;
}