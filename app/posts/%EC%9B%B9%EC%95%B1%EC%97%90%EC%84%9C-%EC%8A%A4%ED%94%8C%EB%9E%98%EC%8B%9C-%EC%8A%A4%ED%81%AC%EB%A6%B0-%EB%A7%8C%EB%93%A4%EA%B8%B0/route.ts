import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

const DESTINATION_PATH = "/posts/web-app-splash-screen";

export function GET() {
  return NextResponse.redirect(new URL(DESTINATION_PATH, siteConfig.url), 308);
}
