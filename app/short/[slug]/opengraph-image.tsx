import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-config";

export const alt = "Byungsker Log Short Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let title = "Byungsker Log";
  let thumbnail: string | null = null;

  try {
    const post = await prisma.post.findFirst({
      where: {
        published: true,
        OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
        type: "SHORT",
      },
      select: { title: true, thumbnail: true },
    });

    if (post) {
      title = post.title;
      thumbnail = post.thumbnail;
    }
  } catch {
    // Use defaults if post not found
  }

  if (thumbnail) {
    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
        }}
      >
        <img
          src={thumbnail}
          alt={title}
          width={1200}
          height={630}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>,
      {
        ...size,
      }
    );
  }

  const logoUrl = `${siteUrl}/img-og-logo.png`;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
      }}
    >
      <img
        src={logoUrl}
        alt="Byungsker Blog Logo"
        width={1200}
        height={630}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>,
    {
      ...size,
    }
  );
}
