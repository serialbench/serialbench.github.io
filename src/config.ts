// Site identity and navigation — the single place to change branding,
// base path usage, or links. Base path itself lives in astro.config.mjs
// (`site` + `base`); every internal link must be built from
// import.meta.env.BASE_URL, never a literal "/".
export const BASE = import.meta.env.BASE_URL;

export const SITE = {
  name: 'Serialbench',
  tagline: 'serialization benchmarks · measurement console',
  repoUrl: 'https://github.com/serialbench/serialbench',
  footer: 'serialbench · automated weekly runs',
  disclaimer: 'microbenchmarks indicate, they do not decide',
};

export const NAV = [
  { label: 'Dashboard', href: BASE },
  { label: 'Methodology', href: `${BASE}methodology/` },
];
