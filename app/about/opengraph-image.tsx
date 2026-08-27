import { ImageResponse } from "next/og";
import { siteUrl } from "@/lib/site-config";

export const alt = "About Byungsker - 제품 주도 개발을 지향하는 개발자";
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
        gap: "32px",
      }}
    >
      <img
        src={logoUrl}
        alt="Byungsker Blog Logo"
        width={300}
        height={140}
        style={{
          objectFit: "contain",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          About
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#a0a0a0",
            maxWidth: "800px",
            textAlign: "center",
          }}
        >
          Software Developer
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
