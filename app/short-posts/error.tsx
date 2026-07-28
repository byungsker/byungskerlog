"use client";

import { Button } from "@/components/ui/Button";

export default function ShortPostsError({ reset }: { reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-semibold">Shorts를 불러오지 못했습니다.</h1>
        <p className="mt-3 text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
        <Button
          type="button"
          onClick={() => reset()}
          variant="outline"
          className="mt-6 min-h-11 min-w-11 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          다시 시도
        </Button>
      </div>
    </div>
  );
}
