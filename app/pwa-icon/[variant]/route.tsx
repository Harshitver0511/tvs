import { ImageResponse } from "next/og";

// App icons generated at build time (no design files needed).
// "maskable" keeps the mark inside the central 80% safe zone.
const VARIANTS = { "192": { size: 192, maskable: false }, "512": { size: 512, maskable: false }, maskable: { size: 512, maskable: true } } as const;
type Variant = keyof typeof VARIANTS;

export const dynamic = "force-static";
export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const cfg = VARIANTS[variant as Variant];
  if (!cfg) return new Response("Not found", { status: 404 });
  const { size, maskable } = cfg;
  const inner = maskable ? size * 0.62 : size * 0.86;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFD152" }}>
        <div
          style={{
            width: inner,
            height: inner,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAF8F5",
            border: `${Math.round(size / 40)}px solid #000`,
            boxShadow: `${Math.round(size / 32)}px ${Math.round(size / 32)}px 0 #000`,
          }}
        >
          <div style={{ fontSize: inner * 0.36, fontWeight: 900, color: "#000", letterSpacing: -2, lineHeight: 1 }}>TVS</div>
          <div style={{ marginTop: inner * 0.05, fontSize: inner * 0.13, fontWeight: 700, color: "#fff", background: "#1B7F45", padding: `0 ${inner * 0.05}px` }}>
            KISAN
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
