import {
  AssetValue,
  DepositController,
  EthAddress,
  MigrateAccountController,
  RegisterController,
} from '@polyaztec/sdk';
import {
  EnforcedRetryableSignFlowState,
  enforcedRetryableSignFlow,
} from '../../../toolbox/flows/enforced_retryable_sign_flow.js';
import { Emit, ThrowIfCancelled } from '../../../toolbox/flows/flows_utils.js';
import { ActiveChainIdObs } from '../../active_wallet_hooks.js';
import { ActiveSignerObs } from '../../defi/defi_form/correct_provider_hooks.js';

export type L1DepositAndSignFlowState =
  | { phase: 'idle'; assetId: number }
  | { phase: 'checking-pending-funds'; assetId: number }
  | {
      phase: 'awaiting-l1-approve-signature';
      requiredFunds: AssetValue;
      enforcedRetryableSignFlow: EnforcedRetryableSignFlowState;
      assetId: number;
    }
  | {
      phase: 'awaiting-l1-deposit-signature';
      requiredFunds: AssetValue;
      enforcedRetryableSignFlow: EnforcedRetryableSignFlowState;
      assetId: number;
    }
  | { phase: 'awaiting-l1-deposit-settlement'; assetId: number }
  | {
      phase: 'awaiting-proof-signature';
      messageToSign: string;
      enforcedRetryableSignFlow: EnforcedRetryableSignFlowState;
      assetId: number;
    };

type L1PayableController = RegisterController | DepositController | MigrateAccountController;

export async function l1DepositAndSignFlow(
  emitState: Emit<L1DepositAndSignFlowState>,
  throwIfCancelled: ThrowIfCancelled,
  controller: L1PayableController,
  activeSignerObs: ActiveSignerObs,
  depositorEthAddress: EthAddress,
  requiredChainId: number,
  activeChainIdObs: ActiveChainIdObs,
) {
  const assetId = controller.assetValue.assetId;
  emitState({ phase: 'checking-pending-funds', assetId });
  const requiredFundsBaseUnits = await throwIfCancelled(controller.getRequiredFunds());

  if (requiredFundsBaseUnits) {
    const requiredFunds: AssetValue = { assetId: assetId, value: requiredFundsBaseUnits };

    if (assetId != 0) {
      const allowance: bigint = await throwIfCancelled(controller.getPublicAllowance());
      if (allowance < <bigint>requiredFundsBaseUnits) {
        // Approve
        await enforcedRetryableSignFlow(
          enforcedRetryableSignFlow => {
            emitState({ phase: 'awaiting-l1-approve-signature', requiredFunds, enforcedRetryableSignFlow, assetId });
          },
          throwIfCancelled,
          () => controller.approve(),
          activeSignerObs,
          depositorEthAddress,
          requiredChainId,
          activeChainIdObs,
        );
      }
    }

    await enforcedRetryableSignFlow(
      enforcedRetryableSignFlow => {
        emitState({ phase: 'awaiting-l1-deposit-signature', requiredFunds, enforcedRetryableSignFlow, assetId });
      },
      throwIfCancelled,
      () => controller.depositFundsToContract(),
      activeSignerObs,
      depositorEthAddress,
      requiredChainId,
      activeChainIdObs,
    );

    emitState({ phase: 'awaiting-l1-deposit-settlement', assetId });
    await throwIfCancelled(controller.awaitDepositFundsToContract());
  }

  const signingData = controller.getSigningData();
  if (!signingData) throw new Error('Signing data unavailable');
  const messageToSign = new TextDecoder().decode(signingData);
  await enforcedRetryableSignFlow(
    enforcedRetryableSignFlow => {
      emitState({ phase: 'awaiting-proof-signature', messageToSign, enforcedRetryableSignFlow, assetId });
    },
    throwIfCancelled,
    () => controller.sign(),
    activeSignerObs,
    depositorEthAddress,
    requiredChainId,
    activeChainIdObs,
  );
}
