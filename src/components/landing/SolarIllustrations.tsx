import React, { useId } from 'react';

// Brand illustrations for the solar section, shown until real photos are uploaded in the CMS.

const GREEN = '#8CC63F';
const SUN = '#F5B436';

function useIds(...names: string[]) {
  const base = useId().replace(/:/g, '');
  return Object.fromEntries(names.map((n) => [n, `${base}-${n}`])) as Record<string, string>;
}

function PanelDefs({ ids }: { ids: Record<string, string> }) {
  return (
    <>
      <linearGradient id={ids.cell} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2C6FC0" />
        <stop offset="1" stopColor="#0B2B57" />
      </linearGradient>
      <linearGradient id={ids.glare} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </>
  );
}

/** One module seen from the front, leaning back: a parallelogram split into cells. */
function Panel({ x, y, w, h, k, ids, cols = 6, rows = 3 }: {
  x: number; y: number; w: number; h: number; k: number; ids: Record<string, string>; cols?: number; rows?: number;
}) {
  const quad = `${x},${y} ${x + w},${y} ${x + w + k},${y + h} ${x + k},${y + h}`;
  return (
    <g>
      <polygon points={quad} fill={`url(#${ids.cell})`} stroke="#9BC0EA" strokeWidth="1.2" strokeLinejoin="round" />
      {Array.from({ length: cols - 1 }, (_, i) => {
        const t = (i + 1) / cols;
        return <line key={`c${i}`} x1={x + w * t} y1={y} x2={x + k + w * t} y2={y + h} stroke="#fff" strokeOpacity="0.22" strokeWidth="0.8" />;
      })}
      {Array.from({ length: rows - 1 }, (_, i) => {
        const t = (i + 1) / rows;
        return <line key={`r${i}`} x1={x + k * t} y1={y + h * t} x2={x + w + k * t} y2={y + h * t} stroke="#fff" strokeOpacity="0.22" strokeWidth="0.8" />;
      })}
      <polygon points={quad} fill={`url(#${ids.glare})`} />
    </g>
  );
}

function PanelArray({ x, y, cols, rows, w, h, k, gap, ids }: {
  x: number; y: number; cols: number; rows: number; w: number; h: number; k: number; gap: number; ids: Record<string, string>;
}) {
  const panels = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shift = (k / h) * r * (h + gap);
      panels.push(<Panel key={`${r}-${c}`} x={x + c * (w + gap) + shift} y={y + r * (h + gap)} w={w} h={h} k={k} ids={ids} />);
    }
  }
  return <g>{panels}</g>;
}

function Sun({ cx, cy, r, id }: { cx: number; cy: number; r: number; id: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 2.4} fill="#fff" opacity="0.55" />
      <circle cx={cx} cy={cy} r={r * 1.55} fill="#FFF3D1" opacity="0.9" />
      <radialGradient id={id} cx="0.35" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#FFE7A3" />
        <stop offset="1" stopColor={SUN} />
      </radialGradient>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </g>
  );
}

export function SolarScene({ className }: { className?: string }) {
  const ids = useIds('cell', 'glare', 'sky', 'sun', 'house', 'flow');
  return (
    <svg viewBox="0 0 640 465" className={className} role="img" aria-label="Centrale solaire au sol et villa équipée de panneaux et d'une batterie">
      <defs>
        <PanelDefs ids={ids} />
        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DCEBFB" />
          <stop offset="0.75" stopColor="#F6FAFE" />
        </linearGradient>
        <linearGradient id={ids.house} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EEF2F7" />
        </linearGradient>
      </defs>

      <rect width="640" height="465" fill={`url(#${ids.sky})`} />
      <Sun cx={520} cy={96} r={40} id={ids.sun} />
      <g fill="#fff" opacity="0.9">
        <ellipse cx="118" cy="92" rx="54" ry="15" />
        <ellipse cx="150" cy="80" rx="34" ry="16" />
        <ellipse cx="300" cy="58" rx="36" ry="10" />
      </g>

      {/* Hills and ground */}
      <path d="M0 318 C 110 278 210 300 300 288 S 500 262 640 290 V465 H0 Z" fill="#E4F1D2" />
      <path d="M0 360 C 140 330 260 352 380 340 S 560 322 640 336 V465 H0 Z" fill="#D2E8B4" />
      <rect y="404" width="640" height="61" fill="#EDF4E2" />

      {/* Ground-mounted array */}
      <ellipse cx="200" cy="420" rx="170" ry="10" fill="#0F172A" opacity="0.08" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} stroke="#94A3B8" strokeWidth="4" strokeLinecap="round">
          <line x1={58 + i * 92} y1="300" x2={58 + i * 92} y2="404" />
          <line x1={92 + i * 92} y1="368" x2={92 + i * 92} y2="418" />
        </g>
      ))}
      <PanelArray x={34} y={250} cols={3} rows={2} w={96} h={58} k={22} gap={5} ids={ids} />

      {/* Villa with roof panels */}
      <ellipse cx="520" cy="430" rx="120" ry="9" fill="#0F172A" opacity="0.08" />
      <rect x="418" y="300" width="200" height="128" rx="4" fill={`url(#${ids.house})`} stroke="#D7DEE8" />
      <rect x="410" y="292" width="216" height="12" rx="3" fill="#E8D9BF" />
      <rect x="560" y="250" width="58" height="50" rx="3" fill={`url(#${ids.house})`} stroke="#D7DEE8" />
      <rect x="554" y="244" width="70" height="9" rx="3" fill="#E8D9BF" />
      <PanelArray x={424} y={262} cols={3} rows={1} w={36} h={22} k={8} gap={3} ids={ids} />
      <path d="M496 428 V384 a20 20 0 0 1 40 0 V428 Z" fill="#0E6CD0" opacity="0.9" />
      <path d="M502 428 V386 a14 14 0 0 1 28 0 V428" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
      {[440, 566].map((x) => (
        <g key={x}>
          <path d={`M${x} 372 V346 a14 14 0 0 1 28 0 V372 Z`} fill="#BFD8F3" stroke="#9FB9D6" />
          <line x1={x + 14} y1="334" x2={x + 14} y2="372" stroke="#fff" strokeOpacity="0.7" />
        </g>
      ))}

      {/* Battery */}
      <g transform="translate(372 368)">
        <rect width="34" height="56" rx="7" fill="#fff" stroke="#CBD5E1" strokeWidth="1.5" />
        <rect x="11" y="-5" width="12" height="6" rx="2" fill="#CBD5E1" />
        {[0, 1, 2].map((i) => <rect key={i} x="7" y={36 - i * 13} width="20" height="9" rx="2" fill={GREEN} opacity={1 - i * 0.18} />)}
      </g>

      {/* Energy flow from the array to the battery and the house */}
      <path id={ids.flow} d="M330 392 C 350 400 356 396 372 398" fill="none" stroke={GREEN} strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
      <path d="M406 398 C 414 400 416 404 418 404" fill="none" stroke={GREEN} strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
    </svg>
  );
}

export type SolarVignetteVariant = 'industrie' | 'agriculture' | 'habitat';

export function SolarVignette({ variant, className }: { variant: SolarVignetteVariant; className?: string }) {
  const ids = useIds('cell', 'glare', 'sky', 'sun');
  return (
    <svg viewBox="0 0 400 240" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <PanelDefs ids={ids} />
        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DCEBFB" />
          <stop offset="1" stopColor="#F6FAFE" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${ids.sky})`} />
      <Sun cx={336} cy={54} r={22} id={ids.sun} />

      {variant === 'industrie' && (
        <g>
          <path d="M0 196 C 120 180 260 190 400 178 V240 H0 Z" fill="#E4F1D2" />
          <rect x="70" y="58" width="16" height="62" fill="#CBD5E1" />
          <rect x="66" y="52" width="24" height="8" rx="2" fill="#B8C4D4" />
          <rect x="44" y="118" width="300" height="88" fill="#F8FAFC" stroke="#D7DEE8" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path d={`M${44 + i * 75} 118 L${44 + i * 75 + 75} 86 L${44 + i * 75 + 75} 118 Z`} fill="#E2E8F0" stroke="#D7DEE8" />
              <Panel x={48 + i * 75} y={92} w={58} h={22} k={-6} ids={ids} cols={5} rows={2} />
            </g>
          ))}
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={66 + i * 56} y="168" width="30" height="38" fill="#BFD8F3" stroke="#9FB9D6" />)}
        </g>
      )}

      {variant === 'agriculture' && (
        <g>
          <path d="M0 150 C 110 132 250 142 400 128 V240 H0 Z" fill="#DCEFC4" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M-10 ${168 + i * 14} C 120 ${156 + i * 14} 260 ${166 + i * 14} 410 ${152 + i * 14}`} fill="none" stroke={GREEN} strokeWidth="5" strokeLinecap="round" opacity={0.55 + i * 0.07} />
          ))}
          <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
            {[56, 150, 244].map((x) => <line key={x} x1={x + 20} y1="138" x2={x + 20} y2="160" />)}
          </g>
          <PanelArray x={40} y={92} cols={3} rows={1} w={88} h={44} k={18} gap={6} ids={ids} />
          <rect x="318" y="104" width="44" height="52" rx="6" fill="#F8FAFC" stroke="#CBD5E1" />
          <path d="M340 116 c 7 9 10 14 10 19 a10 10 0 0 1 -20 0 c0 -5 3 -10 10 -19 Z" fill="#0E6CD0" opacity="0.85" />
          <path d="M318 146 H300 V176" fill="none" stroke="#0E6CD0" strokeWidth="3" strokeOpacity="0.5" />
        </g>
      )}

      {variant === 'habitat' && (
        <g>
          <path d="M0 192 C 120 176 260 186 400 172 V240 H0 Z" fill="#E4F1D2" />
          <rect x="92" y="106" width="196" height="96" rx="3" fill="#FFFFFF" stroke="#D7DEE8" />
          <rect x="86" y="98" width="208" height="10" rx="3" fill="#E8D9BF" />
          <rect x="226" y="66" width="62" height="40" rx="3" fill="#FFFFFF" stroke="#D7DEE8" />
          <rect x="220" y="60" width="74" height="8" rx="3" fill="#E8D9BF" />
          <PanelArray x={100} y={72} cols={3} rows={1} w={34} h={20} k={8} gap={3} ids={ids} />
          <path d="M172 202 V168 a18 18 0 0 1 36 0 V202 Z" fill="#0E6CD0" opacity="0.9" />
          {[112, 236].map((x) => <path key={x} d={`M${x} 160 V138 a12 12 0 0 1 24 0 V160 Z`} fill="#BFD8F3" stroke="#9FB9D6" />)}
          <g>
            <path d="M330 202 C 332 170 336 140 340 118" fill="none" stroke="#A47E52" strokeWidth="6" strokeLinecap="round" />
            {[-60, -20, 20, 60, 100].map((a) => (
              <path key={a} d="M340 118 q 22 -6 40 8" fill="none" stroke={GREEN} strokeWidth="6" strokeLinecap="round" transform={`rotate(${a} 340 118)`} />
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}
