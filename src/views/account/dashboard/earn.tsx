import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pages } from '../../views.js';
import style from './earn.module.scss';
import cardWrapperStyle from '../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import { bindStyle } from '../../../ui-components/index.js';
import { Button } from '../../../ui-components/index.js';
import { configuration } from '../../../config.js';
import * as ethers from 'ethers';
import { useObs } from '../../../app/util/index.js';
import { useAccountStateManager } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';

dayjs.extend(isBetween);

const cx = bindStyle(style);

interface EarnProps {
  isLoggedIn: boolean;
}

export function Earn(props: EarnProps) {
  const { isLoggedIn } = props;
  const navigate = useNavigate();
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const [totalClaimed, setTotalClaimed] = useState("Loading...");
  const [lifetimeClaimed, setLifetimeClaimed] = useState("Loading...");
  const [currentEpochClaimed, setCurrentEpochClaimed] = useState("Loading...");
  const [currentEpoch, setCurrentEpoch] = useState(null);
  const [viewDrop, setViewDrop] = useState(null);
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) navigate(Pages.BALANCE);
    updateTotalClaimed();
    updateDrops();
  }, []);

  useEffect(() => {
    if (!accountState || !accountState.ethAddressUsedForAccountKey) return;
    updateAddressClaimed(accountState.ethAddressUsedForAccountKey.toString());
  }, [accountState]);

  async function updateTotalClaimed() {
    const result = await fetch(`${configuration.tokenDropUrl}/total-claimed`);
    setTotalClaimed(ethers.utils.formatEther((await result.json()).data));
  }

  async function updateAddressClaimed(address) {
    const result = await fetch(`${configuration.tokenDropUrl}/address/${address}/claimed`);
    const { lifetime, drop } = (await result.json()).data;
    setLifetimeClaimed(ethers.utils.formatEther(lifetime));
    if (!viewDrop) {
      setCurrentEpochClaimed('-');
      return;
    }
    const amount = drop[currentEpoch.uid] ? 
      ethers.utils.formatEther(drop[currentEpoch.uid]) 
      : 
      ethers.utils.formatEther('0');
    setCurrentEpochClaimed(amount);
  }

  async function updateDrops() {
    const result = await fetch(`${configuration.tokenDropUrl}/drop`);
    const allDrops = (await result.json()).data;
    let epoch = 1;
    const earnDrops = allDrops
      .filter((drop) => drop.earn !== null)
      .map((drop) => {
        drop.created = dayjs(drop.created);
        drop.expires = drop.expires ? dayjs(drop.expires) : drop.expires;
        drop.start = dayjs(drop.start);
        drop.earn.eligibilityStart = dayjs(drop.earn.eligibilityStart);
        drop.earn.eligibilityEnd = dayjs(drop.earn.eligibilityEnd);
        return drop;
      })
      .sort((a, b) => a.earn.eligibilityStart.isAfter(b.earn.eligibilityStart) ? 1 : -1)
      .map((drop) => {
        drop.epoch = epoch++;
        return drop;
      });

    const now = dayjs();
    const updatedCurrentEpoch = earnDrops.reduce((currentEpoch, drop) => {
      if (now.isBetween(drop.earn.eligibilityStart, drop.earn.eligibilityEnd)) currentEpoch = drop.epoch;
      return currentEpoch;
    }, null);

    setDrops(earnDrops);
    setCurrentEpoch(updatedCurrentEpoch);
    setViewDrop(earnDrops[updatedCurrentEpoch - 1]);
  }
  
  return (
    <div style={{display: "flex", flexDirection: "column", gap: "30px"}}>
      <div className={style.cardRow}>
        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{width: "100%", alignItems: "start"}}
        >
          <div>Loyalty Program</div>
          <div className={style.paragraphText}>
            Start depositing to Nata Network to earn loyalty tokens. eNATA can be converted to NATA tokens periodically.
          </div>
          <a href="#" target="_blank"><Button text="Loyalty Program ↗" /></a>
        </div>

        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{minWidth: "15em", alignItems: "start", justifyContent: "space-between"}}
        >
          <div>eNATA</div>
          <div style={{marginTop:"1em"}}>
            <div>{totalClaimed}</div>
            <div className={style.subTitle}>Total Claimed</div>
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
            <div>{lifetimeClaimed}</div>
          </div>
          <div>
            <div className={style.subTitle}>Current Epoch</div>
            <div>{currentEpochClaimed}</div>
          </div>
        </div>

        <div style={{
          padding: "30px", display: "flex", flexDirection: "column", justifyContent: "space-between"
        }}>
          <div>How do I earn eNATA?</div>
          <div className={style.paragraphText}>
            You will be rewarded with eNATA for depositing tokens to Nata Network. Each epoch you will be able to claim
            eNATA, your share will depend on the deposits you make within the eligibility period.
          </div>
          <div className={style.paragraphText}>
            eNATA allocation varies from epoch to epoch. For example, MATIC deposits may be 100% of the share
            allocation this epoch but only 50% next epoch. To maximize your share of eNATA, check the
            token allocation below and deposit accordingly.  
          </div>
        </div>
      </div>

      <div className={style.cardRow}>
        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{width: "100%", alignItems: "stretch"}}
        >
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <div>Epoch {viewDrop ? viewDrop.epoch : "-"}</div>
            <div style={{display: "flex", width: "3em", gap: "0.5em", alignItems: "center"}}>
              <ArrowButton 
                direction={"left"} 
                disabled={viewDrop && viewDrop.epoch == 1} 
                action={() => setViewDrop(drops[viewDrop.epoch - 2])}
              />
              <ArrowButton 
                direction={"right"} 
                disabled={viewDrop && viewDrop.epoch == drops.length} 
                action={() => setViewDrop(drops[viewDrop.epoch])}
              />
            </div>
          </div>

          <div className={style.paragraphText}>
            <span style={{fontWeight: "bold", marginRight: "0.5em"}}>Eligibility from</span>
            <LocalDate date={viewDrop ? viewDrop.earn.eligibilityStart : null} showYear={false} />
            <span style={{fontWeight: "bold", marginLeft: "0.5em", marginRight: "0.5em"}}>to</span>
            <LocalDate date={viewDrop ? viewDrop.earn.eligibilityEnd : null} showYear={false} />
            <div style={{marginTop: "0.5em"}}>
              <span style={{fontWeight: "bold", marginRight: "0.5em"}}>Claim from</span>
              <LocalDate date={viewDrop ? viewDrop.start : null} showYear={true} />
            </div>
            <div style={{marginTop: "0.5em"}}>
              <span style={{fontWeight: "bold", marginRight: "0.5em"}}>Expires</span>
              {viewDrop && viewDrop.expires ? <LocalDate date={viewDrop.expires} showYear={true} /> : "Never"}
            </div>
          </div>

          <div style={{borderTop: "1px solid #e5e5e5"}}></div>

          <div>
            <div>
              {viewDrop ? ethers.utils.formatEther(viewDrop.earn.amount) : "-"}
              <span className={style.tokenSymbol} style={{marginLeft: "0.2em"}}> eNATA</span>
            </div>
            <div className={style.subTitle}>Epoch Supply</div>
          </div>

          <div style={{borderTop: "1px solid #e5e5e5"}}></div>

          <div style={{display: "flex"}}>
            <div style={{width: "33.33%"}}>
              <TokenAllocation tokenSplit={viewDrop ? viewDrop.earn.tokenSplit : null} assetId={0} />
              <div className={style.subTitle}>MATIC Allocation</div>
            </div>
            <div style={{width: "33.33%"}}>
              <TokenAllocation tokenSplit={viewDrop ? viewDrop.earn.tokenSplit : null} assetId={1} />
              <div className={style.subTitle}>DAI Allocation</div>
            </div>
            <div style={{width: "33.33%"}}>
              <TokenAllocation tokenSplit={viewDrop ? viewDrop.earn.tokenSplit : null} assetId={2} />
              <div className={style.subTitle}>WETH Allocation</div>
            </div>
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

function TokenAllocation({
  tokenSplit,
  assetId
}) {
  if (!tokenSplit) return "-";

  const total = tokenSplit.reduce((t, token) => t + token, 0);
  return (
    <span>{((tokenSplit[assetId] / total) * 100).toFixed(1)}%</span>
  );
}

function LocalDate({
  date,
  showYear
}) {
  return (
    <span>
      {date ? date.format(`ddd, D MMM ${showYear ? 'YYYY ' : ''}HH:mm (Z)`) : ''}
    </span>
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