import { useId } from "react";
import { FURS, MANES, EYES, SPECIES, lionName } from "./domain/catalog.js";

// Every shape is generated locally from the immutable on-chain trait indexes.
export default function LionPortrait({ lion, className = "", decorative = false }) {
  const uid = useId().replaceAll(":", "");
  const baseFur = FURS[lion.fur];
  const fur =
    lion.species === 5
      ? { color: "#E0E2E8", light: "#FFFFFF" }
      : lion.species === 2
        ? { color: "#D5A133", light: "#FFF0AF" }
        : lion.species === 3
          ? { color: "#A8D5E3", light: "#F0FCFF" }
          : baseFur;
  const baseMane = MANES[lion.mane];
  const mane =
    lion.species === 3 ? { ...baseMane, color: "#75B5CB", shape: "crystal" } : baseMane;
  const maneFill =
    lion.species === 5
      ? `url(#${uid}-monochrome)`
      : lion.species === 4
        ? `url(#${uid}-rainbow)`
        : `url(#${uid}-mane)`;
  const eye = EYES[lion.eyes];
  const petals = mane.shape === "sun" ? 15 : mane.shape === "wild" ? 12 : 10;
  return (
    <svg
      viewBox="0 0 360 340"
      style={lion.species === 5 ? { filter: "grayscale(1)" } : undefined}
      className={`lion-portrait ${className}`}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : `${lionName(lion)}，${SPECIES[lion.species].name}，${baseFur.name}毛色，${mane.name}，${eye.name}眼睛`
      }
    >
      <defs>
        <linearGradient id={`${uid}-fur`} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor={fur.light} />
          <stop offset="1" stopColor={fur.color} />
        </linearGradient>
        <linearGradient id={`${uid}-mane`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={mane.color} />
          <stop offset="1" stopColor={mane.color} />
        </linearGradient>
        <radialGradient id={`${uid}-light`}>
          <stop stopColor="#ffffff" stopOpacity=".26" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-rainbow`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#F1ABBD" />
          <stop offset=".27" stopColor="#DFBAEF" />
          <stop offset=".53" stopColor="#9EBDF0" />
          <stop offset=".75" stopColor="#9EDFD7" />
          <stop offset="1" stopColor="#F2D68F" />
        </linearGradient>
        <linearGradient id={`${uid}-metal`}>
          <stop stopColor="#966317" />
          <stop offset=".3" stopColor="#FBE39A" />
          <stop offset=".5" stopColor="#C6973C" />
          <stop offset=".7" stopColor="#FFEDBA" />
          <stop offset="1" stopColor="#B17A21" />
        </linearGradient>
        <linearGradient id={`${uid}-monochrome`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#10141F" />
          <stop offset=".3" stopColor="#BFC7D5" />
          <stop offset=".45" stopColor="#FAFCFF" />
          <stop offset=".6" stopColor="#242B3C" />
          <stop offset=".85" stopColor="#C5CDD8" />
          <stop offset="1" stopColor="#111622" />
        </linearGradient>
      </defs>
      {lion.species === 5 && (
        <g fill="none">
          <ellipse cx="180" cy="161" rx="140" ry="116" stroke="#303847" strokeWidth="3" />
          <ellipse
            cx="180"
            cy="161"
            rx="147"
            ry="120"
            stroke="#FAFDFF"
            strokeWidth="2"
            strokeDasharray="4 8"
          />
          <circle
            cx="180"
            cy="38"
            r="23"
            fill="#222837"
            stroke="#EDF3FF"
            strokeWidth="4"
          />
          <path
            d="m44 152 10-17 10 17-10 18zm249 57 9-17 9 17-9 18z"
            fill={`url(#${uid}-monochrome)`}
            stroke="#E8EDF5"
            strokeWidth="2"
          />
        </g>
      )}
      {lion.aura > 0 && (
        <g
          className="lion-aura"
          fill={lion.aura === 1 ? "#F1CE69" : "#B3A6DC"}
          opacity=".8"
        >
          {Array.from({ length: lion.aura === 1 ? 6 : 10 }, (_, i) => {
            const angle = (i * Math.PI * 2) / (lion.aura === 1 ? 6 : 10);
            return (
              <path
                key={i}
                d="m0-5 2 3 3 2-3 2-2 4-2-4-3-2 3-2z"
                transform={`translate(${180 + Math.cos(angle) * 145} ${167 + Math.sin(angle) * 138})`}
              />
            );
          })}
        </g>
      )}
      {lion.aura === 3 && (
        <ellipse
          cx="180"
          cy="174"
          rx="158"
          ry="54"
          transform="rotate(-25 180 174)"
          fill="none"
          stroke="#AE9BDC"
          strokeWidth="2"
          strokeDasharray="8 5"
        />
      )}
      {lion.species === 4 && (
        <g
          stroke={`url(#${uid}-rainbow)`}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
        >
          <path d="M103 219Q14 177 43 122Q70 86 32 64" />
          <path d="M248 230Q333 278 316 192Q301 152 333 103" />
        </g>
      )}
      <ellipse cx="183" cy="313" rx="102" ry="13" fill="#233b30" opacity=".09" />
      <path
        d="M241 280c74 22 54-76 73-67"
        fill="none"
        stroke={fur.color}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path d="M312 217c-20-13-4-33 9-30 12 4 9 22-9 30" fill={mane.color} />
      <path
        d="M132 233c-15 24-21 53-12 77 20 9 43 6 57 0h45c21 8 39 5 45-3 6-19-9-59-30-76z"
        fill={`url(#${uid}-fur)`}
      />
      <ellipse cx="182" cy="270" rx="38" ry="44" fill={fur.light} opacity=".75" />
      <path
        d="M151 259v49m62-49v49"
        stroke={mane.color}
        strokeOpacity=".19"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="143" cy="309" rx="28" ry="11" fill={fur.color} />
      <ellipse cx="226" cy="309" rx="28" ry="11" fill={fur.color} />
      <g fill={maneFill}>
        <ellipse cx="180" cy="167" rx="108" ry="112" />
        {Array.from({ length: petals }, (_, i) => (
          <path
            key={i}
            d={
              mane.shape === "crystal"
                ? "M148 91L154 43L176 20L201 52L211 94Z"
                : mane.shape === "flame"
                  ? "M146 92Q137 69 170 23Q151 68 194 44Q221 77 206 98Z"
                  : mane.shape === "wild"
                    ? "M150 87Q141 39 176 26L198 91Z"
                    : mane.shape === "sun"
                      ? "M151 93Q139 47 166 33Q189 24 207 86Z"
                      : "M150 99C119 64 148 26 179 36C207 19 226 63 208 97Z"
            }
            transform={`rotate(${(i * 360) / petals} 180 162)`}
          />
        ))}
      </g>
      {lion.mane === 8 && (
        <g fill="none" stroke="#D7BAEF" strokeWidth="3">
          <ellipse cx="180" cy="166" rx="123" ry="113" />
          <ellipse cx="180" cy="166" rx="136" ry="94" transform="rotate(-35 180 166)" />
        </g>
      )}
      {lion.species === 3 || lion.mane === 7 ? (
        <g fill="#E0F9FF" opacity=".45">
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={i}
              d="M159 78L177 27L199 79L179 67Z"
              transform={`rotate(${i * 36} 180 162)`}
            />
          ))}
        </g>
      ) : null}
      <ellipse cx="165" cy="137" rx="108" ry="101" fill={`url(#${uid}-light)`} />
      <g
        fill="none"
        stroke={fur.light}
        strokeWidth="2.2"
        opacity=".16"
        strokeLinecap="round"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M174 54q-7 10-2 25" transform={`rotate(${i * 30} 180 164)`} />
        ))}
      </g>
      <circle cx="105" cy="108" r="28" fill={fur.color} />
      <circle cx="255" cy="108" r="28" fill={fur.color} />
      <circle cx="105" cy="110" r="17" fill={mane.color} opacity=".65" />
      <circle cx="255" cy="110" r="17" fill={mane.color} opacity=".65" />
      <path
        d="M112 120C115 85 141 77 180 85C219 77 245 85 248 120L249 177C244 216 216 242 180 242S115 216 111 177Z"
        fill={`url(#${uid}-fur)`}
      />
      <path d="M171 88q9 25 18 0" fill={mane.color} opacity=".25" />
      <path
        d="M125 143q16-9 29 0m52 0q15-9 29 0"
        fill="none"
        stroke={mane.color}
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".6"
      />
      {lion.temperament === 1 && lion.eyes < 5 ? (
        <g fill="none" stroke="#384039" strokeWidth="4" strokeLinecap="round">
          <path d="M126 165q14 8 27-1m54 0q14 9 27 0" />
        </g>
      ) : (
        <g>
          <ellipse cx="141" cy="163" rx="12" ry="15" fill="#FAF5E7" />
          <ellipse cx="219" cy="163" rx="12" ry="15" fill="#FAF5E7" />
          <ellipse cx="142" cy="164" rx="9" ry="12" fill={eye.color} />
          <ellipse
            cx="218"
            cy="164"
            rx="9"
            ry="12"
            fill={lion.eyes === 5 ? "#79BAD9" : eye.color}
          />
          <ellipse cx="143" cy="164" rx="4.5" ry="10" fill="#2E3832" />
          <ellipse cx="217" cy="164" rx="4.5" ry="10" fill="#2E3832" />
          <circle cx="145" cy="159" r="3" fill="white" />
          <circle cx="220" cy="159" r="3" fill="white" />
          {lion.eyes === 6 && (
            <g fill="#FFF4BE">
              <path d="m142 155 2 6 6 3-6 2-2 7-2-7-6-2 6-3z" />
              <path d="m218 155 2 6 6 3-6 2-2 7-2-7-6-2 6-3z" />
            </g>
          )}
        </g>
      )}
      <ellipse cx="131" cy="185" rx="15" ry="8" fill="#C27866" opacity=".17" />
      <ellipse cx="229" cy="185" rx="15" ry="8" fill="#C27866" opacity=".17" />
      <ellipse cx="160" cy="199" rx="27" ry="20" fill="#FFF0D3" />
      <ellipse cx="200" cy="199" rx="27" ry="20" fill="#FFF0D3" />
      <path d="M167 183Q180 177 193 183L183 195Q180 198 177 194Z" fill="#584135" />
      <path
        d="M180 196v10m0 0q-9 10-19 1m19-1q9 10 19 1"
        stroke="#584135"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <g fill="#785C43" opacity=".5">
        <circle cx="147" cy="197" r="1.6" />
        <circle cx="155" cy="203" r="1.6" />
        <circle cx="213" cy="197" r="1.6" />
        <circle cx="205" cy="203" r="1.6" />
      </g>
      {lion.pattern === 1 && (
        <path
          d="m180 110 4 9 10 2-7 7 1 10-8-5-8 5 1-10-7-7 10-2z"
          fill={fur.light}
          stroke={mane.color}
          strokeOpacity=".22"
        />
      )}
      {lion.pattern === 2 && (
        <g stroke={mane.color} strokeWidth="5" opacity=".4" strokeLinecap="round">
          <path d="m158 103 5 18m17-23v19m22-14-5 18m-79 60 12 4m113-4-12 4" />
        </g>
      )}
      {lion.pattern === 3 && (
        <g fill={mane.color} opacity=".25">
          {[
            [160, 110],
            [181, 115],
            [201, 109],
            [153, 124],
            [210, 125],
            [121, 178],
            [238, 178],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.2" />
          ))}
        </g>
      )}
      {lion.pattern === 4 && (
        <g stroke="#FDF4DB" fill="#FDF4DB">
          <path d="m153 117 18-8 15 17 21-10" fill="none" strokeWidth="2" />
          {[
            [153, 117],
            [171, 109],
            [186, 126],
            [207, 116],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3" />
          ))}
        </g>
      )}
      {lion.pattern === 5 && (
        <g fill="none" stroke="#EFE1AF" strokeWidth="3">
          <path d="m169 109 11-12 11 12-11 15zM119 175l10-8v17m112-9-10-8v17" />
        </g>
      )}
      {lion.species === 1 && (
        <g fill="#FFF7E9">
          <path d="m153 252 12-12 15 8 14-8 14 12-9 25-11-7-8 19-8-19-11 7z" />
          <path d="m94 103 10-10 12 11-8 6zM245 104l10-11 11 10-14 7z" />
        </g>
      )}
      {lion.species === 2 && (
        <g fill={`url(#${uid}-metal)`} stroke="#CBA254" strokeWidth="1">
          <path d="m156 250 24-10 24 10-7 24-17 14-17-14z" />
          <circle cx="180" cy="262" r="10" />
          <path d="m172 113 8-13 8 13-8 7z" />
        </g>
      )}
      {lion.species === 3 && (
        <g stroke="#D5F7FF" strokeWidth="1.5">
          <path d="m156 253 24-13 24 13-24 33z" fill="#A2D9F0" />
          <path d="m156 253 24 9 24-9m-24-13v46" fill="none" />
          <path d="m119 95-5-34 19 23m108 11 5-34-19 23" fill="#D4F3FA" />
        </g>
      )}
      {lion.species === 4 && (
        <g fill={`url(#${uid}-rainbow)`} stroke="#F9EDFF" strokeWidth="1.5">
          <path d="m62 167 10-18 9 18-9 17zm222-71 10-18 9 18-9 17zm-5 154 8-14 8 14-8 15z" />
        </g>
      )}
      {lion.crown === 1 && (
        <g fill="#97AC67" stroke="#627D44" strokeWidth="1">
          <path d="M153 81q27 16 54 0" fill="none" strokeWidth="2" />
          {[154, 166, 178, 190, 202].map((x, i) => (
            <ellipse
              key={x}
              cx={x}
              cy={81 + Math.sin((i / 4) * Math.PI) * 7}
              rx="5"
              ry="9"
              transform={`rotate(${i < 2 ? -35 : 35} ${x} 85)`}
            />
          ))}
        </g>
      )}
      {lion.crown === 2 && (
        <g fill="#CCEAF5" stroke="#91B8D7" strokeWidth="1.5">
          <path d="m152 69 5-29 15 24 9-41 11 41 15-24 3 30z" />
          <path d="m181 23 0 43m-24-26 15 24m35-24-15 24" fill="none" />
        </g>
      )}
      {lion.crown === 3 && (
        <g fill="none" stroke="#EFD391">
          <ellipse cx="180" cy="34" rx="43" ry="10" strokeWidth="5" />
          <ellipse cx="180" cy="34" rx="52" ry="15" opacity=".3" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}
