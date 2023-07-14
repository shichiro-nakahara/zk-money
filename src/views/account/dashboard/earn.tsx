import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pages } from '../../views.js';
import style from './earn.module.scss';
import cardWrapperStyle from '../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import { bindStyle } from '../../../ui-components/index.js';
import { Button } from '../../../ui-components/index.js';

const cx = bindStyle(style);

interface EarnProps {
  isLoggedIn: boolean;
}

export function Earn(props: EarnProps) {
  const { isLoggedIn } = props;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate(Pages.BALANCE);
  }, []);
  
  return (
    <div style={{display: "flex", flexDirection: "column", gap: "30px"}}>
      <div className={style.cardRow}>
        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{width: "100%", alignItems: "start"}}
        >
          <div>Loyalty Program</div>
          <div className={style.paragraphText}>
            Maximize your profits. Start trading on SyncSwap to earn the loyalty tokens. The
            eNATA can be converted to veNATA tokens periodically.
          </div>
          <a href="#" target="_blank"><Button text="Loyalty Program ↗" /></a>
        </div>

        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{minWidth: "15em", alignItems: "start", justifyContent: "space-between"}}
        >
          <div>eNATA</div>
          <div style={{marginTop:"1em"}}>
            <div>1,189,624.5</div>
            <div className={style.subTitle}>Cumulative Supply</div>
          </div>
        </div>
      </div>

      <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
        style={{
          minWidth: "15em", flexDirection: "row", alignItems: "stretch", 
          justifyContent: "space-between", padding: 0, gap: 0
        }}
      >
        <div style={{
          borderRight: "1px solid #e5e5e5", padding: "30px", display: "flex", gap: "20px", flexDirection: "column",
          minWidth: "15em"
        }}>
          <div>Your Loyalty Stats</div>
          <div>
            <div className={style.subTitle}>Lifetime</div>
            <div>1,189,624.5</div>
          </div>
          <div>
            <div className={style.subTitle}>Current Epoch</div>
            <div>1,189,624.5</div>
          </div>
        </div>

        <div style={{
          padding: "30px", display: "flex", flexDirection: "column", justifyContent: "space-between"
        }}>
          <div>How do I earn eNATA?</div>
          <div className={style.paragraphText}>
            You will be rewarded with eNATA for every trade on eligible pools. You will automatically
            receive eNATA based on trading volume.
          </div>
          <div className={style.paragraphText}>
            The Genesis Epoch has been concluded and eNATA minting is paused. Please stay tuned for more updates!
          </div>
        </div>
      </div>

      <div className={style.cardRow}>
        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{width: "100%", alignItems: "stretch"}}
        >
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <div>Epoch 1</div>
            <div style={{display: "flex", width: "3em", gap: "0.5em", alignItems: "center"}}>
              <ArrowButton direction={"left"} disabled={true} action={() => console.log("left")}/>
              <ArrowButton direction={"right"} disabled={false} action={() => console.log("right")}/>
            </div>
          </div>

          <div style={{display: "flex"}}>
            <div style={{width: "50%"}}>
              <div>900,000 <span className={style.tokenSymbol} style={{marginLeft: "0.2em"}}>veNATA</span></div>
              <div className={style.subTitle}>Rewards</div>
            </div>
            <div style={{width: "50%"}}>
              <div>1,189,624.5 <span className={style.tokenSymbol} style={{marginLeft: "0.2em"}}>eNATA</span></div>
              <div className={style.subTitle}>Epoch Supply</div>
            </div>
          </div>

          <div style={{borderTop: "1px solid #e5e5e5"}}></div>
          
          <div className={style.paragraphText}>
            The loyalty program is currently in epoch 1. veNATA rewards will be supplied with every new epoch.
          </div>
        </div>

        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{minWidth: "15em", alignItems: "start", justifyContent: "space-between"}}
        >
          <div>0 <span className={style.tokenSymbol} style={{marginLeft: "0.2em"}}>veNATA</span></div>
          <div className={style.paragraphText}>Estimated Claimable Rewards  ·  Epoch 1</div>
          <Button text="Claim" />
          <div style={{borderTop: "1px solid #e5e5e5", width: "100%"}}></div>
          <div className={style.paragraphText}>
            The estimated rewards you have earned in the epoch by your current eNATA share and total veNATA rewards.
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  action,
  disabled
}) {
  return (
    <div className={cx(style.arrowButton, disabled ? style.arrowButtonDisabled : {})} 
      onClick={disabled ? null : action}
    >
      <svg viewBox="0 0 24 24" style={{marginRight: direction == "left" ? "1px" : "-1px"}}>
        { direction == "left" ? 
          <path d="M17.77 3.77 16 2 6 12l10 10 1.77-1.77L9.54 12z"></path>
          :
          <path d="M6.23 20.23 8 22l10-10L8 2 6.23 3.77 14.46 12z"></path>
        }
      </svg>
    </div>
  );
}