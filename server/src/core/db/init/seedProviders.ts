import { ProviderModel } from "../models/Provider.model.js";
import { ProviderType, ProviderEnvironment } from "../models/enums.js";

export const seedProviders = async () => {
  const count = await ProviderModel.countDocuments()
  if (count > 0) return

  await ProviderModel.insertMany([
    {
      providerName: 'PayPal',
      providerType: ProviderType.CARD,
      environment: ProviderEnvironment.TEST
    },
    {
      providerName: 'Square',
      providerType: ProviderType.CARD,
      environment: ProviderEnvironment.TEST
    },
    {
      providerName: 'SEPA',
      providerType: ProviderType.SEPA,
      environment: ProviderEnvironment.TEST
    },
    {
      providerName: 'Whop',
      providerType: ProviderType.CARD,
      environment: ProviderEnvironment.TEST
    }
  ])

  console.log('🏦 Providers seeded')
}
