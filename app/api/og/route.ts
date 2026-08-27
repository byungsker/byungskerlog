import { lookup } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import { NextResponse } from "next/server";
import { Agent } from "undici";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 5_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;
const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
}

class UnsafeUrlError extends Error {}
class ResponseTooLargeError extends Error {}

interface PublicUrlTarget {
  url: URL;
  address: string;
  family: number;
}

function isBlockedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  const [head, tail, ...extra] = normalized.split("::");
  if (extra.length > 0) return true;

  const parseHextets = (part: string): number[] | null => {
    if (!part) return [];

    const segments = part.split(":");
    const lastSegment = segments.at(-1);
    if (lastSegment?.includes(".")) {
      if (isBlockedIpv4(lastSegment)) return null;
      const octets = lastSegment.split(".").map(Number);
      segments.splice(
        segments.length - 1,
        1,
        ((octets[0] << 8) | octets[1]).toString(16),
        ((octets[2] << 8) | octets[3]).toString(16)
      );
    }

    const hextets = segments.map((segment) => Number.parseInt(segment, 16));
    if (
      segments.some((segment) => !/^[0-9a-f]{1,4}$/.test(segment)) ||
      hextets.some((segment) => !Number.isInteger(segment) || segment > 0xffff)
    ) {
      return null;
    }
    return hextets;
  };

  const headHextets = parseHextets(head);
  const tailHextets = tail === undefined ? [] : parseHextets(tail);
  if (!headHextets || !tailHextets) return true;

  const omittedCount =
    tail === undefined ? 0 : 8 - headHextets.length - tailHextets.length;
  if (
    omittedCount < (tail === undefined ? 0 : 1) ||
    headHextets.length + tailHextets.length + omittedCount !== 8
  ) {
    return true;
  }

  const hextets = [
    ...headHextets,
    ...Array.from({ length: omittedCount }, () => 0),
    ...tailHextets,
  ];

  // Public IPv6 destinations must be in the IANA global-unicast 2000::/3
  // allocation. This excludes loopback, mapped/compatible IPv4, ULA,
  // link-local, multicast, NAT64, IPv4 transition, and other special-purpose
  // ranges.
  const isGlobalUnicast = hextets[0] >= 0x2000 && hextets[0] <= 0x3fff;
  const isDocumentationRange = hextets[0] === 0x2001 && hextets[1] === 0x0db8;
  const isTeredo = hextets[0] === 0x2001 && hextets[1] === 0x0000;
  const isSixToFour = hextets[0] === 0x2002;
  return !isGlobalUnicast || isDocumentationRange || isTeredo || isSixToFour;
}

export function isBlockedAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version === 6) return isBlockedIpv6(address);
  return true;
}

async function validatePublicUrl(rawUrl: string): Promise<PublicUrlTarget> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new UnsafeUrlError("Only public HTTP(S) URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new UnsafeUrlError("Private hosts are not allowed");
  }

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new UnsafeUrlError("Private addresses are not allowed");
    }
    return { url: parsed, address: hostname, family: isIP(hostname) };
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = (await lookup(hostname, {
      all: true,
      verbatim: true,
    })) as Array<{ address: string; family: number }>;
  } catch {
    throw new UnsafeUrlError("Host could not be resolved");
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new UnsafeUrlError("Private addresses are not allowed");
  }

  return {
    url: parsed,
    address: addresses[0].address,
    family: addresses[0].family,
  };
}

export function createPinnedLookup(
  address: string,
  family: number
): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [{ address, family }]);
      return;
    }
    callback(null, address, family);
  };
}

function createPinnedDispatcher(target: PublicUrlTarget): Agent {
  const pinnedLookup = createPinnedLookup(target.address, target.family);
  return new Agent({ connect: { lookup: pinnedLookup } });
}

async function fetchPublicHtml(
  initialTarget: PublicUrlTarget,
  signal: AbortSignal
): Promise<{ response: Response; finalUrl: URL; dispatcher: Agent }> {
  let currentTarget = initialTarget;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const dispatcher = createPinnedDispatcher(currentTarget);
    let response: Response;
    try {
      response = await fetch(currentTarget.url, {
        headers: {
          "User-Agent": "ByungskerLog-OpenGraph/0.2",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal,
        dispatcher,
      } as RequestInit & { dispatcher: Agent });
    } catch (error) {
      await dispatcher.close();
      throw error;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) {
        await response.body?.cancel();
        await dispatcher.close();
        throw new UnsafeUrlError("Too many or invalid redirects");
      }
      await response.body?.cancel();
      await dispatcher.close();
      currentTarget = await validatePublicUrl(
        new URL(location, currentTarget.url).toString()
      );
      continue;
    }

    return {
      response,
      finalUrl: currentTarget.url,
      dispatcher,
    };
  }

  throw new UnsafeUrlError("Too many redirects");
}

async function readBoundedText(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new ResponseTooLargeError();
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let html = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new ResponseTooLargeError();
    }
    html += decoder.decode(value, { stream: true });
  }

  return html + decoder.decode();
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const initialTarget = await validatePublicUrl(rawUrl);
    const { response, finalUrl, dispatcher } = await fetchPublicHtml(
      initialTarget,
      controller.signal
    );

    try {
      if (!response.ok) {
        await response.body?.cancel();
        return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 });
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("text/html")) {
        await response.body?.cancel();
        return NextResponse.json({ error: "URL is not HTML" }, { status: 400 });
      }

      const html = await readBoundedText(response);
      const getMetaContent = (property: string): string | null => {
        const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patterns = [
          new RegExp(`<meta[^>]*property=["']${escapedProperty}["'][^>]*content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${escapedProperty}["']`, "i"),
          new RegExp(`<meta[^>]*name=["']${escapedProperty}["'][^>]*content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${escapedProperty}["']`, "i"),
        ];
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      let image = getMetaContent("og:image") || getMetaContent("twitter:image");

      if (!image) {
        const appleTouchIcon = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["']/i);
        const faviconLarge = html.match(/<link[^>]*rel=["']icon["'][^>]*sizes=["'](\d+)x\d+["'][^>]*href=["']([^"']*)["']/i);
        const favicon = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
        image = appleTouchIcon?.[1] || faviconLarge?.[2] || favicon?.[1] || null;
      }

      if (image) {
        try {
          image = new URL(image, finalUrl).toString();
        } catch {
          image = null;
        }
      }

      const ogData: OGData = {
        title: getMetaContent("og:title") || titleMatch?.[1].trim() || null,
        description: getMetaContent("og:description") || getMetaContent("description"),
        image,
        siteName: getMetaContent("og:site_name"),
        url: finalUrl.toString(),
      };

      return NextResponse.json(ogData, {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } finally {
      await dispatcher.close();
    }
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ResponseTooLargeError) {
      return NextResponse.json({ error: "Response is too large" }, { status: 413 });
    }
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    console.error("OG fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch OG data" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
