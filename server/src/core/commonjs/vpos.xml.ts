// vpos.xml.js
export function buildXML(body) {
  return `
<VposRequest>
  ${Object.entries(body)
    .map(([k, v]) => `<${k}>${v}</${k}>`)
    .join("")}
</VposRequest>
`.trim();
}
