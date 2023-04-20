// import { FetchSignerResult } from '@wagmi/core';
import Cookies from 'js-cookie';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ToastsObs } from '../../alt-model/top_level_context/toasts_obs.js';
import { RegisterFormFlowState } from '../../alt-model/forms/register/register_form_flow.js';
import { Button, ButtonTheme, TxProgress, TxProgressFlow, TxProgressStep } from '../../ui-components/index.js';
import { WalletInteractionStep, WalletInteractionToast } from '../../components/index.js';
import { FlowRunnerState } from '../../toolbox/flows/flow_runner.js';
import { PhaseType } from '../account/dashboard/register_account_form.js';
import style from './toast_configurations.module.scss';

export enum Toasts {
  TOS = 'TOS',
  COOKIES = 'COOKIES',
  REGISTER = 'REGISTER',
  WALLET_SELECTOR = 'WALLET_SELECTOR',
  WALLET_INTERACTION = 'WALLET_INTERACTION',
}

export const getTOSToastPartOne = (toastsObs: ToastsObs) => ({
  key: Toasts.TOS,
  heavy: true,
  primaryButton: {
    onClick: () => {
      toastsObs.removeToastByKey(Toasts.TOS);
      Cookies.set('tos_accepted', 'true');
    },
    text: 'Accept',
  },
  secondaryButton: {
    onClick: () => {
      // TODO: What do we do here?
      console.warn('NOT IMPLEMENTED!');
    },
    text: 'Reject',
  },
  components: (
    <div className={style.TOSToast}>
      <div>
        Please read and accept the following terms in order to access and use PolyAztec:
      </div>
      <ol>
        <li>I acknowledge that the <b>contracts are unaudited and may be considered risky.</b></li>
        <li>I acknowledge that PolyAztec and related software are experimental and that the use of experimental software may result in loss of funds.</li>
        <li>I am not a citizen or resident of the United States of America (including its territories: American Samoa, Guam, Puerto Rico, the Northern Mariana Islands, and the U.S. Virgin Islands) or any other Restricted Jurisdiction (as defined in the Terms of Service).</li>
        <li>I am not a Prohibited Person (as defined in the Terms of Service) nor acting on behalf of a Prohibited Person.</li>
      </ol>
    </div>
  ),
});

export const getRegisterToast = (
  onRetry: () => Promise<void>,
  onCancel: () => void,
  onResetRunner: () => void,
  walletInteractionToastsObs: ToastsObs,
  runnerState: FlowRunnerState<RegisterFormFlowState>,
  item:
    | {
        step?: undefined;
        interactionStep: WalletInteractionStep;
      }
    | {
        step: TxProgressStep;
        interactionStep: WalletInteractionStep;
      },
) => ({
  closable: true,
  key: Toasts.REGISTER,
  onClose: () => {
    walletInteractionToastsObs.removeToastByKey(Toasts.REGISTER);
    onCancel();
    onResetRunner();
  },
  components: (
    <WalletInteractionToast
      onRetry={onRetry}
      onCancel={onCancel}
      runnerState={runnerState}
      interactionStep={item.interactionStep}
      submitDisabled={false}
      content={<TxProgress flow={TxProgressFlow.L1_DEPOSIT} activeStep={item.step} />}
    />
  ),
});

export const getWalletSelectorToast = (closeModal: () => void) => ({
  key: Toasts.WALLET_SELECTOR,
  closable: true,
  components: (
    <div className={style.signatureToast}>
      Do you wish to switch the wallet you're signing with?
      <div className={style.note}>
        Please note, this has no effect on the PolyAztec account you're currently signed in with.
      </div>
      <div className={style.interactions}>
        <ConnectButton accountStatus="address" showBalance={false} />
        <Button onClick={closeModal} text={'Close'} theme={ButtonTheme.Secondary} />
      </div>
    </div>
  ),
});

export const getWalletInteractionToast = (
  phase: PhaseType,
  disabled: boolean,
  handleRequestSignature: () => Promise<void>,
  onClose: () => void,
) => ({
  closable: true,
  key: Toasts.WALLET_INTERACTION,
  onClose,
  components: (
    <WalletInteractionToast
      submitDisabled={disabled}
      message={'Please select a wallet to perform the signature'}
      interactionStep={phase === 'awaiting-signature' ? WalletInteractionStep.WaitingForSignature : undefined}
      onRetry={handleRequestSignature}
      onSubmit={handleRequestSignature}
      onCancel={onClose}
    />
  ),
});

export const getAccountConfirmationToast = (
  phase: PhaseType,
  disabled: boolean,
  handleRequestSignature: () => Promise<void>,
  onClose: () => void,
) => ({
  closable: true,
  key: Toasts.WALLET_INTERACTION,
  onClose,
  components: (
    <WalletInteractionToast
      submitDisabled={disabled}
      message={'Please sign again to ensure your signature is stable'}
      interactionStep={phase === 'awaiting-signature' ? WalletInteractionStep.WaitingForSignature : undefined}
      onRetry={handleRequestSignature}
      onSubmit={handleRequestSignature}
      onCancel={onClose}
    />
  ),
});
