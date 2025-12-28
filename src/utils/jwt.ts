import { SignJWT, jwtVerify,JWTPayload} from "jose";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createToken(payload: JWTPayload, expiresIn = "1h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey);
  return payload;
}
