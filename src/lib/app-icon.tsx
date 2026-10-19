import { ImageResponse } from "next/og";

/** App logo as a px × px PNG (favicon, Apple touch icon, PWA icons). */
export function appIcon(px: number) {
  const u = (n: number) => (n * px) / 192; // drawn on a 192 px grid
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #18181b 0%, #000000 100%)",
          borderRadius: `${u(44)}px`,
          border: `${u(4)}px solid #8b5cf6`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: `${u(120)}px`,
            height: `${u(120)}px`,
            background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
            borderRadius: `${u(32)}px`,
            boxShadow: `0 ${u(10)}px ${u(30)}px rgba(139, 92, 246, 0.5)`,
          }}
        >
          {/* Custom SVG Wallet / Finance Logo */}
          <svg
            width={u(64)}
            height={u(64)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
