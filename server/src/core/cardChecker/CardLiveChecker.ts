import { Authorizer, CoreCard } from "./types.js"

export class CardLiveChecker {
  constructor(private authorizer: Authorizer) {}

  async checkCardLive(card: CoreCard, probeAmount = 0.1) {
    try {
      const res = await this.authorizer.authorize(card.pan, probeAmount, card)

      const ok =
        res.status.toLowerCase().includes("approve") ||
        res.status === "approved"

      if (ok && res.authorizationId && this.authorizer.voidAuthorization) {
        await this.authorizer.voidAuthorization(res.authorizationId)
      }

      return {
        live: ok,
        authorizationId: res.authorizationId ?? null,
        raw: res.raw
      }
    } catch (e) {
      return {
        maxAuthorizedAmount: 0,
        live: false,
        error: "authorization_failed"
      }
    }
  }
}
