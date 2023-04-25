import { AssetValue } from '@aztec/sdk';
import { useAmount } from '../../alt-model/top_level_context/top_level_context_hooks.js';
import { EnforcedRetryableSignFlowState } from '../../toolbox/flows/enforced_retryable_sign_flow.js';
import { EnforcedRetryableSignInteractions } from '../../views/flow_interactions/enforced_retryable_sign_interactions.js';

interface SignDepositInteractionProps {
  requiredFunds: AssetValue;
  flowState: EnforcedRetryableSignFlowState;
  onCancel?: () => void;
}

export function SignApproveInteraction(props: SignDepositInteractionProps) {
  const amount = useAmount(props.requiredFunds);
  const prompt = `Please allow the PolyAztec contract to transfer ${amount?.format({ layer: 'L1' })} of your funds`;
  return (
    <EnforcedRetryableSignInteractions
      onCancel={props.onCancel}
      flowState={props.flowState}
      requestButtonLabel="Approve"
      waitingText="Waiting for approval"
      prompt={prompt}
    />
  );
}
