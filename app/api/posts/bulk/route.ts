import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { revalidatePostListCaches } from "@/lib/post-cache";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

type BulkAction = "delete" | "publish" | "unpublish";

interface BulkActionRequest {
  action: BulkAction;
  postIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }
    if (!isAuthorizedAdmin(user)) {
      throw ApiError.forbidden("Administrator access required");
    }

    const body = (await request.json()) as BulkActionRequest;
    const { action, postIds } = body;

    if (!action || !postIds || !Array.isArray(postIds) || postIds.length === 0) {
      throw ApiError.validationError("action and postIds are required");
    }

    if (!["delete", "publish", "unpublish"].includes(action)) {
      throw ApiError.validationError("Invalid action. Must be 'delete', 'publish', or 'unpublish'");
    }

    let result: { count: number };

    switch (action) {
      case "delete":
        result = await prisma.post.deleteMany({
          where: { id: { in: postIds } },
        });
        break;

      case "publish":
        result = await prisma.post.updateMany({
          where: { id: { in: postIds } },
          data: { published: true },
        });
        break;

      case "unpublish":
        result = await prisma.post.updateMany({
          where: { id: { in: postIds } },
          data: { published: false },
        });
        break;

      default:
        throw ApiError.validationError("Invalid action");
    }

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/short-posts");
    revalidatePath("/tags");
    revalidatePath("/admin/posts");
    revalidatePostListCaches();

    const actionMessages: Record<BulkAction, string> = {
      delete: "deleted",
      publish: "published",
      unpublish: "unpublished",
    };

    return NextResponse.json({
      message: `${result.count} post(s) ${actionMessages[action]} successfully`,
      count: result.count,
    });
  } catch (error) {
    return handleApiError(error, "Failed to perform bulk action");
  }
}
