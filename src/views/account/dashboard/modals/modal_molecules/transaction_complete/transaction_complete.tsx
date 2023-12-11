import { Link } from 'react-router-dom';
import { DoneGradientIcon } from '../../../../../../ui-components/components/icons/index.js';
import { Pages } from '../../../../../views.js';

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
        <div>Can't get enough Nata?&nbsp;</div>
        <Link to={Pages.SHOP}>
          Join the private sale.
        </Link>
      </div>
    </div>
  );
}
