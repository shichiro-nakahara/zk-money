import { Card, CardHeaderSize } from '../../../../../ui-components/index.js';
import { Modal } from '../../../../../components/modal.js';
import style from './claim_drop_modal.module.scss';
import { Loader, Button } from '../../../../../ui-components/index.js';
import closeIconWhite from '../../../../../images/close_white.svg';

interface ClaimDropModalProps {
  txHash: string | undefined;
  visible: boolean;
  onClose: () => void;
}

export function ClaimDropModal(props: ClaimDropModalProps) {
  const { visible, txHash, onClose } = props;

  return (
    <div style={{ display: visible ? "block" : "none" }}>
      <Modal className={style.claimDropModalWrapper}>
        <Card
          cardHeader={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div>Claim Tokens</div>
              <div onClick={ onClose } style={{ display: txHash ? "block" : "none", cursor: "pointer" }}>
                <img style={{ height: "1em" }} src={ closeIconWhite } />
              </div>
            </div>
          }
          cardContent={
            <div style={{ padding: "1em", lineHeight: "1.5em" }}>
              <div style={{ display: txHash ? "none" : "block" }}>
                <div style={{ width: "100%", textAlign: "center", marginBottom: "0.25em" }}><Loader /></div>
                <div>Please confirm transaction in wallet to claim tokens.</div>
              </div>
              <div style={{ display: txHash ? "block" : "none" }}>
                <div style={{ marginBottom: "0.75em" }}>Transaction successfully sent to Polygon!</div>
                <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank"><Button text="View Transaction" /></a>
              </div>
              <div>
                
              </div>
            </div>
            
          }
          headerSize={CardHeaderSize.LARGE}
        />
      </Modal>
    </div>
  );
}