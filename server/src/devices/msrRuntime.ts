import { MSRX6KeyboardProvider } from "./MSRX6KeyboardProvider.js";
import { logCardRead } from "../logger/cardReadLogger.js";
import { pushMSRStream } from "./msrStreamStore.js";

let started = false;

export async function startMSRRuntime() {
  if (started) return;
  started = true;

  const provider = new MSRX6KeyboardProvider();
  await provider.connect();

  provider.onRead(async (buffer) => {
    await logCardRead({
      provider: provider.name,
      devicePath: "keyboard-wedge",
      rawBuffer: buffer
    });

    pushMSRStream({
      provider: provider.name,
      devicePath: "keyboard-wedge",
      byteLength: buffer.length,
      rawBase64: buffer.toString("base64"),
      readAt: new Date().toISOString()
    });

    console.log("📥 MSR swipe captured (keyboard mode)");
  });

  console.log("🎯 MSR keyboard runtime started");
}
