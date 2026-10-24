import { randomBytes } from "node:crypto";

export type SupervisorInviteTokenPayload = {
  version: 1;
  nonce: string;
  name: string;
  phone: string;
  propertyId: string;
};

export function createSupervisorInviteToken(input: Omit<SupervisorInviteTokenPayload, "version" | "nonce">) {
  const payload: SupervisorInviteTokenPayload = {
    version: 1,
    nonce: randomBytes(24).toString("base64url"),
    ...input,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeSupervisorInviteToken(token: string): SupervisorInviteTokenPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as Partial<SupervisorInviteTokenPayload>;
    if (payload.version !== 1 || !payload.nonce || !payload.name || !payload.phone || !payload.propertyId) return null;
    if (!/^255\d{9}$/.test(payload.phone)) return null;
    return payload as SupervisorInviteTokenPayload;
  } catch {
    return null;
  }
}
