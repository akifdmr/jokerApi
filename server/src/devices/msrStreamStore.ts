export interface MSRStreamItem {
  provider: string;
  devicePath: string;
  byteLength: number;
  rawBase64: string;
  readAt: string;
}

const MAX_ITEMS = 20;
const buffer: MSRStreamItem[] = [];

export function pushMSRStream(item: MSRStreamItem) {
  buffer.unshift(item);
  if (buffer.length > MAX_ITEMS) {
    buffer.pop();
  }
}

export function getMSRStream() {
  return buffer;
}
