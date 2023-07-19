import { useContext, useEffect, useState } from 'react';
import { AmountSelection, WalletInteractionStep } from '../../../components/index.js';
import { Field, FieldStatus, TxProgressStep, FormWarning } from '../../../ui-components/index.js';
import { RegisterForm } from '../../../alt-model/forms/register/register_form_hooks.js';
import { RegisterFormFlowRunnerState } from '../../../alt-model/forms/register/register_form_flow_runner_hooks.js';
import { TopLevelContext } from '../../../alt-model/top_level_context/top_level_context.js';
import { TxGasSection } from './modals/sections/gas_section/index.js';
import { getRegisterToast } from '../../toasts/toast_configurations.js';
import { useWalletInteractionIsOngoing } from '../../../alt-model/wallet_interaction_hooks.js';
import { Amount } from '../../../alt-model/assets/amount.js';
import { AssetValue } from '@polyaztec/sdk';
import { useSdk } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import { useAsset } from '../../../alt-model/asset_hooks.js';
import style from './register_account_form.module.scss';
import { useRemoteAssets } from '../../../alt-model/top_level_context/top_level_context_hooks.js';

export type KeyType = 'account' | 'spending';
export type PhaseType = 'idle' | 'signer-select' | 'awaiting-signature';

interface RegisterAccountFormProps {
  registerForm: RegisterForm;
  locked: boolean;
  runnerState: RegisterFormFlowRunnerState;
  onResetRunner: () => void;
  onRetry: () => Promise<void>;
  onCancel: () => void;
}

function getAliasFieldStatus(alias: string, aliasFeedback?: string, checkingAlias?: boolean, aliasFee?: AssetValue) {
  const aliasHasFeedback = aliasFeedback && aliasFeedback.length > 0;

  if (checkingAlias) {
    return FieldStatus.Loading;
  }

  if (aliasHasFeedback) {
    return FieldStatus.Error;
  }

  if (aliasFee && aliasFee.value > 0n) {
    return FieldStatus.Info;
  }

  if (alias.length > 0) {
    return FieldStatus.Success;
  }
}

function getInteractionItem(runnerState: RegisterFormFlowRunnerState) {
  const { flowState } = runnerState;
  if (runnerState.error) {
    return {
      interactionStep: WalletInteractionStep.Error,
    };
  }

  switch (flowState?.phase) {
    case 'creating-proof':
      return {
        step: TxProgressStep.PROVING,
        interactionStep: WalletInteractionStep.CreatingProof,
      };
    case 'deposit-and-sign':
      return {
        step: TxProgressStep.SIGNING_L1_DEPOSIT,
        interactionStep: WalletInteractionStep.L1DepositAndSignInteractions,
      };
    case 'sending-proof':
      return {
        step: TxProgressStep.SIGNING_L1_DEPOSIT,
        interactionStep: WalletInteractionStep.SendingProof,
      };
    case 'done':
      return {
        step: TxProgressStep.DONE,
        interactionStep: WalletInteractionStep.Done,
      };
  }
}

export function RegisterAccountForm(props: RegisterAccountFormProps) {
  const sdk = useSdk();
  const { fields, setters, feedback, assessment, resources, locked } = props.registerForm;
  const { walletInteractionToastsObs } = useContext(TopLevelContext);
  const walletInteractionIsOngoing = useWalletInteractionIsOngoing();
  const assets = useRemoteAssets();

  const feeAmount = fields.speed !== null ? resources.feeAmounts?.[fields.speed] : undefined;
  const pendingAmount = resources.l1PendingBalance
    ? new Amount(resources.l1PendingBalance, resources.depositAsset)
    : undefined;

  const [aliasFeeMessage, setAliasFeeMessage] = useState(null);

  useEffect(() => {
    const interactionItem = getInteractionItem(props.runnerState);
    if (interactionItem) {
      const toastItem = getRegisterToast(
        props.onRetry,
        props.onCancel,
        props.onResetRunner,
        walletInteractionToastsObs,
        props.runnerState,
        interactionItem,
      );

      walletInteractionToastsObs.addOrReplaceToast(toastItem);
      return () => walletInteractionToastsObs.removeToastByKey(toastItem.key);
    }
  }, [props.onRetry, props.onResetRunner, props.onCancel, walletInteractionToastsObs, props.runnerState]);

  useEffect(() => {
    if (!resources || !resources.aliasFee) return;

    if (resources.aliasFee.value == 0) {
      setAliasFeeMessage(null);
      return;
    }

    const asset = assets[resources.aliasFee.assetId].symbol;
    const feeReadable = sdk?.fromBaseUnits(resources.aliasFee);
    setAliasFeeMessage(
      `Additional ${feeReadable} ${asset} fee to register a ${resources.alias.length} character alias`,
    );
  }, [resources]);

  const handleUsePendingFunds = () => {
    if (!pendingAmount || fields.speed === null || !feeAmount) return;
    const pendingAmountMinusFee = pendingAmount.subtract(feeAmount?.baseUnits);
    setters.depositValueStrOrMax(
      pendingAmountMinusFee.format({
        layer: 'L1',
        uniform: true,
        hideSymbol: true,
        hideComma: true,
      }),
    );
  };

  return (
    <div className={style.registerAccountForm}>
      <Field
        label="Pick an alias"
        sublabel={
          <>
            Choose an alias in place of your account key so other users can find you more easily.{' '}
            <span style={{ fontWeight: 450 }}>
              Warning: Aliases must not contain special characters or uppercase letters!
            </span>
          </>
        }
        value={fields.alias}
        onChangeValue={(value: string) => setters.alias(value)}
        disabled={locked || walletInteractionIsOngoing}
        placeholder="@username"
        prefix="@"
        message={feedback.alias ? feedback.alias : aliasFeeMessage}
        status={getAliasFieldStatus(fields.alias, feedback.alias, resources.checkingAlias, resources.aliasFee)}
      />
      <TxGasSection
        speed={fields.speed}
        onChangeSpeed={setters.speed}
        feeAmounts={resources.feeAmounts}
        disabled={locked}
        label={'Select a speed for your registration'}
        balanceType="L1"
        asset={resources.depositAsset}
        targetAssetIsErc20={fields.depositAssetId !== 0}
      />
      <AmountSelection
        label={'Make your first deposit (Optional)'}
        sublabel={'Take advantage of your registration transaction fee and make a feeless deposit'}
        maxAmount={assessment.balances?.info.maxL2Output ?? 0n}
        asset={resources.depositAsset}
        feeAmount={feeAmount}
        allowWalletSelection={true}
        amountStringOrMax={fields.depositValueStrOrMax}
        disabled={locked}
        allowAssetSelection={true}
        onChangeAsset={setters.depositAssetId}
        message={feedback.deposit}
        onChangeAmountStringOrMax={setters.depositValueStrOrMax}
        balanceType={'L1'}
      />
      {feedback.amount && <FormWarning text={feedback.amount} />}
      {feedback.walletAccount && <FormWarning text={feedback.walletAccount} />}
      {feedback.footer && <FormWarning text={feedback.footer} />}
      {feedback.pendingFunds && (
        <FormWarning
          text={
            <span className={style.pendingFundsFooter}>
              {feedback.pendingFunds}{' '}
              <span onClick={handleUsePendingFunds} className={style.usePendingFunds}>
                Click here to use it.
              </span>
            </span>
          }
        />
      )}
    </div>
  );
}
