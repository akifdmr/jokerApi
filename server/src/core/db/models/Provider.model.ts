import { Schema, model } from 'mongoose'
import { ProviderType, ProviderEnvironment } from './enums.js'

const ProviderSchema = new Schema(
  {
    providerName: {
      type: String,
      required: true,
      unique: true
    },

    providerType: {
      type: String,
      enum: Object.values(ProviderType),
      required: true
    },

    environment: {
      type: String,
      enum: Object.values(ProviderEnvironment),
      default: ProviderEnvironment.TEST
    },

    appUrl: String,

    credentials: {
      apiKey: String,
      apiSecret: String,
      extra: Schema.Types.Mixed
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

export const ProviderModel = model('Provider', ProviderSchema)
