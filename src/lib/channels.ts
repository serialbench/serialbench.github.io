// Channel assignment: every serializer keeps one color everywhere on the site
// (bars, chart strokes, availability dots), like scope channels on a bench
// instrument. Single source of truth — components import from here.
export const CHANNELS: Record<string, string> = {
  leptris: '#5fd4e8',
  nokogiri: '#f5a623',
  ox: '#e85d9e',
  oga: '#9b8cff',
  rexml: '#77879e',
  'libxml-ruby': '#d97b4a',
  oj: '#6ee7a0',
  json: '#b8c4d0',
  rapidjson: '#7be0d3',
  yajl: '#e8c56a',
  psych: '#c9a0dc',
  syck: '#8c7ae0',
  'toml-rb': '#e88b6a',
  tomlib: '#6ab0e8',
  tomlrb: '#d4e87b',
  'yeptris-yaml': '#4ec9b0',
  'yeptris-json': '#569cd6',
  'yeptris-cbor': '#c586c0',
  teptris: '#ce9178',
  // C field
  'libxml2': '#c45b4b',
  libxslt: '#b0653a',
  jansson: '#e8926a',
  'json-c': '#d4a25e',
  'nlohmann-json': '#8fc97b',
  simdjson: '#5ee07b',
  pugixml: '#e8d44d',
  libyaml: '#a89078',
  rapidyaml: '#e07b5e',
  tomlc17: '#a06ee0',
  libcbor: '#6ab0c9',
  tinycbor: '#7bd48f',
  cbor: '#e09b6a',
  cbor2: '#e0b06a',
  'leptris-whatwg': '#3aa8c1',
};

export function channelColor(serializer: string): string {
  return CHANNELS[serializer] ?? '#8fa3bf';
}
