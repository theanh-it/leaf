/** helpers/client-ip.ts: xác định IP từ socket và chuỗi proxy tin cậy. */
import { describe, expect, test } from "bun:test";
import { resolveClientIp } from "@/helpers/client-ip";

describe("trusted proxy IP resolution", () => {
  test("ignores spoofed forwarding from direct clients", () => {
    expect(resolveClientIp("203.0.113.5", "198.51.100.1", [])).toBe(
      "203.0.113.5"
    );
    expect(resolveClientIp("203.0.113.5", "198.51.100.1", ["127.0.0.1"])).toBe(
      "203.0.113.5"
    );
  });
  test("walks trusted proxies from right to left and stops at the first client", () => {
    expect(
      resolveClientIp("127.0.0.1", "198.51.100.99, 203.0.113.5", ["127.0.0.1"])
    ).toBe("203.0.113.5");
    expect(
      resolveClientIp("127.0.0.1", "203.0.113.5, 10.0.0.1", [
        "127.0.0.1",
        "10.0.0.1",
      ])
    ).toBe("203.0.113.5");
  });
  test("normalizes mapped IPv4 and supports IPv6 peers", () => {
    expect(
      resolveClientIp("::ffff:127.0.0.1", "203.0.113.5", ["127.0.0.1"])
    ).toBe("203.0.113.5");
    expect(resolveClientIp("::1", "2001:db8::1", ["::1"])).toBe("2001:db8::1");
  });
  test("malformed or oversized chains fall back to the socket peer", () => {
    expect(
      resolveClientIp("127.0.0.1", "bad, 203.0.113.5", ["127.0.0.1"])
    ).toBe("127.0.0.1");
    expect(
      resolveClientIp("127.0.0.1", Array(101).fill("203.0.113.5").join(","), [
        "127.0.0.1",
      ])
    ).toBe("127.0.0.1");
    expect(resolveClientIp(undefined, "203.0.113.5", ["127.0.0.1"])).toBe(
      "unknown"
    );
  });
});
