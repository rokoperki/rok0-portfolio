import { ImageResponse } from "next/og";

export const alt = "rok0 · Roko Perisic — Solana · Web3 Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#080503";
const ACCENT = "#ff3b1f";
const ACCENT2 = "#ff6a00";
const AMBER = "#ffae3b";
const WHITE = "#ffb454";
const DIM = "#7a5a3a";
const DIM2 = "#b98a5a";
const CYAN = "#33e7d2";
const LINE = "rgba(255,120,40,0.28)";

async function loadFont(
  family: string,
  weight: number,
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    return fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

type W = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type FontEntry = {
  name: string;
  data: ArrayBuffer;
  style: "normal";
  weight: W;
};

export default async function OgImage() {
  const [mono, condensed] = await Promise.all([
    loadFont("JetBrains Mono", 400),
    loadFont("Saira Condensed", 800),
  ]);

  const fonts: FontEntry[] = [];
  if (mono)
    fonts.push({
      name: "JetBrains Mono",
      data: mono,
      style: "normal",
      weight: 400,
    });
  if (condensed)
    fonts.push({
      name: "Saira Condensed",
      data: condensed,
      style: "normal",
      weight: 800,
    });

  const MONO = fonts.some((f) => f.name === "JetBrains Mono")
    ? "JetBrains Mono"
    : "monospace";
  const COND = fonts.some((f) => f.name === "Saira Condensed")
    ? "Saira Condensed"
    : "monospace";

  const TICK = 22;
  const INSET = 26;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BG,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        fontFamily: MONO,
      }}
    >
      {/* grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,120,50,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(255,120,50,0.065) 1px, transparent 1px)`,
          backgroundSize: "42px 42px",
        }}
      />

      {/* left warm glow */}
      <div
        style={{
          position: "absolute",
          left: -100,
          top: -60,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,70,25,0.14) 0%, transparent 70%)",
        }}
      />

      {/* hexagon motif — right side */}
      <div
        style={{
          position: "absolute",
          right: -60,
          top: 0,
          width: 520,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="520"
          height="630"
          viewBox="0 0 520 630"
          style={{ position: "absolute", inset: 0 }}
        >
          <polygon
            points="260,24 500,154 500,446 260,576 20,446 20,154"
            stroke="rgba(255,59,31,0.20)"
            strokeWidth="2"
            fill="none"
          />
          <polygon
            points="260,104 436,204 436,406 260,506 84,406 84,204"
            stroke="rgba(255,140,60,0.14)"
            strokeWidth="1.5"
            fill="rgba(255,90,30,0.03)"
          />
          <polygon
            points="260,184 372,246 372,364 260,426 148,364 148,246"
            stroke="rgba(255,59,31,0.40)"
            strokeWidth="2"
            fill="rgba(255,59,31,0.05)"
          />
        </svg>
      </div>

      {/* frame border */}
      <div
        style={{
          position: "absolute",
          inset: INSET,
          border: `1px solid ${LINE}`,
        }}
      />

      {/* corner ticks — TL */}
      <div
        style={{
          position: "absolute",
          top: INSET,
          left: INSET,
          width: TICK,
          height: 2,
          background: ACCENT,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: INSET,
          left: INSET,
          width: 2,
          height: TICK,
          background: ACCENT,
        }}
      />
      {/* TR */}
      <div
        style={{
          position: "absolute",
          top: INSET,
          right: INSET,
          width: TICK,
          height: 2,
          background: ACCENT,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: INSET,
          right: INSET,
          width: 2,
          height: TICK,
          background: ACCENT,
        }}
      />
      {/* BL */}
      <div
        style={{
          position: "absolute",
          bottom: INSET,
          left: INSET,
          width: TICK,
          height: 2,
          background: ACCENT,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: INSET,
          left: INSET,
          width: 2,
          height: TICK,
          background: ACCENT,
        }}
      />
      {/* BR */}
      <div
        style={{
          position: "absolute",
          bottom: INSET,
          right: INSET,
          width: TICK,
          height: 2,
          background: ACCENT,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: INSET,
          right: INSET,
          width: 2,
          height: TICK,
          background: ACCENT,
        }}
      />

      {/* frame address label */}
      <div
        style={{
          position: "absolute",
          top: INSET - 11,
          right: 66,
          fontFamily: MONO,
          fontSize: 13,
          color: DIM2,
          background: BG,
          padding: "0 8px",
          letterSpacing: "0.06em",
        }}
      >
        MEM // 0x0000 → 0x2000
      </div>

      {/* main content column */}
      <div
        style={{
          position: "absolute",
          inset: INSET,
          display: "flex",
          flexDirection: "column",
          padding: "38px 48px 34px",
        }}
      >
        {/* ── top bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderBottom: `1px solid ${LINE}`,
            paddingBottom: 16,
          }}
        >
          {/* hex badge */}
          <div
            style={{
              position: "relative",
              width: 46,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="46"
              height="52"
              viewBox="0 0 46 52"
              style={{ position: "absolute", inset: 0 }}
            >
              <polygon
                points="23,2 44,14 44,38 23,50 2,38 2,14"
                fill="none"
                stroke={ACCENT}
                strokeWidth="2"
              />
              <polygon
                points="23,13 34,19 34,33 23,39 12,33 12,19"
                fill={ACCENT}
                opacity="0.16"
              />
            </svg>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 17,
                color: ACCENT,
                fontWeight: 700,
              }}
            >
              R
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: COND,
                fontWeight: 800,
                fontSize: 23,
                letterSpacing: "0.26em",
                color: WHITE,
              }}
            >
              ROK0
            </span>
            <span
              style={{
                fontFamily: COND,
                fontSize: 10,
                letterSpacing: "0.30em",
                color: ACCENT,
              }}
            >
              MONITORING TERMINAL
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <div
            style={{
              fontFamily: "serif",
              fontSize: 12,
              color: DIM2,
              letterSpacing: "0.1em",
              marginRight: 20,
            }}
          >
            中央監視システム
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 3,
            }}
          >
            <span
              style={{
                fontFamily: COND,
                fontSize: 10,
                letterSpacing: "0.2em",
                color: DIM,
              }}
            >
              SYNC RATE
            </span>
            <span style={{ fontFamily: MONO, fontSize: 20, color: AMBER }}>
              SYNC 99.97%
            </span>
          </div>
        </div>

        {/* ── center ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* breadcrumb */}
          <div
            style={{
              display: "flex",
              fontFamily: MONO,
              fontSize: 16,
              color: DIM2,
              letterSpacing: "0.04em",
              marginBottom: 10,
            }}
          >
            <span style={{ color: DIM2 }}>MAP / </span>
            <span style={{ color: AMBER }}>0x0000</span>
            <span style={{ color: DIM2 }}> / </span>
            <span style={{ color: ACCENT }}>DOSSIER</span>
          </div>

          {/* big name */}
          <div
            style={{
              fontFamily: COND,
              fontWeight: 800,
              fontSize: 138,
              lineHeight: "0.9",
              letterSpacing: "0.01em",
              color: "#fff",
              marginTop: 28,
            }}
          >
            rok0
          </div>

          <div
            style={{
              fontFamily: COND,
              fontWeight: 700,
              fontSize: 25,
              letterSpacing: "0.22em",
              color: DIM2,
              marginTop: 12,
            }}
          >
            ROKO PERISIC
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
            }}
          >
            <span style={{ color: ACCENT, fontSize: 17, fontFamily: MONO }}>
              //
            </span>
            <span
              style={{
                fontFamily: COND,
                fontWeight: 600,
                fontSize: 19,
                letterSpacing: "0.18em",
                color: AMBER,
              }}
            >
              SOLANA · WEB3 DEVELOPER
            </span>
          </div>

          <div
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: DIM,
              letterSpacing: "0.06em",
              marginTop: 7,
            }}
          >
            Split, Croatia · Solbound.dev · github.com/rokoperki
          </div>

          {/* stack tags */}
          <div
            style={{ display: "flex", gap: 7, marginTop: 16, flexWrap: "wrap" }}
          >
            {[
              { label: "sBPF", col: ACCENT2, border: "rgba(255,106,0,0.4)" },
              { label: "Rust", col: AMBER, border: "rgba(255,174,59,0.4)" },
              { label: "Solana", col: ACCENT2, border: "rgba(255,106,0,0.4)" },
              {
                label: "Pinocchio",
                col: AMBER,
                border: "rgba(255,174,59,0.4)",
              },
              { label: "Anchor", col: AMBER, border: "rgba(255,174,59,0.4)" },
              { label: "React", col: CYAN, border: "rgba(51,231,210,0.35)" },
              { label: "Next.js", col: CYAN, border: "rgba(51,231,210,0.35)" },
              { label: "Nest.js", col: CYAN, border: "rgba(51,231,210,0.35)" },
              {
                label: "TypeScript",
                col: CYAN,
                border: "rgba(51,231,210,0.35)",
              },
              { label: ".NET", col: CYAN, border: "rgba(51,231,210,0.35)" },
            ].map(({ label, col, border }) => (
              <div
                key={label}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: col,
                  border: `1px solid ${border}`,
                  padding: "2px 8px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── bottom bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: `1px solid ${LINE}`,
            paddingTop: 14,
            fontFamily: MONO,
            fontSize: 15,
            color: DIM2,
          }}
        >
          {[
            ["ABOUT", "0x0000"],
            ["PROJECTS", "0x1000"],
            ["CONTACT", "0x2000"],
          ].map(([l, a], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <span
                  style={{
                    color: DIM,
                    marginRight: 12,
                    marginLeft: 0,
                    opacity: 0.5,
                  }}
                >
                  /
                </span>
              )}
              <span style={{ color: ACCENT2, marginRight: 12 }}>
                {l} {a}
              </span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: DIM,
              letterSpacing: "0.06em",
              marginRight: 20,
            }}
          >
            @rok0_sol
          </span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: CYAN,
              marginRight: 9,
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: CYAN,
              letterSpacing: "0.14em",
            }}
          >
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 108% 108% at 44% 50%, transparent 46%, rgba(0,0,0,0.78) 100%)",
        }}
      />
    </div>,
    { ...size, fonts },
  );
}
