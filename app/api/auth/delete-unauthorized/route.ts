import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isAuthorizedMember } from "@/lib/auth-allowlist";

export async function POST() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (isAuthorizedMember(user)) {
      return NextResponse.json({ error: "User is authorized" }, { status: 400 });
    }

    await user.delete();

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
