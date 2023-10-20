import type { Signer } from '@ethersproject/abstract-signer';
import {
  AztecSdk,
  GrumpkinAddress,
  EthAddress,
  TransferController,
  WithdrawController,
  EthersAdapter,
} from '@polyaztec/sdk';
import createDebug from 'debug';
import { SendComposerPhase, SendComposerStateObs } from './send_composer_state_obs.js';
import { SendMode } from './send_mode.js';
import { createSigningRetryableGenerator } from '../forms/composer_helpers.js';
import { Amount } from '../assets/index.js';
import { configuration } from '../../config.js';

const debug = createDebug('zm:send_composer');

const PROOF_CREATION_TIMEOUT = 120e3;

export type Recipient =
  | {
      sendMode: SendMode.SEND;
      userId: GrumpkinAddress;
    }
  | {
      sendMode: SendMode.WIDTHDRAW;
      address: EthAddress;
    }
  | {
      sendMode: SendMode.DONATE;
      userId: GrumpkinAddress
    };

export type SendComposerPayload = Readonly<{
  recipient: Recipient;
  targetAmount: Amount;
  feeAmount: Amount;
  donateAddress?: string;
  donateAmount?: bigint;
  donateReferralAddress?: string;
  donateReferralAmount?: bigint;
}>;

interface SendComposerDeps {
  sdk: AztecSdk;
  userId: GrumpkinAddress;
  awaitCorrectSigner: () => Promise<Signer>;
}

export class SendComposer {
  stateObs = new SendComposerStateObs();

  constructor(readonly payload: SendComposerPayload, private readonly deps: SendComposerDeps) {}

  private withRetryableSigning = createSigningRetryableGenerator(this.stateObs);

  async compose() {
    this.stateObs.clearError();
    this.stateObs.setBackNoRetry(false);
    try {
      const { targetAmount, feeAmount, recipient, donateAddress, donateAmount, donateReferralAddress } = this.payload;
      const { sdk, userId, awaitCorrectSigner } = this.deps;

      this.stateObs.setPhase(SendComposerPhase.GENERATING_KEY);

      const signer = await awaitCorrectSigner();
      const ethersAdapter = new EthersAdapter(signer.provider!);
      const address = await signer.getAddress();

      const { privateKey } = await this.withRetryableSigning(async () => {
        return await sdk.generateSpendingKeyPair(EthAddress.fromString(address), ethersAdapter);
      });
      const schnorrSigner = await sdk.createSchnorrSigner(privateKey);

      this.stateObs.setPhase(SendComposerPhase.CREATING_PROOF);
      let controller: TransferController | WithdrawController;

      if (recipient.sendMode === SendMode.SEND || recipient.sendMode === SendMode.DONATE) {
        controller = sdk.createTransferController(
          userId,
          schnorrSigner,
          targetAmount.toAssetValue(),
          feeAmount.toAssetValue(),
          recipient.userId,
          true, // recipientAccountRequired: (transfering to an account that is registered)
        );
      } else {
        controller = sdk.createWithdrawController(
          userId,
          schnorrSigner,
          targetAmount.toAssetValue(),
          feeAmount.toAssetValue(),
          recipient.address,
        );
      }
      await controller.createProof(PROOF_CREATION_TIMEOUT);

      this.stateObs.setPhase(SendComposerPhase.SENDING_PROOF);
      const txId = await controller.send();

      if (recipient.sendMode !== SendMode.DONATE) {
        this.stateObs.setPhase(SendComposerPhase.DONE);
        return txId;
      }

      this.stateObs.setPhase(SendComposerPhase.COMPLETE_DONATE);

      let retries = 0;
      while (retries < 3) {
        const result = await fetch(
          `${configuration.tokenShopUrl}/sale`,
          {
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              aztecTxId: txId.toString(), 
              address: donateAddress, 
              amount: donateAmount!.toString(), 
              token: targetAmount.info.id == 1 ? 'DAI' : 'ETH', 
              paid: targetAmount.baseUnits.toString(), 
              grumpkin: userId.toString(),
              referralAddress: donateReferralAddress
            })
          }
        );
        if (result.status == 404) {
          retries++;
          console.log(`AztecTxId not found yet, retrying in 1500ms (${retries}/3)`);
          continue;
        }
        if (result.status != 200) {
          throw new Error(`Failed to finalize donation`);
        }

        const { uid } = (await result.json()).data;
        this.stateObs.setPhase(SendComposerPhase.DONE);
        return { txId, uid };
      }
    } catch (error) {
      debug('Compose failed with error:', error);
      this.stateObs.error(error?.message?.toString(), error);
      if (error?.message?.toString() === 'Insufficient fee.') {
        // update obs so user doesn't retry
        this.stateObs.setBackNoRetry(true);
      }
      return false;
    }
  }
}
