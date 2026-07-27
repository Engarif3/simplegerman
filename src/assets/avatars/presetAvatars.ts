// Preset avatar SVG markup, copied verbatim from the web app's
// public/avatars/*.svg (20 icons, avatar-01..avatar-20) and inlined as
// strings here (rather than as separate asset files) so no Metro/babel
// asset-transform configuration is needed to load them — react-native-svg's
// SvgXml just renders a raw XML string directly.
export const PRESET_AVATAR_IDS: string[] = [
  "avatar-01",
  "avatar-02",
  "avatar-03",
  "avatar-04",
  "avatar-05",
  "avatar-06",
  "avatar-07",
  "avatar-08",
  "avatar-09",
  "avatar-10",
  "avatar-11",
  "avatar-12",
  "avatar-13",
  "avatar-14",
  "avatar-15",
  "avatar-16",
  "avatar-17",
  "avatar-18",
  "avatar-19",
  "avatar-20",
];

export const PRESET_AVATAR_SVG: Record<string, string> = {
  "avatar-01": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c01"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#ef4444"/>
  <g clip-path="url(#c01)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-02": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c02"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#f97316"/>
  <g clip-path="url(#c02)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-03": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c03"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#f59e0b"/>
  <g clip-path="url(#c03)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-04": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c04"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#eab308"/>
  <g clip-path="url(#c04)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-05": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c05"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#84cc16"/>
  <g clip-path="url(#c05)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-06": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c06"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#22c55e"/>
  <g clip-path="url(#c06)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-07": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c07"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#10b981"/>
  <g clip-path="url(#c07)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-08": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c08"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#14b8a6"/>
  <g clip-path="url(#c08)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-09": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c09"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#06b6d4"/>
  <g clip-path="url(#c09)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-10": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c10"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#0ea5e9"/>
  <g clip-path="url(#c10)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-11": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c11"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#3b82f6"/>
  <g clip-path="url(#c11)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-12": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c12"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#6366f1"/>
  <g clip-path="url(#c12)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-13": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c13"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#8b5cf6"/>
  <g clip-path="url(#c13)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-14": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c14"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#a855f7"/>
  <g clip-path="url(#c14)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-15": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c15"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#d946ef"/>
  <g clip-path="url(#c15)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-16": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c16"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#ec4899"/>
  <g clip-path="url(#c16)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-17": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c17"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#f43f5e"/>
  <g clip-path="url(#c17)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-18": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c18"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#475569"/>
  <g clip-path="url(#c18)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-19": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c19"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#78716c"/>
  <g clip-path="url(#c19)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
  "avatar-20": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <clipPath id="c20"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" fill="#262626"/>
  <g clip-path="url(#c20)" fill="#ffffff" fill-opacity="0.95">
    <circle cx="50" cy="38" r="17"/>
    <ellipse cx="50" cy="94" rx="34" ry="30"/>
  </g>
</svg>`,
};
