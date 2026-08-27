import { NextResponse } from "next/server";

const DESTINATION_PATH = "/posts/web-app-splash-screen";

export function GET(request: Request) {
  return NextResponse.redirect(new URL(DESTINATION_PATH, request.url), 308);
}
