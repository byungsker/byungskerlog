import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { CountChart } from "@/components/charts/CountChart";
import { ReadingChart } from "@/components/charts/ReadingChart";
import { ViewsChart } from "@/components/charts/ViewsChart";

describe("analytics charts", () => {
  it("태그 차트는 공개 글 인벤토리의 빈 상태를 표시한다", () => {
    render(<CategoryChart data={[]} />);

    expect(screen.getByText("선택한 작성일 기간에 태그가 있는 공개 글이 없습니다.")).toBeInTheDocument();
  });

  it("고유 사용자 조회 차트는 오류와 빈 상태를 구분한다", () => {
    const { rerender } = render(<ViewsChart data={[]} />);
    expect(screen.getByText("선택한 기간에 고유 사용자 조회수가 없습니다.")).toBeInTheDocument();

    rerender(<ViewsChart data={[]} isError />);
    expect(screen.getByText("고유 사용자 조회수 분석을 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("읽기 차트는 세션 레코드 기준을 표시한다", () => {
    render(<ReadingChart data={[]} />);

    expect(
      screen.getByText("선택한 기간에 기록된 세션 레코드가 없습니다. 사람 수나 기간별 읽기 시간은 측정하지 않습니다.")
    ).toBeInTheDocument();
  });

  it("글 생성 차트는 작성일 기준 빈 상태를 표시한다", () => {
    render(<CountChart data={[]} />);

    expect(screen.getByText("선택한 작성일 기간에 생성된 공개 글이 없습니다.")).toBeInTheDocument();
  });
});
