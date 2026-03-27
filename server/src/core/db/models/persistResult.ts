import { CardModel } from "../models/Card.model.js";
import { CardLimitCheckModel } from "../models/CardLimitCheck.model.js";
import { CardLimitAttemptModel } from "../models/CardLimitAttempt.model.js";
import crypto from "crypto";

type CoreCard = {
  pan: string;
  expMonth: number | string;
  expYear: number | string;
  balance?: number | null;
};

type AttemptResult = {
  attempt: number;
  amountTried: number;
  status: string;
  authorizationId?: string | null;
  success: boolean;
  raw?: any;
};

const hash = (v: string) =>
  crypto.createHash("sha256").update(v).digest("hex");

export const persistLimitResult = async (
  card: CoreCard,
  maxLimit: number,
  attempts: AttemptResult[],
  finalAuthId: string | null
) => {
  const panHash = hash(`${card.pan}-${card.expMonth}-${card.expYear}`);

  const cardDoc = await CardModel.findOneAndUpdate(
    { panHash },
    {
      expMonth: card.expMonth,
      expYear: card.expYear,
      lastKnownBalance: card.balance,
      safetyMarginPercent: 20
    },
    { upsert: true, new: true }
  );

  const limitCheck = await CardLimitCheckModel.create({
    card: cardDoc._id,
    maxAuthorizedAmount: maxLimit,
    currency: "USD",
    success: maxLimit > 0,
    finalAuthorizationId: finalAuthId
  });

  await CardLimitAttemptModel.insertMany(
    attempts.map((a) => ({
      limitCheck: limitCheck._id,
      attemptNumber: a.attempt,
      amountTried: a.amountTried,
      status: a.status,
      authorizationId: a.authorizationId,
      success: a.success,
      rawResponse: a.raw
    }))
  );
};
