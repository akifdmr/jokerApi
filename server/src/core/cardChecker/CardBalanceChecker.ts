import { CoreCard, Authorizer } from "./types.js"
import { CardLiveChecker } from "./CardLiveChecker.js"

export class CardBalanceChecker {
  constructor(private authorizer: Authorizer) {}

  async check(card: CoreCard) {
    const liveChecker = new CardLiveChecker(this.authorizer)
    const live = await liveChecker.checkCardLive(card)

    return {
      attempts: "",
      maxAuthorizedAmount: live.maxAuthorizedAmount,
      canAuthorize: live.live,
      canBalanceCheck: live.live,
      canCaptureLater: live.live,
      supportsVoid: !!this.authorizer.voidAuthorization
    }
  }
}
