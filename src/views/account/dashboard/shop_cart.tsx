import { useEffect, useState } from 'react';
import { SendComposerPayload, SendComposerPhase, SendComposerState, SendFormDerivedData, SendMode } 
  from '../../../alt-model/send/index.js';
import { RemoteAsset } from '../../../alt-model/types.js';
import { SendConfirmationPage } from './modals/send_modal/send_confirmation_page.js';
import { GrumpkinAddress, TxSettlementTime } from '@polyaztec/sdk';
import { Recipient, SendComposer } from '../../../alt-model/send/send_form_composer.js';
import { Amount } from '../../../alt-model/assets/amount.js';
import { useSendFeeAmounts } from '../../../alt-model/send/tx_fee_hooks.js';
import { configuration } from '../../../config.js';
import { Modal } from '../../../components/modal.js';
import { Card, CardHeaderSize, Theme } from '../../../ui-components/index.js';
import { SendModalHeader } from './modals/send_modal/send_modal_header.js';
import { useSdk } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import { useAwaitCorrectProvider } from '../../../alt-model/defi/defi_form/correct_provider_hooks.js';
import { useMaybeObs } from '../../../app/util/index.js';

interface ShopCartProps {
  asset: RemoteAsset;
  receive: undefined | bigint;
  paid: undefined | bigint;
  goToCart: boolean;
  setGoToCart: Function;
  userId: undefined | GrumpkinAddress;
  address: undefined | string;
  referralAddress: undefined | string;
  referralAmount: undefined | bigint;
}

export function ShopCart(props: ShopCartProps) {
  const [lockedComposerPayload, setLockedComposerPayload] = useState<undefined | SendComposerPayload>(undefined);
  const [state, setState] = useState<undefined | SendFormDerivedData>(undefined);
  const [targetAmount, setTargetAmount] = useState<undefined | Amount>(undefined);
  const [lockedComposer, setLockedComposer] = useState<undefined | SendComposer>(undefined);
  
  const composerState = useMaybeObs(lockedComposer?.stateObs);
  const feeAmounts = useSendFeeAmounts(SendMode.SEND, targetAmount?.toAssetValue(), undefined);
  const sdk = useSdk();
  const awaitCorrectSigner = useAwaitCorrectProvider();

  useEffect(() => {
    if (!props.paid) return;

    setTargetAmount(new Amount(props.paid, props.asset));

  }, [props.asset, props.paid]);

  useEffect(() => {
    if (!targetAmount || !feeAmounts || !props.address || !props.receive) return;

    setLockedComposerPayload({
      recipient: {
        sendMode: SendMode.DONATE,
        userId: GrumpkinAddress.fromString(configuration.shopRecipient)
      } as Recipient,
      targetAmount: targetAmount,
      feeAmount: feeAmounts[TxSettlementTime.NEXT_ROLLUP]!,
      donateAddress: props.address,
      donateAmount: props.receive,
      donateReferralAddress: props.referralAddress,
      donateReferralAmount: props.referralAmount
    });

    setState({
      fields: {
        amountStrOrMax: targetAmount.baseUnits.toString(),
        speed: TxSettlementTime.NEXT_ROLLUP,
        recipientStr: configuration.shopRecipient,
        assetId: props.asset.id,
        sendMode: SendMode.SEND
      }
    } as SendFormDerivedData);

  }, [targetAmount, feeAmounts, props.address, props.receive, props.referralAddress, props.referralAmount]);

  useEffect(() => {
    if (!lockedComposerPayload || !props.goToCart || !sdk || !props.userId) return;

    const composer = new SendComposer(lockedComposerPayload, {
      sdk,
      awaitCorrectSigner,
      userId: props.userId
    });
    setLockedComposer(composer);

  }, [props.goToCart, sdk, props.userId]);

  if (!lockedComposerPayload || !state || !props.goToCart || !composerState) return null;

  return (
    <Modal theme={Theme.WHITE} onClose={() => {}} noPadding={false}>
      <Card
        cardHeader={
          <SendModalHeader
            closeDisabled={
              lockedComposer ? 
                lockedComposer.stateObs.value.phase != SendComposerPhase.IDLE && 
                  lockedComposer.stateObs.value.phase != SendComposerPhase.DONE
                : 
                true
            }
            onClose={() => {
              props.setGoToCart(false);
            }}
            sendMode={SendMode.DONATE}
          />
        }
        cardContent={
          <SendConfirmationPage composerState={composerState} lockedComposerPayload={lockedComposerPayload}
            state={state} onBack={() => {}} onClose={() => {}} 
            onSubmit={() => {
              lockedComposer!.compose().then((result) => {
                if (result) {
                  console.log(`aztecTxId: ${result['txId']}`);
                  console.log(`donationUid: ${result['uid']}`);
                }
              });
            }} 
          />
        }
        headerSize={CardHeaderSize.LARGE}
      />
    </Modal>
    
  )
}