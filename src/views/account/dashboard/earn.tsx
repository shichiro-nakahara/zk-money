import { useEffect, useState, Fragment } from 'react';
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
import * as drop from '../../../app/drop.js';
import { useSigner } from 'wagmi';
import { ClaimDropModal } from './modals/claim_drop_modal/claim_drop_modal.js';
import { useDropContext } from '../../../context/drop_context.js';

dayjs.extend(isBetween);

const cx = bindStyle(style);

interface EarnProps {
  isLoggedIn: boolean;
}

const SG_NETWORK = {
  '101': 'Ethereum',
  '106': 'Avalanche',
  '109': 'Polygon',
  '110': 'Arbitrum',
  '111': 'Optimism',
  '112': 'Fantom',
  '184': 'Base'
};

export function Earn(props: EarnProps) {
  const dropContext = useDropContext();
  const { isLoggedIn } = props;
  const navigate = useNavigate();
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const [totalClaimed, setTotalClaimed] = useState('Loading...');
  const [lifetimeClaimed, setLifetimeClaimed] = useState('Loading...');
  const [lastEpochClaimed, setLastEpochClaimed] = useState('Loading...');
  const [lastEpoch, setLastEpoch] = useState(null);
  const [viewDrop, setViewDrop] = useState(null);
  const [drops, setDrops] = useState([]);
  const [claim, setClaim] = useState({ error: 'Loading...', amount: null });
  const [claiming, setClaiming] = useState(false);
  const [tx, setTx] = useState(null);
  const [contract, setContract] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const { data: signer } = useSigner();

  useEffect(() => {
    if (!isLoggedIn) navigate(Pages.BALANCE);
    initContract();
    setEventListener();
  }, []);

  useEffect(() => {
    updateDrops();
  }, [dropContext.drops]);

  useEffect(() => {
    updateTotalClaimed();
  }, [contract]);

  useEffect(() => {
    if (!accountState || !accountState.ethAddressUsedForAccountKey || !lastEpoch) return;
    updateAddressClaimed(lastEpoch.uid, accountState.ethAddressUsedForAccountKey.toString());
  }, [accountState, lastEpoch]);

  useEffect(() => {
    updateClaim();
  }, [viewDrop, contract]);

  useEffect(() => {
    if (!refresh) return;

    updateTotalClaimed();
    updateClaim();
    setRefresh(false);

  }, [refresh]);

  async function setEventListener() {
    drop.setEventListener((log) => {
      setRefresh(true);
    });
  }

  async function initContract() {
    const provider = new ethers.providers.JsonRpcProvider(configuration.ethereumHost);
    setContract((await drop.getContract()).connect(provider));
  }

  async function updateTotalClaimed() {
    if (!contract) return;
    const totalClaimed = await contract.totalClaimed();
    setTotalClaimed(ethers.utils.formatEther(totalClaimed));
  }

  async function updateClaim() {
    if (!viewDrop || !contract) return;

    const now = dayjs();
    if (viewDrop.earn.eligibilityEnd.isAfter(now)) {
      setClaim({
        error: (
          <div>
            The eligibility period for this epoch has not concluded yet, please return after{' '}
            <LocalDate style={{ fontWeight: 'bold' }} date={viewDrop.earn.eligibilityEnd} /> for results.
          </div>
        ),
        amount: null,
      });
      return;
    }

    if (viewDrop.start.isAfter(now)) {
      setClaim({
        error: (
          <div>
            Claims for this epoch are being finalized. Please return after{' '}
            <LocalDate style={{ fontWeight: 'bold' }} date={viewDrop.start} /> to claim your rewards.
          </div>
        ),
        amount: null,
      });
      return;
    }

    const tree = await drop.getTree(viewDrop.uid);
    if (!tree) {
      setClaim({
        error: <div>Claims for this epoch are still being finalized. Please return later to claim your rewards.</div>,
        amount: null,
      });
      return;
    }

    const address = accountState.ethAddressUsedForAccountKey.toString();
    const amount = tree.recipients[address];
    if (!amount) {
      setClaim({
        error: (
          <Fragment>
            <div>Unfortunately you do not qualify for any rewards this epoch.</div>
            <div>Try depositing tokens during the eligibility period next epoch.</div>
          </Fragment>
        ),
        amount: null,
      });
      return;
    }

    try {
      const hasClaimed = await contract.hasClaimed(viewDrop.id, address);
      if (hasClaimed) {
        setClaim({
          error: (
            <div>
              Your <span style={{fontWeight: "bold"}}>{ parseInt(ethers.utils.formatEther(amount)) } eNATA</span> reward
              has been claimed.
            </div>
          ),
          amount: null,
        });
        return;
      }
    }
    catch (e) {
      console.warn(`Could not get claimed status for ${address} on drop ${viewDrop.id}`);
      console.warn(e);
    }

    setClaim({
      error: false,
      amount: amount,
    });
  }

  async function updateAddressClaimed(dropUid, address) {
    const result = await fetch(`${configuration.tokenDropUrl}/address/${address}/claimed`);
    const { lifetime, drop } = (await result.json()).data;
    setLifetimeClaimed(ethers.utils.formatEther(lifetime));
    const amount = dropUid && drop[dropUid]
      ? ethers.utils.formatEther(drop[dropUid])
      : ethers.utils.formatEther('0');
    setLastEpochClaimed(amount);
  }

  async function updateDrops() {
    if (!dropContext.drops) return;

    let epoch = 1;
    const earnDrops = dropContext.drops
      .filter(drop => drop.earn !== null)
      .map(drop => {
        drop.created = dayjs(drop.created);
        drop.expires = drop.expires ? dayjs(drop.expires) : drop.expires;
        drop.start = dayjs(drop.start);
        drop.earn.eligibilityStart = dayjs(drop.earn.eligibilityStart);
        drop.earn.eligibilityEnd = dayjs(drop.earn.eligibilityEnd);
        return drop;
      })
      .sort((a, b) => (a.earn.eligibilityStart.isAfter(b.earn.eligibilityStart) ? 1 : -1))
      .map(drop => {
        drop.epoch = epoch++;
        return drop;
      });

    const lastWeek = dayjs().subtract(1, 'week');
    const updatedLastEpoch = earnDrops.reduce((lastEpoch, drop) => {
      if (lastWeek.isBetween(drop.earn.eligibilityStart, drop.earn.eligibilityEnd)) lastEpoch = drop;
      return lastEpoch;
    }, null);

    setDrops(earnDrops);
    setLastEpoch(updatedLastEpoch);

    const now = dayjs();
    const currentEpoch = earnDrops.reduce((currentEpoch, drop) => {
      if (now.isBetween(drop.earn.eligibilityStart, drop.earn.eligibilityEnd)) currentEpoch = drop;
      return currentEpoch;
    }, null);

    setViewDrop(currentEpoch ? currentEpoch : earnDrops[earnDrops.length - 1]);
  }

  async function claimDrop() {
    if (!viewDrop || !accountState || !accountState.ethAddressUsedForAccountKey) {
      throw new Error('Could not claim drop, invalid state.');
    }
    if (!signer) {
      throw new Error('Could not claim, invalid signer. Please unlock your wallet or refresh page and try again.');
    }

    let tree;
    try {
      tree = await drop.getTree(viewDrop.uid);
    }
    catch (e) {
      throw new Error(e);
    }
    if (!tree) throw new Error(`Could not get data for drop ${viewDrop.uid}, please try again`);

    setTx(null);
    setClaiming(true);

    setTimeout(async () => {
      try {
        const tx = await drop.claim(
          signer, 
          accountState.ethAddressUsedForAccountKey.toString(), 
          viewDrop.id, 
          tree
        );
        setTx(tx);
      }
      catch (e) {
        setClaiming(false);
        if (!e.toString().includes('user rejected transaction')) {
          throw new Error(e);
        }
      }
    }, 500);
  }

  function hasPolygonAllocation() {
    return viewDrop && (viewDrop.earn.tokenSplit.asset.find((v) => v > 0) || viewDrop.earn.tokenSplit.max > 0);
  }

  function hasXChainAllocation() {
    return viewDrop && viewDrop.earn.tokenSplit.network && Object.keys(viewDrop.earn.tokenSplit.network).length > 0;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className={style.cardRow}>
        <div
          className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
          style={{ width: '100%', alignItems: 'start' }}
        >
          <div>Loyalty Program</div>
          <div className={style.paragraphText}>
            Start depositing to Nata Network to earn loyalty tokens.
          </div>
          <a href="https://docs.natanetwork.io/how-natanetwork-works/earn" target="_blank">
            <Button text="Loyalty Program ↗" />
          </a>
        </div>

        <div
          className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
          style={{ minWidth: '15em', alignItems: 'start', justifyContent: 'space-between' }}
        >
          <div>eNATA</div>
          <div style={{ marginTop: '1em' }}>
            <div>{totalClaimed != "Loading..." ? parseInt(totalClaimed) : totalClaimed}</div>
            <div className={style.subTitle}>Total Claimed</div>
          </div>
        </div>
      </div>

      <div
        className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
        style={{
          minWidth: '15em',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          padding: 0,
          gap: 0,
        }}
      >
        <div
          style={{
            borderRight: '1px solid #e5e5e5',
            padding: '30px',
            display: 'flex',
            gap: '20px',
            flexDirection: 'column',
            minWidth: '15em',
          }}
        >
          <div>Your Loyalty Stats</div>
          <div>
            <div className={style.subTitle}>Lifetime</div>
            <div>
              {lifetimeClaimed != "Loading..." ? parseInt(lifetimeClaimed) : lifetimeClaimed}
              <span className={style.tokenSymbol}>eNATA</span>
            </div>
          </div>
          <div>
            <div className={style.subTitle}>Last Epoch</div>
            <div>
              {lastEpochClaimed != "Loading..." ? parseInt(lastEpochClaimed) : lastEpochClaimed}
              <span className={style.tokenSymbol}>eNATA</span>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div>How do I earn eNATA?</div>
          <div className={style.paragraphText}>
            You will be rewarded with eNATA for depositing tokens to Nata Network. Each epoch you will be able to claim
            eNATA, your share will depend on the deposits you make within the eligibility period.
          </div>
          <div className={style.paragraphText}>
            eNATA allocation varies from epoch to epoch. For example, MATIC deposits may be 100% of the share allocation
            this epoch but only 50% next epoch. To maximize your share of eNATA, check the reward allocations below and
            deposit accordingly.
          </div>
        </div>
      </div>

      <div
        className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper, style.cardRow)}
        style={{ padding: 0, gap: 0, alignItems: 'stretch' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            padding: '30px',
            width: '100%',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Epoch {viewDrop ? viewDrop.epoch : '-'}</div>
            <div style={{ display: 'flex', width: '3em', gap: '0.5em', alignItems: 'center' }}>
              <ArrowButton
                direction={'left'}
                disabled={!viewDrop || (viewDrop && viewDrop.epoch == 1)}
                action={() => setViewDrop(drops[viewDrop.epoch - 2])}
              />
              <ArrowButton
                direction={'right'}
                disabled={!viewDrop || (viewDrop && viewDrop.epoch == drops.length)}
                action={() => setViewDrop(drops[viewDrop.epoch])}
              />
            </div>
          </div>

          <div className={style.paragraphText}>
            <span style={{ fontWeight: 'bold', marginRight: '0.5em' }}>Eligibility from</span>
            <LocalDate date={viewDrop ? viewDrop.earn.eligibilityStart : null} />
            <span style={{ fontWeight: 'bold', marginLeft: '0.5em', marginRight: '0.5em' }}>to</span>
            <LocalDate date={viewDrop ? viewDrop.earn.eligibilityEnd : null} />
            <div style={{ marginTop: '0.5em' }}>
              <span style={{ fontWeight: 'bold', marginRight: '0.5em' }}>Claim from</span>
              <LocalDate date={viewDrop ? viewDrop.start : null} showYear={true} />
            </div>
            <div style={{ marginTop: '0.5em' }}>
              <span style={{ fontWeight: 'bold', marginRight: '0.5em' }}>Expires</span>
              {viewDrop && viewDrop.expires ? <LocalDate date={viewDrop.expires} showYear={true} /> : 'Never'}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e5e5' }}></div>

          <div>
            <div>
              {viewDrop ? parseInt(ethers.utils.formatEther(viewDrop.earn.amount)) : '-'}
              <span className={style.tokenSymbol}>eNATA</span>
            </div>
            <div className={style.subTitle}>Total Epoch Reward</div>
          </div>

          <div style={{ display: hasPolygonAllocation() ? 'block' : 'none'}}>
            <div style={{ borderTop: '1px solid #e5e5e5', marginBottom: '20px' }}></div>
            <div className={style.allocationTitle} style={{ marginBottom: '0.5em' }}>Polygon Allocations</div>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '25%' }}>
                <div className={style.subTitle}>MATIC</div>
                <TokenAllocation
                  totalReward={viewDrop ? viewDrop.earn.amount : null}
                  tokenSplit={viewDrop ? viewDrop.earn.tokenSplit : null}
                  assetId={0}
                />
              </div>
              <div style={{ width: '25%' }}>
                <div className={style.subTitle}>DAI</div>
                <TokenAllocation
                  totalReward={viewDrop ? viewDrop.earn.amount : null}
                  tokenSplit={viewDrop ? viewDrop.earn.tokenSplit : null}
                  assetId={1}
                />
              </div>
              <div style={{ width: '25%' }}>
                <div className={style.subTitle}>WETH</div>
                <TokenAllocation
                  totalReward={viewDrop ? viewDrop.earn.amount : null}
                  tokenSplit={viewDrop ? viewDrop.earn.tokenSplit : null}
                  assetId={2}
                />
              </div>
              <div style={{ width: '25%' }}>
                <div className={style.subTitle}>Max Deposit</div>
                <MaxAllocation
                  totalReward={viewDrop ? viewDrop.earn.amount : null}
                  tokenSplit={viewDrop ? viewDrop.earn.tokenSplit : null}
                />
              </div>
            </div>
          </div>

          <div style={{ display: hasXChainAllocation() ? 'block' : 'none' }}>
            <div style={{ borderTop: '1px solid #e5e5e5', marginBottom: '20px' }}></div>
            <div className={style.allocationTitle} style={{ marginBottom: '0.5em' }}>X-Chain Allocations</div>
            <div style={{ display: 'grid', gridRowGap: '20px', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(21%, 1fr))' }}
            >
              { 
                hasXChainAllocation() ? 
                  Object.keys(viewDrop!.earn.tokenSplit.network).map((sgChainId) => 
                    <ChainAllocation sgChainId={sgChainId} tokenSplit={viewDrop!.earn.tokenSplit} 
                      totalReward={viewDrop!.earn.amount} 
                    />
                  )
                  :
                  null
              }
            </div>
          </div>
        </div>

        <div className={style.claimPanel}>
          <div style={{ display: !claim.error ? 'flex' : 'none', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div className={style.miniTitle}>Claimable Rewards</div>
              <div>
                {claim.amount ? ethers.utils.formatEther(claim.amount) : '-'}
                <span className={style.tokenSymbol}>eNATA</span>
              </div>
            </div>
          </div>

          <div
            className={style.paragraphText}
            style={{ display: claim.error ? 'flex' : 'none', flexDirection: 'column', gap: '20px' }}
          >
            {claim.error}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <Button text="Claim" disabled={claim.error || claiming} onClick={claimDrop} />
          </div>
        </div>
      </div>

      <ClaimDropModal visible={ claiming } txHash={ tx ? tx.hash : null } onClose={() => setClaiming(false)} />
    </div>
  );
}

function MaxAllocation({ totalReward, tokenSplit }) {
  if (!tokenSplit) return '-';

  const total = tokenSplit.asset.reduce((t, token) => t + token, 0) + tokenSplit.max;
  const fraction = tokenSplit.max / total;
  const totalRewardNumber = parseFloat(ethers.utils.formatEther(totalReward));

  return (
    <Fragment>
      <div>{(fraction * 100).toFixed(1)}%</div>
      <div style={{ fontSize: '0.8em' }}>
        {(totalRewardNumber * fraction).toFixed(0)}
        <span className={style.tokenSymbol}>eNATA</span>
      </div>
    </Fragment>
  );
}

function TokenAllocation({ totalReward, tokenSplit, assetId }) {
  if (!tokenSplit) return '-';

  const total = tokenSplit.asset.reduce((t, token) => t + token, 0) + tokenSplit.max;
  const fraction = tokenSplit.asset[assetId] / total;
  const totalRewardNumber = parseFloat(ethers.utils.formatEther(totalReward));

  return (
    <Fragment>
      <div>{(fraction * 100).toFixed(1)}%</div>
      <div style={{ fontSize: '0.8em' }}>
        {(totalRewardNumber * fraction).toFixed(0)}
        <span className={style.tokenSymbol}>eNATA</span>
      </div>
    </Fragment>
  );
}

function ChainAllocation({ sgChainId, totalReward, tokenSplit }) {

  const total = Object.keys(tokenSplit.network).reduce((t, v) => t + tokenSplit.network[v], 0);
  const fraction = tokenSplit.network[sgChainId] / total;
  const totalRewardNumber = parseFloat(ethers.utils.formatEther(totalReward));

  return (
    <div>
      <div className={style.subTitle}>{ SG_NETWORK[sgChainId] }</div>
      <div>{(fraction * 100).toFixed(1)}%</div>
      <div style={{ fontSize: '0.8em' }}>
        {(totalRewardNumber * fraction).toFixed(0)}
        <span className={style.tokenSymbol}>eNATA</span>
      </div>
    </div>
  );
}

function LocalDate({ date, style = {}, showYear = false }) {
  return <span style={style}>{date ? date.format(`ddd, D MMM ${showYear ? 'YYYY ' : ''}HH:mm (Z)`) : ''}</span>;
}

function ArrowButton({ direction, action, disabled }) {
  return (
    <div
      className={cx(style.arrowButton, disabled ? style.arrowButtonDisabled : {})}
      onClick={disabled ? null : action}
    >
      <svg viewBox="0 0 24 24" style={{ marginRight: direction == 'left' ? '1px' : '-1px' }}>
        {direction == 'left' ? (
          <path d="M17.77 3.77 16 2 6 12l10 10 1.77-1.77L9.54 12z"></path>
        ) : (
          <path d="M6.23 20.23 8 22l10-10L8 2 6.23 3.77 14.46 12z"></path>
        )}
      </svg>
    </div>
  );
}
