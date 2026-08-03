import { describe, expect, it } from "vitest";
import { GET } from "@/app/posts/%EC%9B%B9%EC%95%B1%EC%97%90%EC%84%9C-%EC%8A%A4%ED%94%8C%EB%9E%98%EC%8B%9C-%EC%8A%A4%ED%81%AC%EB%A6%B0-%EB%A7%8C%EB%93%A4%EA%B8%B0/route";

describe("중복 LONG 포스트 HTTP 리다이렉트", () => {
  it("구 URL을 대표 URL로 308 리다이렉트한다", () => {
    const response = GET(
      new Request(`https://byungskerlog.com/posts/${encodeURIComponent("웹앱에서-스플래시-스크린-만들기")}`)
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://byungskerlog.com/posts/web-app-splash-screen");
  });
});
