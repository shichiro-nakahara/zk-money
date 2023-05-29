import { TxSettlementTime } from '@polyaztec/sdk';
import { StrOrMax } from '../constants.js';
import { configuration } from '../../../config.js';

export interface L1DepositFormFields {
  depositAssetId: number;
  depositValueStrOrMax: StrOrMax;
  speed: TxSettlementTime | null;
}

export const INTIAL_L1_DEPOSIT_FORM_FIELDS: L1DepositFormFields = {
  depositAssetId: configuration.defaultRegisterAssetId,
  depositValueStrOrMax: '',
  speed: null,
};
