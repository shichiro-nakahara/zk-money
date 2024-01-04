import style from './shop.module.scss';
import { bindStyle, Field, FieldStatus, SectionTitle } from '../../../ui-components/index.js';
import cardWrapperStyle from '../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import { Button } from '../../../ui-components/index.js';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Terms } from './terms/terms.js';
import { RemoteAsset } from '../../../alt-model/types.js';
import { useAccountStateManager, useConfig, useRemoteAssets } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import { useL2BalanceIndicator } from './modals/sections/amount_section/mini_balance_indicators.js';
import { useMaxSendValue } from '../../../alt-model/send/max_send_value_hooks.js';
import { SendMode } from '../../../alt-model/send/send_mode.js';
import { EthAddress, TxSettlementTime } from '@polyaztec/sdk';
import { max, min } from '../../../app/index.js';
import ArrowDown from '../../../images/arrow_down.svg';
import { useObs } from '../../../app/util/index.js';
import { configuration } from '../../../config.js';
import { useNavigate } from 'react-router-dom';
import { Pages } from '../../views.js';
import { Claim } from './claim.js';
import { ShopCart } from './shop_cart.js';
import { CopyButton } from '../../../ui-components/components/copy_button/copy_button.js';
import { Pagination } from '../../../components/pagination.js';
import { useSigner } from 'wagmi';
import * as drop from '../../../app/drop.js';
import { ClaimDropModal } from './modals/claim_drop_modal/claim_drop_modal.js';
import { useDropContext } from '../../../context/drop_context.js';

const cx = bindStyle(style);

interface ShopProps {
  isLoggedIn: boolean;
}

const CLAIMS_PER_PAGE = 5;

export function Shop(props: ShopProps) {
  const assets = useRemoteAssets().filter((a) => a.symbol != 'MATIC');
  const assetOptions = assets.map((a) => { return { value: a.id, label: `zk${a.symbol}` }; });
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const address = accountState ? accountState.ethAddressUsedForAccountKey.toString() : '';
  const { data: signer } = useSigner();
  const dropContext = useDropContext();

  const [referralAddress, setReferralAddress] = useState('');
  const [referralAddressStatus, setReferralAddressStatus] = useState<FieldStatus | undefined>(undefined);
  const [asset, setAsset] = useState<RemoteAsset>(assets[1]);
  const [amount, setAmount] = useState('');
  const [amountStatus, setAmountStatus] = useState<FieldStatus | undefined>(undefined);
  const [amountMessage, setAmountMessage] = useState('');
  const [receive, setReceive] = useState('');
  const [bonus, setBonus] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saleConfig, setSaleConfig] = useState<any>(undefined);
  const [tokenPerDollar, setTokenPerDollar] = useState('');
  const [remainingSupplyP1, setRemainingSupplyP1] = useState('');
  const [totalSupplyP1, setTotalSupplyP1] = useState('');
  const [remainingSupplyP2, setRemainingSupplyP2] = useState('');
  const [totalSupplyP2, setTotalSupplyP2] = useState('');
  const [receiveStatus, setReceiveStatus] = useState<FieldStatus | undefined>(undefined);
  const [referralAddressMessage, setReferralAddressMessage] = useState('');
  const [goToCart, setGoToCart] = useState(false);
  const [page, setPage] = useState(1);
  const [claiming, setClaiming] = useState(false);
  const [tx, setTx] = useState<any>(null);
  const [assetInitialized, setAssetInitialized] = useState(false);

  const l2Balances = assets.reduce((r, a) => {
    r[a.symbol] = useL2BalanceIndicator(a);
    return r;
  }, {});

  const config = useConfig();
  const transactionLimit = asset?.symbol && config.txAmountLimits[asset.symbol];
  const maxChainableValueDAI = !address ? undefined : useMaxSendValue(
    SendMode.SEND, 
    1, 
    TxSettlementTime.NEXT_ROLLUP, 
    EthAddress.fromString(address)
  );
  const maxChainableValueETH = !address ? undefined : useMaxSendValue(
    SendMode.SEND, 
    2, 
    TxSettlementTime.NEXT_ROLLUP, 
    EthAddress.fromString(address)
  );
  const maxOutputDAI = max(min(maxChainableValueDAI?.value || 0n, transactionLimit || 0n), 0n);
  const maxOutputETH = max(min(maxChainableValueETH?.value || 0n, transactionLimit || 0n), 0n);

  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      try {
        const donateRef = ethers.utils.getAddress(ref);
        window.localStorage.setItem('donateRef', donateRef);
      }
      catch (e) {}
    }
    if (!props.isLoggedIn) {
      navigate(Pages.BALANCE);
      return;
    }
    const donateRef = window.localStorage.getItem('donateRef');
    if (donateRef) {
      window.localStorage.removeItem('donateRef')
      updateReferral(donateRef);
    }
    updateSaleConfig();
  }, []);

  useEffect(() => {
    if (!maxChainableValueETH || !maxChainableValueDAI || assetInitialized) return;
    if (maxChainableValueETH.value == 0n && maxChainableValueDAI.value != 0n) setAsset(assets[0]);
    setAssetInitialized(true);

  }, [maxChainableValueETH, maxChainableValueDAI]);

  useEffect(() => {
    if (!assetInitialized) return;
    if (asset.id == 1) setAmount('5000');
    if (asset.id == 2) setAmount('2');

  }, [assetInitialized]);

  useEffect(() => {
    dropContext.updateClaims();
  }, [goToCart]);

  useEffect(() => {
    if (!amount || !saleConfig || isNaN(parseFloat(amount))) return;
    const tokenPrice = asset.symbol == 'DAI' ? saleConfig.daiPrice : saleConfig.ethPrice;
    const amountWei = ethers.utils.parseEther(amount);
    const receive = amountWei.div(ethers.BigNumber.from(tokenPrice));
    const bonus = receive.div(10);
    setReceive(receive.toString());
    setBonus(bonus.toString());
  }, [amount, saleConfig, asset]);

  useEffect(() => {
    if (!saleConfig) return;
    const tokenPerDollar = ethers.utils.parseEther(`1`).div(ethers.BigNumber.from(saleConfig.price.amount));
    setTokenPerDollar(tokenPerDollar.toString());

    if (saleConfig.name == 'Phase 1') {
      setRemainingSupplyP1(parseInt(ethers.utils.formatEther(saleConfig.remaining).toString()).toString());
      setTotalSupplyP1(parseInt(ethers.utils.formatEther(saleConfig.supply).toString()).toString());
      setRemainingSupplyP2('500000000');
      setTotalSupplyP2('500000000');
      return;
    }

    if (saleConfig.name == 'Phase 2') {
      setRemainingSupplyP1('0');
      setTotalSupplyP1('500000000');
      setRemainingSupplyP2(parseInt(ethers.utils.formatEther(saleConfig.remaining).toString()).toString());
      setTotalSupplyP2(parseInt(ethers.utils.formatEther(saleConfig.supply).toString()).toString());
      return;
    }

    setRemainingSupplyP1('0');
    setTotalSupplyP1('500000000');
    setRemainingSupplyP2('0');
    setTotalSupplyP2('500000000');

  }, [saleConfig]);

  useEffect(() => {
    if (amount == '') {
      setAmountStatus(undefined);
      setAmountMessage('');
      return;
    }
    if (isNaN(parseFloat(amount))) {
      setAmountStatus(FieldStatus.Error);
      setAmountMessage('Enter a valid number');
      return;
    }
    if (parseFloat(amount) == 0) {
      setAmountStatus(FieldStatus.Error);
      setAmountMessage('Enter a number greater than zero');
      return;
    }
    const max = asset.id == 1 ? maxOutputDAI : maxOutputETH;
    if (ethers.utils.parseEther(amount).toBigInt() > max) {
      setAmountStatus(FieldStatus.Error);
      setAmountMessage(`Insufficient balance, max allowed ${ethers.utils.formatEther(max)} zk${asset.symbol}`);
      return;
    }
    if (receive && tokenPerDollar && parseFloat(receive) / parseFloat(tokenPerDollar) < 1) {
      setAmountStatus(FieldStatus.Error);
      setAmountMessage('Minimum donation is $1');
      return;
    }

    setAmountMessage('');
    setAmountStatus(FieldStatus.Success);

  }, [asset, amount, maxOutputDAI, maxOutputETH, receive, tokenPerDollar]);

  useEffect(() => {
    if (!receive || !remainingSupplyP1) return;
    if (BigInt(receive) > BigInt(remainingSupplyP1)) {
      setReceiveStatus(FieldStatus.Error);
    }
    else {
      setReceiveStatus(undefined);
    }

    updateReferral(referralAddress);

  }, [receive, remainingSupplyP1]);

  function updateReferral(value: string) {
    if (!value) {
      setReferralAddress('');
      setReferralAddressStatus(undefined);
      setReferralAddressMessage('');
      return;
    }

    try {
      const validAddress = ethers.utils.getAddress(value);
      setReferralAddress(validAddress);

      if (receive && bonus && remainingSupplyP1 && (BigInt(receive) + BigInt(bonus)) > BigInt(remainingSupplyP1)) {
        setReferralAddressStatus(FieldStatus.Error);
        setReferralAddressMessage('Insufficient eNATA remaining, please lower amount');
        return;
      }

      setReferralAddressStatus(FieldStatus.Success);
      setReferralAddressMessage('');
    }
    catch (e) {
      setReferralAddress(value);
      setReferralAddressStatus(FieldStatus.Error);
      setReferralAddressMessage('Please enter a valid Polygon address');
    }
  }

  async function updateSaleConfig() {
    const result = await fetch(`${configuration.tokenShopUrl}/sale/config`);
    if (result.status != 200) throw new Error('Could not get donation config from server!');
    const config = (await result.json()).data;
    setSaleConfig(config);
  }

  async function claimDrop(tokenDropUid: string, id: null | number) {
    if (!tokenDropUid || !address || id === null) {
      console.log(tokenDropUid);
      console.log(address);
      console.log(id);
      throw new Error('Could not claim drop, invalid state.');
    }
    if (!signer) {
      throw new Error('Could not claim, invalid signer. Please unlock your wallet or refresh page and try again.');
    }

    let tree;
    try {
      tree = await drop.getTree(tokenDropUid);
    }
    catch (e) {
      throw new Error(e);
    }
    if (!tree) throw new Error(`Could not get data for drop ${tokenDropUid}, please try again`);

    setTx(null);
    setClaiming(true);

    setTimeout(async () => {
      try {
        const tx = await drop.claim(
          signer, 
          address, 
          id, 
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

  if (saleConfig === null) {
    return (
      <div 
        className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
        style={{ minHeight: "15em" }}
      >
        Private sale has concluded.
      </div>
    );
  }

  return (
    <>
      <ShopCart asset={asset}
        paid={amount && !isNaN(parseFloat(amount)) ? ethers.utils.parseEther(amount).toBigInt() : undefined} 
        userId={accountState?.userId} goToCart={goToCart} setGoToCart={setGoToCart} address={address}
        receive={receive ? ethers.utils.parseEther(receive).toBigInt() : undefined} referralAddress={referralAddress}
        referralAmount={bonus ? ethers.utils.parseEther(bonus).toBigInt() : undefined}
      />

      <Terms address={address} termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted} />

      <ClaimDropModal visible={ claiming } txHash={ tx ? tx.hash : null } onClose={() => setClaiming(false)} />

      <div style={{display: termsAccepted ? "flex" : "none", flexDirection: 'column', gap: '40px'}}>
        <div className={style.cardRow}>
          <div
            className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
            style={{ minWidth: '25em', alignItems: 'start', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1em', width: '100%' }}>
              <div className={style.donateTitle}>Private Sale Terms</div>
              <div>
                <div className={style.donateTextBold} style={{ display: tokenPerDollar ? 'block' : 'none' }}>
                  Phase 1
                </div>
                <div className={style.donateText} style={{ display: tokenPerDollar ? 'flex' : 'none' }}>
                  <div style={{ minWidth: '7em' }}>Price:</div>
                  <div>0.0005</div>
                </div>
                <div className={style.donateText} style={{ display: tokenPerDollar ? 'flex' : 'none' }}>
                  <div style={{ minWidth: '7em' }}>Remaining:</div>
                  <div>
                    { Math.floor(Number(remainingSupplyP1) / 1000000) }M / { Number(totalSupplyP1) / 1000000 }M
                  </div>
                </div>
                <div className={style.donateText} style={{ display: tokenPerDollar ? 'flex' : 'none' }}>
                  <div style={{ minWidth: '7em' }}>Valuation:</div>
                  <div>$5M</div>
                </div>
                <div className={style.progress} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  <div className={style.progressBarBlue} 
                    style={{ width: `${((1 - (Number(remainingSupplyP1) / Number(totalSupplyP1))) * 100)}%` }}
                  >
                  </div>
                  <div style={{ fontSize: '0.75em', width: '100%', textAlign: 'center', marginTop: '-1.6em', 
                    position: 'relative', zIndex: '100', 
                    color: Number(remainingSupplyP1) / Number(totalSupplyP1) > 0.52 ? 'black' : 'white'
                  }}>
                    { `${((1 - (Number(remainingSupplyP1) / Number(totalSupplyP1))) * 100).toFixed(2)}%` }
                  </div>
                </div>
              </div>
              <div>
                <div className={style.donateTextBold} style={{ display: tokenPerDollar ? 'block' : 'none' }}>
                  Phase 2
                </div>
                <div className={style.donateText} style={{ display: tokenPerDollar ? 'flex' : 'none' }}>
                  <div style={{ minWidth: '7em' }}>Price:</div>
                  <div>0.001</div>
                </div>
                <div className={style.donateText} style={{ display: tokenPerDollar ? 'flex' : 'none' }}>
                  <div style={{ minWidth: '7em' }}>Remaining:</div>
                  <div>
                    { Math.floor(Number(remainingSupplyP2) / 1000000) }M / { Number(totalSupplyP2) / 1000000 }M
                  </div>
                </div>
                <div className={style.donateText} style={{ display: tokenPerDollar ? 'flex' : 'none' }}>
                  <div style={{ minWidth: '7em' }}>Valuation:</div>
                  <div>$10M</div>
                </div>
                <div className={style.progress} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  <div className={style.progressBarBlue} 
                    style={{ width: `${(1 - (Number(remainingSupplyP2) / Number(totalSupplyP2))) * 100}%` }}
                  >
                  </div>
                  <div style={{ fontSize: '0.75em', width: '100%', textAlign: 'center', marginTop: '-1.6em', 
                    position: 'relative', zIndex: '100', 
                    color: Number(remainingSupplyP2) / Number(totalSupplyP2) > 0.52 ? 'black' : 'white'
                  }}>
                    { `${((1 - (Number(remainingSupplyP2) / Number(totalSupplyP2))) * 100).toFixed(2)}%` }
                  </div>
                </div>
              </div>
              <div className={style.donateText}>
                Learn more <a href="https://mirror.xyz/natanetwork.eth/wOfwQ95BKz7YBijXt4qusP6Deck-TvhU0LHwcU5uVlI" 
                  target='_blank' rel='noopener noreferrer'>here</a>.
              </div>
            </div>
            
            <div>
              <div className={style.donateTitle} style={{ width: '100%', marginTop: '2em' }}>Your Referral Link</div>
              <div style={{ display: address ? 'flex' : 'none', gap: '1rem' }}>
                <a href={`https://natanetwork.io/donate?ref=${address}`} target='_blank' rel='noopener noreferrer'
                  className={style.donateText} style={{ wordBreak: 'break-all' }}
                >
                  https://natanetwork.io/donate?ref={address}
                </a>
                <CopyButton text={`https://natanetwork.io/donate?ref=${address}`} />
              </div>
            </div>
          </div>

          <div
            className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
            style={{ width: '100%', alignItems: 'start', justifyContent: 'space-between' }}
          >
            <Field
              value={address}
              label="Your Polygon Address"
              placeholder="Enter address"
              disabled={true}
            />
            <div style={{ marginTop: '-2rem', width: '100%' }}>
              <Field
                value={amount}
                label="Amount"
                placeholder="Enter amount"
                status={amountStatus}
                message={amountMessage}
                allowAssetSelection={true}
                assetOptions={assetOptions}
                selectedAsset={asset}
                onChangeAsset={(id) => setAsset(assets.find((a) => a.id == id)!)}
                balance={l2Balances[asset.symbol]}
                onClickBalanceIndicator={() => {
                  const max = asset.id == 1 ? maxOutputDAI : maxOutputETH;
                  setAmount(ethers.utils.formatEther(max));
                  setAmountStatus(FieldStatus.Success);
                }}
                onChangeValue={(value: string ) => {
                  const amount = value.replace(/[^0-9.]/g, '');
                  setAmount(amount);
                }}
              />
            </div>
            <div style={{display: 'flex', justifyContent: 'center', width: '100%', marginTop: '-20px'}}>
              <img style={{width: '30 px', height: '30px'}} src={ArrowDown} />
            </div>
            <div style={{ marginTop: '-2rem', width: '100%' }}>
              <Field
                value={receive ? `${receive} eNATA` : ''}
                label="Receive"
                placeholder="Enter amount above"
                disabled={true}
                status={receiveStatus}
                message={receiveStatus == FieldStatus.Error ? "Insufficient eNATA remaining, please lower amount" : ""}
              />
            </div>
            <div style={{ marginTop: '-2rem', width: '100%' }}>
              <Field
                value={referralAddress}
                label={`Referral Earns ${bonus ? `${bonus} eNATA` : '10% Bonus'}`}
                placeholder="Enter address"
                status={referralAddressStatus}
                message={referralAddressStatus == FieldStatus.Error ? referralAddressMessage : ""}
                onChangeValue={updateReferral}
              />
            </div>
            <Button text="Buy Now" 
              onClick={() => setGoToCart(true)} 
              style={{width: '100%', marginTop: '-1rem'}}
              disabled={amountStatus != FieldStatus.Success || 
                referralAddressStatus == FieldStatus.Error ||
                receiveStatus == FieldStatus.Error
              }
            />
          </div>
        </div>
        <div>
          <SectionTitle label="Claims" />
          <div>
            {
              dropContext.claims ? 
                dropContext.claims.slice((page - 1) * CLAIMS_PER_PAGE, page * CLAIMS_PER_PAGE).map((claim, i) => 
                  <Claim key={`claim-${i}`} address={claim.address} amount={BigInt(claim.amount)} 
                    referralAddress={claim.referralAddress} referralAmount={claim.referralAmount}
                    tokenDropUid={claim.drop ? claim.drop.tokenDropUid : undefined} hasClaimed={claim.hasClaimed}
                    name={claim.drop ? claim.drop.name : undefined} id={claim.id}
                    onClaimDrop={() => claimDrop(claim.drop?.tokenDropUid, claim.id)}
                  />
                )
                :
                null
            }
            <Pagination totalItems={dropContext.claims ? dropContext.claims.length : 0} itemsPerPage={CLAIMS_PER_PAGE} 
              page={page} onChangePage={(p) => setPage(p)} 
            />
          </div>
          
          <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
            style={{ width:'100%', display: !dropContext.claims || dropContext.claims.length == 0 ? 'flex' : 'none' }}
          >
            No claim history
          </div>
        </div>
      </div>
    </>
  );
}