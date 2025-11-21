// src/core/SimulatedAuthorizer.ts
import { Authorizer, CoreCard, CoreAuthorizeResponse } from "./types.js";

export class SimulatedAuthorizer implements Authorizer {
  async authorize(amount: number, card: CoreCard): Promise<CoreAuthorizeResponse> {
    // burada istediğin logic ile approve/decline simulate edebilirsin
    const limit = 25000; // example: kart limiti 25K
    const approved = amount <= limit;

    return {
      status: approved ? "approved" : "declined",
      authorizationId: approved ? this.generateAuthId() : null,
      raw: { simulated: true, limit, attemptAmount: amount },
    };
  }

  async voidAuthorization(authorizationId: string): Promise<void> {
    // gerçek provider'da buraya /void veya /cancel çağrısı gelir
    console.log("Simulated void of auth:", authorizationId);
  }

  private generateAuthId() {
    return "auth_" + Math.random().toString(36).slice(2, 10);
  }
}
