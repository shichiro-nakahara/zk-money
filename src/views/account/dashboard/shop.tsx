import style from './shop.module.scss';
import { bindStyle, Field, FieldStatus } from '../../../ui-components/index.js';
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

const cx = bindStyle(style);

interface ShopProps {
  isLoggedIn: boolean;
}

export function Shop(props: ShopProps) {
  const { isLoggedIn } = props;
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
  const [termsAccepted, setTermsAccepted] = useState(true); // TODO: Change to 'false'
  const [saleConfig, setSaleConfig] = useState<any>(undefined);

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
    if (!isLoggedIn) navigate(Pages.BALANCE);
  }, []);

  useEffect(() => {
    async function run() {
      const result = await fetch(`${configuration.tokenShopUrl}/sale/config`);
      const config = (await result.json()).data;
      if (!config) throw new Error(`Could not get token shop sale config from server`);
      setSaleConfig(config);
    }
    run();
  }, []);

  useEffect(() => {
    if (!amount || !saleConfig || !saleConfig.current) return;
    const tokenPrice = asset.symbol == 'DAI' ? saleConfig.current.daiPrice : saleConfig.current.ethPrice;
    const etherAmount = ethers.utils.parseEther(amount);
    const receive = etherAmount.div(ethers.BigNumber.from(tokenPrice));
    setReceive(receive.toString());
  }, [amount, saleConfig, asset]);

  if (saleConfig && !saleConfig.current) {
    return (
      <div 
        className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
        style={{ minHeight: "15em" }}
      >
        Sale has concluded.
      </div>
    );
  }

  return (
    <>
      <Terms address={address} termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted} />

      <div className={style.cardRow} style={{display: termsAccepted ? "flex" : "none"}}>
        <div
          className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
          style={{ minWidth: '25em', fontSize: "1rem" }}
        >
          <div>
            <div>Pre-sale Price</div>
            <div>$0.0005 per eNATA</div>
            <div>FDV Marketcap $5,000,000</div>
            <div>2.5% total Supply available | X remaining | (Pre-sale Ended)</div>
          </div>

          <div>
            <div>Public Sale Price</div>
            <div>$0.001 per eNATA</div>
            <div>FDV Marketcap $10,000,000</div>
            <div>2.5% total Supply available | Pre-sale Active</div>
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
              value={referralAddress}
              label="Referral Address (10% Bonus)"
              placeholder="Enter address"
              status={referralAddressStatus}
              message={referralAddressStatus == FieldStatus.Error ? "Please enter a valid Polygon address" : ""}
              onChangeValue={(value: string) => {
                if (!value) {
                  setReferralAddress('');
                  setReferralAddressStatus(undefined);
                  return;
                }
                try {
                  const validAddress = ethers.utils.getAddress(value);
                  setReferralAddress(validAddress);
                  setReferralAddressStatus(FieldStatus.Success);
                }
                catch (e) {
                  setReferralAddress(value);
                  setReferralAddressStatus(FieldStatus.Error);
                }
              }}
            />
          </div>
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
              onChangeValue={(value: string) => {
                const amount = value.replace(/[^0-9.]/g, '');
                setAmount(amount);
                setAmountStatus(ethers.utils.parseEther(amount).toBigInt() > maxOutput ? 
                  FieldStatus.Error 
                  : 
                  FieldStatus.Success
                );
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
            />
          </div>
          <Button text="Purchase" 
            onClick={() => console.log('buy')} 
            style={{width: '100%', marginTop: '-2.5rem'}}
            disabled={amountStatus != FieldStatus.Success || referralAddressStatus == FieldStatus.Error}
          />
        </div>
      </div>
    </>
  );
}