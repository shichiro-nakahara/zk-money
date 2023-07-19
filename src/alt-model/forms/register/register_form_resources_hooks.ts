import { useUserIdForRegistrationStr } from '../../alias_hooks.js';
import { useL1DepositResources } from '../l1_deposit/l1_deposit_resources_hooks.js';
import { RegisterFormResources } from './assess_register_form.js';
import { useRegistrationFeeAmounts } from './register_form_fees_hooks.js';
import { RegisterFormFields } from './register_form_fields.js';

export function useRegisterFormResources(fields: RegisterFormFields): RegisterFormResources {
  const feeAmounts = useRegistrationFeeAmounts(fields.depositAssetId);
  const l1DepositResources = useL1DepositResources(fields, feeAmounts, true);
  const { alias, spendingKeys, accountKeys, confirmationAccountKeys, depositAssetId } = fields;
  const aliasResult = useUserIdForRegistrationStr(alias, depositAssetId, 200);
  const checkingAlias = aliasResult.isLoading;
  const aliasAlreadyTaken = !!aliasResult.isRegistered;
  const aliasFee = aliasResult.aliasFee;
  return {
    ...l1DepositResources,
    accountKeys,
    confirmationAccountKeys,
    alias,
    checkingAlias,
    aliasAlreadyTaken,
    spendingKeys,
    feeAmounts,
    aliasFee,
  };
}
