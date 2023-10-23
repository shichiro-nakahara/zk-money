import { DoneGradientIcon } from '../../../../../../ui-components/components/icons/index.js';

interface TransactionCompleteProps {
  onClose(): void;
}

export function TransactionComplete(props: TransactionCompleteProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '36px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', fontWeight: '450',
        fontSize: '26px'
      }}>
        <DoneGradientIcon />
        <div>Transaction Confirmed!</div>
      </div>
      <div style={{ fontSize: '0.9em', display: 'flex', justifyContent: 'center' }}>
        Like Nata Network? Consider leaving 
        a&nbsp;<a href='https://frenreviews.com/project/403' target='_blank' rel='noopener noreferrer'>review</a>.
      </div>
    </div>
  );
}
