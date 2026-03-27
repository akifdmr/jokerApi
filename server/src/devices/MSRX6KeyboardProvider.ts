import readline from "readline";
import { MSRProvider } from "./MSRProvider.js";

export class MSRX6KeyboardProvider implements MSRProvider {
  readonly name = "msr-x6-keyboard";

  private rl?: readline.Interface;
  private onReadCb?: (data: Buffer) => void;

  async connect(): Promise<void> {
    this.rl = readline.createInterface({
      input: process.stdin,
      crlfDelay: Infinity
    });

    this.rl.on("line", (line) => {
      if (!line.trim()) return;
      if (this.onReadCb) {
        this.onReadCb(Buffer.from(line, "utf8"));
      }
    });

    console.log("✅ MSR X6 keyboard wedge mode listening (stdin)");
  }

  async disconnect(): Promise<void> {
    this.rl?.close();
  }

  onRead(callback: (data: Buffer) => void): void {
    this.onReadCb = callback;
  }
}
