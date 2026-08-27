import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const VISITOR_ID_COOKIE = "byungskerlog_visitor_id";
export const VISITOR_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidVisitorId(value: string | undefined): value is string {
  return Boolean(value && VISITOR_ID_PATTERN.test(value));
}

export function resolveVisitorId(request: NextRequest): { visitorId: string; cookieValue: string } {
  const cookieValue = request.cookies.get(VISITOR_ID_COOKIE)?.value;

  if (isValidVisitorId(cookieValue)) {
    return { visitorId: cookieValue, cookieValue };
  }

  const generatedVisitorId = randomUUID();
  return { visitorId: generatedVisitorId, cookieValue: generatedVisitorId };
}

export function setVisitorIdCookie(response: NextResponse, visitorId: string): void {
  response.cookies.set({
    name: VISITOR_ID_COOKIE,
    value: visitorId,
    httpOnly: true,
    maxAge: VISITOR_ID_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
