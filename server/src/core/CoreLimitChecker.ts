// src/core/CoreLimitChecker.ts
import { Authorizer, CoreCard, CoreAuthorizeResponse, AttemptResult, LimitCheckResult } from "./types.js";
import { upsertCard, insertCardLimit } from "./db.js";
import { Logger } from "./Logger.js";

export class CoreLimitChecker {
  constructor(private authorizer: Authorizer) {}

  private mapStatus(status: string): CoreAuthorizeResponse["status"] {
    const s = (status || "").toLowerCase();
    if (s.includes("approve")) return "approved";
    if (s.includes("decline")) return "declined";
    if (s.includes("timeout")) return "timeout";
    if (s === "approved" || s === "declined" || s === "timeout" || s === "error") {
      return s as any;
    }
    return "error";
  }

  /**
   * Limit kontrol algoritması:
   *
   * 1) 0.1 ile probe
   * 2) 5000'den başlayıp exponential up / down
   * 3) Binary refine
   * 4) Her yeni başarılı auth'ta bir önceki başarılı auth void edilir
   * 5) En sonda sadece son auth canlı kalır
   */
  async checkCardLimit(card: CoreCard): Promise<LimitCheckResult> {
    const attempts: AttemptResult[] = [];
    let lastApprovedAuthId: string | null = null;

    const attempt = async (amount: number): Promise<AttemptResult> => {
      const resp = await this.authorizer.authorize(amount, card);
      const status = this.mapStatus(resp.status);

      // Eğer yeni approval geldiyse önceki approval'ı iptal et
      if (status === "approved" && resp.authorizationId) {
        if (lastApprovedAuthId && this.authorizer.voidAuthorization) {
          try {
            await this.authorizer.voidAuthorization(lastApprovedAuthId);
          } catch (err) {
            // burada log atabilirsin
            console.warn("Failed to void previous authorization:", err);
          }
        }
        lastApprovedAuthId = resp.authorizationId;
      }

      const record: AttemptResult = {
        attempt: attempts.length + 1,
        amountTried: amount,
        status,
        authorizationId: resp.authorizationId ?? null,
        success: status === "approved",
        raw: resp.raw,
      };

      attempts.push(record);
      return record;
    };

    // 1) küçük probe
    const small = await attempt(0.1);
    if (small.status !== "approved") {
      // Kart ölü veya kullanılamaz
      await this.persistResult(card, 0, attempts);
      return {
        success: false,
        maxAuthorizedAmount: 0,
        attempts,
        finalAuthorizationId: null,
      };
    }

    // 2) exponential search + 3) binary search
    let lower = 0.1;
    let upper: number | null = null;
    let candidate = 5000;
    let maxApproved = 0;

    let res = await attempt(candidate);

    if (res.status === "approved") {
      lower = candidate;
      maxApproved = candidate;

      // yukarı doğru
      while (candidate < 1_000_000) {
        candidate *= 2;
        res = await attempt(candidate);

        if (res.status === "approved") {
          lower = candidate;
          maxApproved = candidate;
        } else if (res.status === "declined") {
          upper = candidate;
          break;
        } else {
          // error / timeout
          break;
        }
      }
    } else if (res.status === "declined") {
      upper = candidate;

      // aşağı doğru, 1'e kadar
      while (candidate > 1) {
        candidate = Math.floor(candidate / 2);
        res = await attempt(candidate);

        if (res.status === "approved") {
          lower = candidate;
          maxApproved = candidate;
          break;
        }
        if (candidate <= 1) break;
      }
    }

    // Binary refine
    if (upper !== null) {
      while (upper - lower > 1) {
        const mid = Math.ceil((lower + upper) / 2);
        res = await attempt(mid);

        if (res.status === "approved") {
          lower = mid;
          maxApproved = Math.max(maxApproved, mid);
        } else if (res.status === "declined") {
          upper = mid;
        } else {
          // timeout / error → çık
          break;
        }
      }
    }

    const finalMax = Math.max(0, maxApproved);

    // DB'ye yaz
    await this.persistResult(card, finalMax, attempts);

    return {
      success: finalMax > 0,
      maxAuthorizedAmount: finalMax,
      attempts,
      finalAuthorizationId: lastApprovedAuthId,
    };
  }

  /**
   * Kart ve limit sonucunu MySQL'e yaz
   */
  private async persistResult(card: CoreCard, maxLimit: number, attempts: AttemptResult[]) {
    // %20 payı db helper içinde hesaplıyoruz
    const cardId = await upsertCard(
      card.pan,
      card.expMonth,
      card.expYear,
      card.cvv,
      card.balance,
      20, // yüzde 20
    );

    await insertCardLimit(cardId, maxLimit, attempts, "USD");
  }
}
