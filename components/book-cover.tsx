/**
 * A book cover: the real picture when the catalog has one, otherwise a
 * "designed" cover in the style of the javon canvas (author in mono caps,
 * title in serif, a colour picked from the title so it stays the same).
 */
import type { AuthorOut } from "@/lib/types";

const PALETTE: Array<[string, string, string]> = [
  // background, text, accent shape
  ["#1F4D3F", "#F4EFE4", "#F0B23E"],
  ["#6E2E3A", "#F6E6E9", "#E9C46A"],
  ["#14161B", "#F4EFE4", "#2B3BD1"],
  ["#E9C46A", "#2A2312", "#B4472E"],
  ["#A8C5C2", "#16302D", "#1F4D3F"],
  ["#2B3BD1", "#FFFFFF", "#F0B23E"],
  ["#B4472E", "#FFF3EC", "#F0B23E"],
  ["#E76F51", "#2B120A", "#FFF6E5"],
  ["#3C4A6B", "#EEF0FD", "#E9C46A"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function BookCover({
  title,
  authors,
  cover,
  size = "m",
  className = "",
  style,
}: {
  title: string;
  authors?: AuthorOut[] | string[];
  cover?: Record<string, string> | null;
  size?: "s" | "m" | "l";
  className?: string;
  style?: React.CSSProperties;
}) {
  const author = (authors ?? [])
    .map((a) => (typeof a === "string" ? a : a.name))
    .slice(0, 2)
    .join(", ");
  const src = cover ? cover[size] ?? cover.m ?? cover.l ?? cover.s : null;
  const [bg, fg, accent] = PALETTE[hash(title) % PALETTE.length];
  return (
    <div className={`bcover ${className}`} style={{ background: bg, color: fg, ...style }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} loading="lazy" />
      ) : (
        <>
          <span className="cv-au">{author}</span>
          <span className="cv-sun" style={{ background: accent }} />
          <span className="cv-ti" style={{ fontSize: "1.25em" }}>
            {title}
          </span>
        </>
      )}
    </div>
  );
}
