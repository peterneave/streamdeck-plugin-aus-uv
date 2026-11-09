// UV index categories, with upper bounds exclusive so decimal readings
// round into the same band as the ARPANSA whole-number scale.
export const UV_CATEGORIES = [
  { label: "Low", max: 2.5, colour: "#d4f2bc" },
  { label: "Moderate", max: 5.5, colour: "#f9f5c2" },
  { label: "High", max: 7.5, colour: "#fde1bf" },
  { label: "Very High", max: 10.5, colour: "#f2b8bf" },
  { label: "Extreme", max: Infinity, colour: "#e0dbf9" },
];

const TEXT_COLOUR = "#1f2d3d";

export function getUvCategory(uv) {
  const value = Math.max(0, Number(uv) || 0);
  return UV_CATEGORIES.find((category) => value < category.max);
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildUvKeySvg(uv) {
  const category = getUvCategory(uv);
  const value = escapeXml(uv);
  const valueFontSize = value.length > 3 ? 48 : 60;

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">',
    `<rect width="144" height="144" fill="${category.colour}"/>`,
    `<text x="72" y="34" font-size="22" font-weight="bold" text-anchor="middle" fill="${TEXT_COLOUR}" font-family="Arial, Helvetica, sans-serif">UV</text>`,
    `<text x="72" y="94" font-size="${valueFontSize}" font-weight="bold" text-anchor="middle" fill="${TEXT_COLOUR}" font-family="Arial, Helvetica, sans-serif">${value}</text>`,
    `<text x="72" y="128" font-size="20" text-anchor="middle" fill="${TEXT_COLOUR}" font-family="Arial, Helvetica, sans-serif">${escapeXml(category.label)}</text>`,
    "</svg>",
  ].join("");
}

export function buildUvKeyImage(uv) {
  return `data:image/svg+xml;base64,${Buffer.from(buildUvKeySvg(uv)).toString("base64")}`;
}
