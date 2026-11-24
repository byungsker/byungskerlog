import type { ReactNode } from "react";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="legal-page">
      <article className="legal-layout">
        <h1>{title}</h1>
        <p className="legal-updated">시행일: {updatedAt}</p>
        <div className="legal-content">{children}</div>
      </article>
    </main>
  );
}
