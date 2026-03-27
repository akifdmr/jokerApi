
// src/core/msr/trackParser.ts
export function parseTrack(raw: string) {
  // Track 1
  if (raw.startsWith("%B")) {
    const [, pan, name, exp] =
      raw.match(/%B(\d+)\^([^^]+)\^(\d{4})/) || [];
    return { pan, name, exp, trackType: 1 };
  }

  // Track 2
  if (raw.startsWith(";")) {
    const [, pan, exp] =
      raw.match(/;(\d+)=(\d{4})/) || [];
    return { pan, exp, trackType: 2 };
  }

  return null;
}

export function maskPan(pan: string) {
  return pan.slice(0, 6) + "******" + pan.slice(-4);
}
