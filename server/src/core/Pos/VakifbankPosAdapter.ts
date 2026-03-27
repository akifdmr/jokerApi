// pos/VakifbankPosAdapter.ts
import { PosAdapter } from "./PosAdapter.js";
import { VakifbankVposClient } from "./VakifbankVposClient.js";
import { CardInfo } from "../types/vpos.types.js";

export class VakifbankPosAdapter implements PosAdapter {
  constructor(
    private readonly client: VakifbankVposClient,
    private readonly card: CardInfo
  ) {}

  async preAuth(amount: number, orderId: string) {
    return this.client.preAuth(orderId, amount, this.card);
  }
}
