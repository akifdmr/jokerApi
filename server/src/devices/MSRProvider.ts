export interface MSRProvider {
  readonly name: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  onRead(callback: (data: Buffer) => void): void;
}
