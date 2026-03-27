// mock/MockPos.ts
export interface MockPosResult {
  success: boolean;
  responseCode: string;
  message: string;
  authCode?: string;
}

export class MockPOS {
  constructor(private readonly cardLimit: number) {}

  async charge(amount: number): Promise<MockPosResult> {
    await this.simulateNetwork();

    if (amount <= this.cardLimit) {
      return {
        success: true,
        responseCode: "00",
        message: "APPROVED",
        authCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      };
    }

    return {
      success: false,
      responseCode: "51",
      message: "INSUFFICIENT FUNDS",
    };
  }

  private async simulateNetwork() {
    await new Promise((r) => setTimeout(r, 200));
  }
}
