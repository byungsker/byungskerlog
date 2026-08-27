import { ImageResponse } from "next/og";
import { siteUrl } from "@/lib/site-config";

export const alt = "Byungsker Log - 제품 주도 개발을 지향하는 개발자의 기술 블로그";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoUrl = `${siteUrl}/logo-byungsker.png`;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000000",
      }}
    >
      <img
        src={logoUrl}
        alt="Byungsker Blog Logo"
        width={400}
        height={186}
        style={{
          objectFit: "contain",
        }}
      />
    </div>,
    {
      ...size,
    }
  );
}
