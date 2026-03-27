import '../models/User.model'
import '../models/Provider.model'
import '../models/Card.model'
import '../models/BalanceCheck.model'
import "../models/FinanceDataset.model.js";
import mongoose from 'mongoose'

export const ensureCollections = async () => {
  const models = mongoose.models

  for (const modelName of Object.keys(models)) {
    const model = models[modelName]
    await model.init() // indexes + collection
    console.log(`📦 ${modelName} collection ready`)
  }
}
