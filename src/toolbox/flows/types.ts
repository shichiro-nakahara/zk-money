import type { GrumpkinAddress } from '@polyaztec/sdk';

export type KeyPair = { privateKey: Buffer; publicKey: GrumpkinAddress };
export type RegistrationKeys = { accountKeys: KeyPair; spendingKeys: KeyPair };
