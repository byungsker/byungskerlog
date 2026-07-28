import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockLookup } = vi.hoisted(() => ({ mockLookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mockLookup }));

import {
  createPinnedLookup,
  GET,
  isBlockedAddress,
} from "@/app/api/og/route";

describe("GET /api/og", () => {
  beforeEach(() => {
    mockLookup.mockReset();
    vi.restoreAllMocks();
  });

  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::7f00:1",
    "::ffff:0a00:1",
    "64:ff9b::7f00:1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
  ])(
    "내부 주소 %s를 차단한다",
    (address) => {
      expect(isBlockedAddress(address)).toBe(true);
    }
  );

  it.each(["2606:4700:4700::1111", "2001:4860:4860::8888"])(
    "공개 IPv6 주소 %s를 허용한다",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    }
  );

  it("Undici의 all 조회에서도 검증된 주소만 반환한다", async () => {
    const pinnedLookup = createPinnedLookup("93.184.216.34", 4);
    const result = await new Promise<unknown>((resolve, reject) => {
      pinnedLookup("example.com", { all: true }, (error, addresses) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(addresses);
      });
    });

    expect(result).toEqual([{ address: "93.184.216.34", family: 4 }]);
  });

  it("localhost 요청을 fetch 전에 차단한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET(
      new Request("http://localhost/api/og?url=http://localhost:3000/private")
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("공개 호스트가 내부 주소로 해석되면 차단한다", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.0.2", family: 4 }]);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET(
      new Request("http://localhost/api/og?url=https://example.com")
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("리다이렉트 대상도 다시 검증한다", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/admin" },
      })
    );

    const response = await GET(
      new Request("http://localhost/api/og?url=https://example.com")
    );

    expect(response.status).toBe(400);
  });

  it("1MB를 넘는 응답을 거부한다", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html></html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "content-length": "1000001",
        },
      })
    );

    const response = await GET(
      new Request("http://localhost/api/og?url=https://example.com")
    );

    expect(response.status).toBe(413);
  });

  it("공개 HTML의 OG 정보를 반환한다", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        '<html><head><title>Example</title><meta property="og:image" content="/cover.jpg"></head></html>',
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
      )
    );

    const response = await GET(
      new Request("http://localhost/api/og?url=https://example.com/path")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Example");
    expect(data.image).toBe("https://example.com/cover.jpg");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        redirect: "manual",
        dispatcher: expect.any(Object),
      })
    );
  });
});
