import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ViewTracker } from "@/components/analytics/ViewTracker";

describe("ViewTracker", () => {
  it("Strict Mode의 중복 effect에서도 같은 글의 조회 기록을 한 번만 전송한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <StrictMode>
        <ViewTracker slug="strict-mode-dedupe-post" />
      </StrictMode>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/posts-by-slug/strict-mode-dedupe-post/views", { method: "POST" });

    vi.unstubAllGlobals();
  });
});
