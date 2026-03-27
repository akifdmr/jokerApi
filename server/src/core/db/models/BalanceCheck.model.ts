import { Schema, model, Types } from 'mongoose'

const BalanceCheckSchema = new Schema(
  {
    card: {
      type: Types.ObjectId,
      ref: 'Card',
      required: true,
      index: true
    },

    provider: {
      type: Types.ObjectId,
      ref: 'Provider'
    },

    balance: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: 'USD'
    },

    responseRaw: {
      type: Schema.Types.Mixed
    },

    success: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

export const BalanceCheckModel = model(
  'BalanceCheck',
  BalanceCheckSchema
)
