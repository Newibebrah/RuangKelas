export const kasKeys = { all: (roomId: string) => ['kas', roomId] as const }
export const txKeys = { all: (roomId: string) => ['transactions', roomId] as const }
export const billingKeys = {
  bill: (roomId: string) => ['bills', roomId] as const,
  periods: (billId: string) => ['paymentPeriods', billId] as const,
  payments: (billId: string) => ['payments', billId] as const,
}
export const assignmentsKeys = { all: (roomId: string) => ['assignments', roomId] as const }
export const pengurusKeys = { all: (roomId: string) => ['pengurus', roomId] as const }
export const membersKeys = { all: (roomId: string) => ['members', roomId] as const }
export const walletKeys = { all: (roomId: string) => ['wallets', roomId] as const }
