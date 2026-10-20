import { isIP } from "node:net";

/** Đi từ socket qua từng proxy tin cậy, dừng tại client đầu tiên. */
export const resolveClientIp = (
  peerAddress: string | undefined,
  forwardedFor: string | null,
  trustedProxies: readonly string[]
): string => {
  if (!peerAddress || !isIP(peerAddress)) return "unknown";
  const peer = normalizeIp(peerAddress);
  const trusted = new Set(trustedProxies.map(normalizeIp));
  if (!trusted.has(peer) || !forwardedFor) return peer;

  const hops = forwardedFor.split(",").map((address) => address.trim());
  if (hops.length > 100 || hops.some((address) => !isIP(address))) return peer;

  let client = peer;
  for (let index = hops.length - 1; index >= 0; index -= 1) {
    if (!trusted.has(client)) break;
    client = normalizeIp(hops[index]!);
  }
  return client;
};

function normalizeIp(address: string): string {
  if (address.startsWith("::ffff:") && isIP(address.slice(7)) === 4) {
    return address.slice(7);
  }
  return address.toLowerCase();
}
