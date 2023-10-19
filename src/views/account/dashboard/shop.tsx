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
import Copy from '../../../ui-components/images/copy.svg';
import { Claim } from './claim.js';
import { ShopCart } from './shop_cart.js';

const cx = bindStyle(style);

interface ShopProps {
  isLoggedIn: boolean;
}

export function Shop(props: ShopProps) {
  const assets = useRemoteAssets().filter((a) => a.symbol != 'MATIC');
  const assetOptions = assets.map((a) => { return { value: a.id, label: `zk${a.symbol}` }; });
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const address = accountState ? accountState.ethAddressUsedForAccountKey.toString() : '';

  const [referralAddress, setReferralAddress] = useState('');
  const [referralAddressStatus, setReferralAddressStatus] = useState<FieldStatus | undefined>(undefined);
  const [asset, setAsset] = useState<RemoteAsset>(assets[1]);
  const [amount, setAmount] = useState('');
  const [amountStatus, setAmountStatus] = useState<FieldStatus | undefined>(undefined);
  const [receive, setReceive] = useState('');
  const [bonus, setBonus] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true); // TODO: Change to 'false'
  const [saleConfig, setSaleConfig] = useState<any>(undefined);
  const [tokenPerDollar, setTokenPerDollar] = useState('');
  const [referralTokenPerDollar, setReferralTokenPerDollar] = useState('');
  const [remainingSupply, setRemainingSupply] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [receiveStatus, setReceiveStatus] = useState<FieldStatus | undefined>(undefined);
  const [referralAddressMessage, setReferralAddressMessage] = useState('');
  const [copyButtonClicked, setCopyButtonClicked] = useState(false);
  const [claims, setClaims] = useState([]);
  const [goToCart, setGoToCart] = useState(false);

  const l2Balances = assets.reduce((r, a) => {
    r[a.symbol] = useL2BalanceIndicator(a);
    return r;
  }, {});

  const config = useConfig();
  const transactionLimit = asset?.symbol && config.txAmountLimits[asset.symbol];
  const maxChainableValue = !address ? undefined : useMaxSendValue(
    SendMode.SEND, 
    asset.id, 
    TxSettlementTime.NEXT_ROLLUP, 
    EthAddress.fromString(address)
  );
  const maxOutput = max(min(maxChainableValue?.value || 0n, transactionLimit || 0n), 0n);

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
  }, []);

  useEffect(() => {
    async function run() {
      const result = await fetch(`${configuration.tokenShopUrl}/sale/config`);
      if (result.status != 200) throw new Error('Could not get donation config from server!');
      const config = (await result.json()).data;
      setSaleConfig(config);
    }
    run();
  }, []);

  useEffect(() => {
    if (!amount || !saleConfig) return;
    const tokenPrice = asset.symbol == 'DAI' ? saleConfig.daiPrice : saleConfig.ethPrice;
    const etherAmount = ethers.utils.parseEther(amount);
    const receive = etherAmount.div(ethers.BigNumber.from(tokenPrice));
    const bonus = receive.div(10);
    setReceive(receive.toString());
    setBonus(bonus.toString());
  }, [amount, saleConfig, asset]);

  useEffect(() => {
    if (!saleConfig) return;
    const tokenPerDollar = ethers.utils.parseEther(`1`).div(ethers.BigNumber.from(saleConfig.price.amount));
    setTokenPerDollar(tokenPerDollar.toString());
    setReferralTokenPerDollar(tokenPerDollar.div(10).toString());
    setRemainingSupply(parseInt(ethers.utils.formatEther(saleConfig.remaining).toString()).toString());
    setTotalSupply(parseInt(ethers.utils.formatEther(saleConfig.supply).toString()).toString());

  }, [saleConfig]);

  useEffect(() => {
    if (!amount) {
      setAmountStatus(undefined);
      return;
    }
    setAmountStatus(ethers.utils.parseEther(amount).toBigInt() > maxOutput ? 
      FieldStatus.Error 
      : 
      FieldStatus.Success
    );

  }, [asset, amount, maxOutput]);

  useEffect(() => {
    if (!receive || !remainingSupply) return;
    if (BigInt(receive) > BigInt(remainingSupply)) {
      setReceiveStatus(FieldStatus.Error);
    }
    else {
      setReceiveStatus(undefined);
    }

    updateReferral(referralAddress);

  }, [receive, remainingSupply]);

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

      if (receive && bonus && remainingSupply && (BigInt(receive) + BigInt(bonus)) > BigInt(remainingSupply)) {
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

  if (saleConfig === null) {
    return (
      <div 
        className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
        style={{ minHeight: "15em" }}
      >
        Donations no longer accepted.
      </div>
    );
  }

  return (
    <>
      <ShopCart asset={asset} paid={amount ? ethers.utils.parseEther(amount).toBigInt() : undefined}
        userId={accountState?.userId} goToCart={goToCart} setGoToCart={setGoToCart} address={address}
        receive={receive ? ethers.utils.parseEther(receive).toBigInt() : undefined} referralAddress={referralAddress}
        referralAmount={bonus ? ethers.utils.parseEther(bonus).toBigInt() : undefined}
      />

      <Terms address={address} termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted} />

      <div style={{display: termsAccepted ? "flex" : "none", flexDirection: 'column', gap: '40px'}}>
        <div className={style.cardRow}>
          <div
            className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
            style={{ minWidth: '25em' }}
          >
            <div className={style.donateTitle}>Donate to Earn</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em', alignItems: 'center'}}>
              <div className={style.donateText} style={{ display: tokenPerDollar ? 'block' : 'none' }}>
                $1 donation earns {tokenPerDollar} eNATA
              </div>
              <div className={style.donateText} style={{ display: referralTokenPerDollar ? 'block' : 'none' }}>
                $1 donation earns your referral {referralTokenPerDollar} eNATA
              </div>
              <div className={style.donateText} style={{ display: saleConfig ? 'block' : 'none' }}>
                { remainingSupply } / { totalSupply } remaining
              </div>
            </div>
            <div className={style.donateTitle}>Your Referral Link</div>
            <div style={{ display: address ? 'flex' : 'none', gap: '1rem' }}>
              <a href={`https://natanetwork.io/donate?ref=${address}`} target='_blank' rel='noopener noreferrer'
                className={style.donateText} style={{ wordBreak: 'break-all' }}
              >
                https://natanetwork.io/donate?ref={address}
              </a>
              <button
                disabled={copyButtonClicked} 
                style={{ background: 'none', border: 'none', cursor: copyButtonClicked ? 'default' : 'pointer',
                  opacity: copyButtonClicked ? '0.5' : '1'
                }}
                onClick={(e) => {
                  navigator.clipboard.writeText(`https://natanetwork.io/donate?ref=${address}`);
                  setCopyButtonClicked(true);
                  setTimeout(() => {
                    setCopyButtonClicked(false);
                  }, 1000);
                }}>
                <img style={{ width: '1.25rem' }} src={ Copy } />
              </button>
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
                message={amountStatus == FieldStatus.Error ? 
                  `Insufficient balance, max allowed ${ethers.utils.formatEther(maxOutput)} zk${asset.symbol}` 
                  : 
                  ""
                }
                allowAssetSelection={true}
                assetOptions={assetOptions}
                selectedAsset={asset}
                onChangeAsset={(id) => setAsset(assets.find((a) => a.id == id)!)}
                balance={l2Balances[asset.symbol]}
                onClickBalanceIndicator={() => {
                  setAmount(ethers.utils.formatEther(maxOutput));
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
            <Button text="Donate" 
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
          { claims.map((claim) => <Claim />) }
          <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
            style={{ width:'100%', display: claims.length == 0 ? 'flex' : 'none' }}
          >
            No claim history
          </div>
        </div>
      </div>
    </>
  );
}