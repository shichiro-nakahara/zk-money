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
  TOS_PART_1 = 'TOS_PART_1',
  TOS_PART_2 = 'TOS_PART_2',
  COOKIES = 'COOKIES',
  REGISTER = 'REGISTER',
  WALLET_SELECTOR = 'WALLET_SELECTOR',
  WALLET_INTERACTION = 'WALLET_INTERACTION',
}

const acceptTos = () => {
  Cookies.set('tos_accepted', 'true');
};

export const getTOSToastPartOne = (toastsObs: ToastsObs) => ({
  key: Toasts.TOS_PART_1,
  heavy: true,
  primaryButton: {
    onClick: () => {
      toastsObs.removeToastByKey(Toasts.TOS_PART_1);
      toastsObs.addToast(getTOSToastPartTwo(toastsObs));
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
        By accessing or using PolyAztec, <b>I understand this code is unaudited and should be considered risky</b>. Please read and confirm you understand the following terms of service:
      </div>
      <ol>
        <li>I am not a resident of, or located in the United States of America (including its territories: American Samoa, Guam, Puerto Rico, the Northern Mariana Islands and the U.S. Virgin Islands) or any other Restricted Jurisdiction (as defined in the Terms of Service).</li>
        <li>I am not a Prohibited Person (as defined in the Terms of Service) nor acting on behalf of a Prohibited person.</li>
        <li>I understand that the contracts are unaudited and should be considered risky.</li>
        <li>I acknowledge that PolyAztec and related software are experimental, and that the use of experimental software may result in complete loss of my Funds.</li>
      </ol>
    </div>
  ),
});

export const getTOSToastPartTwo = (toastsObs: ToastsObs) => ({
  key: Toasts.TOS_PART_2,
  heavy: true,
  primaryButton: {
    onClick: () => {
      toastsObs.removeToastByKey(Toasts.TOS_PART_2);
      acceptTos();
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
      <div>By proceeding to the application you acknowledge that:</div>
      <ol>
        <li>If you are acting as an individual then you are of legal age (as applicable in your jurisdiction in which you reside).</li>
        <li>You are not a politically exposed person, that is, a person who is or has been entrusted with any prominent public function, or a politically exposed person who has stepped down.</li>
        <li>You are not an immediate family member or a close associate of a politically exposed person or a politically exposed person who has stepped down.</li>
        <li>You are not engaged in money laundering or the financing of terrorism.</li>
        <li>Your access to PolyAztec does not violate any rule, law, regulation or directive of the country of your residence and the jurisdiction in which you reside.</li>
        <li>You have not been arrested or convicted for any offence or crime.</li>
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
        Please note, this has no effect on the Aztec account you're currently signed in with.
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
