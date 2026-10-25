import type { CSSProperties } from "react";

const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 4 4 10-10",
  edit: "m15 5 4 4M4 20l4-1L20 7a2 2 0 0 0-3-3L5 16l-1 4Z",
  book: "M4 5h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v14h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4V5Zm8 1v14",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18m-9-9c4 4 4 14 0 18-4-4-4-14 0-18",
  info: "M12 11v6m0-10v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  sparkle: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  chat: "M4 4h16v12H9l-5 4V4Z",
  reset: "M4 10a8 8 0 1 1 1 9M4 4v6h6",
  search: "M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 6 6",
};
export function Icon({
  name,
  size = 18,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
