export interface CoreCard {
  pan: string
  expMonth: number
  expYear: number
  cvv?: string
}

export interface Authorizer {
  authorize(
    number: string,
    amount: number,
    card: CoreCard
  ): Promise<{
    status: string
    authorizationId?: string
    raw?: any
  }>

  voidAuthorization?(authorizationId: string): Promise<void>
}

export type CheckStatus = "yes" | "no" | "unknown"
