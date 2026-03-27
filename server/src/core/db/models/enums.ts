export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  OPERATOR = 'OPERATOR'
}

export enum ProviderType {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ACH = 'ACH',
  SEPA = 'SEPA',
  CRYPTO = 'CRYPTO'
}

export enum ProviderEnvironment {
  TEST = 'TEST',
  LIVE = 'LIVE'
}

export enum CardBrand {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
  DISCOVER = 'DISCOVER',
  TROY='TROY'
}

export enum CardType {
  CREDIT = 'CREDIT',
DEBIT = 'DEBIT',
  PREPAID = 'PREPAID'
}

export enum CardFormFactor {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL'
}
