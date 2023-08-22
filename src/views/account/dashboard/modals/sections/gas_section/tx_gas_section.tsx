import moment from 'moment';
import { TxSettlementTime } from '@polyaztec/sdk';
import { FeeSelector, FeeSelectorStatus } from '../../../../../../ui-components/index.js';
import { useAmountBulkPrice, useRollupProviderStatus } from '../../../../../../alt-model/index.js';
import { estimateTxSettlementTimes } from '../../../../../../alt-model/estimate_settlement_times.js';
import { RemoteAsset } from '../../../../../../alt-model/types.js';
import { Amount } from '../../../../../../alt-model/assets/index.js';
import { formatBulkPrice } from '../../../../../../app/index.js';
import { useL1BalanceIndicator, useL2BalanceIndicator } from '../amount_section/mini_balance_indicators.js';
import { useWalletInteractionIsOngoing } from '../../../../../../alt-model/wallet_interaction_hooks.js';
import { SendMode } from '../../../../../../alt-model/send/send_mode.js';
import { useEffect, useState } from 'react';
import { useSdk } from '../../../../../../alt-model/top_level_context/top_level_context_hooks.js';

type BalanceType = 'L1' | 'L2';

interface TxGasSectionProps {
  speed: TxSettlementTime | null;
  asset: RemoteAsset;
  balanceType: BalanceType;
  label?: string;
  targetAssetIsErc20?: boolean;
  disabled?: boolean;
  feeAmounts?: (Amount | undefined)[] | undefined[];
  onChangeSpeed: (speed: TxSettlementTime) => void;
  sendMode: SendMode
}

function getParams(
  label: string,
  expectedTimeOfSettlement?: Date,
  feeAmount?: Amount,
  feeBulkPrice?: bigint,
  deductionIsFromL1?: boolean,
) {
  const timeStr = expectedTimeOfSettlement ? moment(expectedTimeOfSettlement).fromNow(true) : '';
  const feeAmountStr = feeAmount?.format({ layer: deductionIsFromL1 ? 'L1' : 'L2' });
  const feeBulkPriceStr = feeBulkPrice !== undefined ? `$${formatBulkPrice(feeBulkPrice)}` : undefined;
  return { label, timeStr, feeAmountStr, feeBulkPrice, feeBulkPriceStr };
}

export function TxGasSection(props: TxGasSectionProps) {
  const sdk = useSdk();
  const { speed, onChangeSpeed, feeAmounts, disabled } = props;
  const rollupProviderStatus = useRollupProviderStatus();
  const walletInteractionIsOngoing = useWalletInteractionIsOngoing();
  const feeBulkPriceNextRollup = useAmountBulkPrice(feeAmounts?.[TxSettlementTime.NEXT_ROLLUP]);
  const feeBulkPriceInstant = useAmountBulkPrice(feeAmounts?.[TxSettlementTime.INSTANT]);
  const { instantSettlementTime, nextSettlementTime } = estimateTxSettlementTimes(rollupProviderStatus);
  const [surgeStatus, setSurgeStatus] = useState({pendingTxCount: 0, multiplier: 1});

  const l1Balance = useL1BalanceIndicator(props.asset);
  const l2Balance = useL2BalanceIndicator(props.asset);

  useEffect(() => {
    async function update() {
      setSurgeStatus(await sdk?.getSurgeStatus());
    }
    update();
  }, [feeAmounts]);

  const options = [
    {
      id: TxSettlementTime.NEXT_ROLLUP,
      content: getParams(
        'Default speed: ~7 hrs',
        nextSettlementTime,
        feeAmounts?.[TxSettlementTime.NEXT_ROLLUP],
        feeBulkPriceNextRollup,
        props.balanceType === 'L1',
      ),
    },
    // {
    //   id: TxSettlementTime.INSTANT,
    //   content: getParams(
    //     'Fastest speed',
    //     instantSettlementTime,
    //     feeAmounts?.[TxSettlementTime.INSTANT],
    //     feeBulkPriceInstant,
    //     props.balanceType === 'L1',
    //   ),
    // },
  ];

  if (props.sendMode === SendMode.WIDTHDRAW) {
    options.push({
      id: TxSettlementTime.INSTANT,
      content: getParams(
        'Fastest speed',
        instantSettlementTime,
        feeAmounts?.[TxSettlementTime.INSTANT],
        feeBulkPriceInstant,
        props.balanceType === 'L1',
      ),
    })
  }

  return (
    <FeeSelector
      placeholder={'Select a speed'}
      label={props.label || 'Select a speed for your transaction'}
      sublabel={`There are several options to choose from, depending on your budget`}
      value={speed}
      disabled={disabled || walletInteractionIsOngoing}
      options={options}
      status={speed !== null ? FeeSelectorStatus.Success : undefined}
      balance={props.balanceType === 'L1' ? l1Balance : l2Balance}
      onChangeValue={onChangeSpeed}
      surgeMultiplier={surgeStatus.multiplier}
    />
  );
}
