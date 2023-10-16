import style from './shop.module.scss';
import { bindStyle, Field, FieldStatus } from '../../../ui-components/index.js';
import cardWrapperStyle from '../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import { Button, ButtonTheme } from '../../../ui-components/index.js';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Terms } from './terms/terms.js';
import { RemoteAsset } from '../../../alt-model/types.js';
import { useRemoteAssets } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import { useL2BalanceIndicator } from './modals/sections/amount_section/mini_balance_indicators.js';

const cx = bindStyle(style);

interface ShopProps {
}

export function Shop(props: ShopProps) {
  const assets = useRemoteAssets().filter((a) => a.symbol != 'MATIC');
  const assetOptions = assets.map((a) => { return { value: a.id, label: `zk${a.symbol}` }; });

  const [address, setAddress] = useState('');
  const [referralAddress, setReferralAddress] = useState('');
  const [referralAddressStatus, setReferralAddressStatus] = useState<FieldStatus | undefined>(undefined);
  const [asset, setAsset] = useState<RemoteAsset>(assets[1]);

  const l2Balance = useL2BalanceIndicator(assets[1]);

  console.log(l2Balance);

  return (
    <>
      <Terms address={address} setAddress={setAddress} />

      <div className={style.cardRow} style={{display: address ? "flex" : "none"}}>
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
          <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <Field
                value={address}
                label="Your Polygon Address"
                placeholder="Enter address"
                disabled={true}
              />
            </div>
            <Button text="Change" theme={ButtonTheme.Secondary} onClick={() => setAddress('')} />
          </div>
          <div style={{ marginTop: '-2.5rem', width: '100%' }}>
            <Field
              value={referralAddress}
              label="Referral Address (10% Bonus)"
              placeholder="Enter address"
              status={referralAddressStatus}
              onChangeValue={(value: string) => {
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
          <div style={{ marginTop: '-2.5rem', width: '100%' }}>
            <Field
              value={referralAddress}
              label="Amount"
              placeholder="Enter address"
              status={referralAddressStatus}
              message={referralAddressStatus == FieldStatus.Error ? "Please enter a valid Polygon address" : ""}
              allowAssetSelection={true}
              assetOptions={assetOptions}
              selectedAsset={asset}
              onChangeAsset={(id) => setAsset(assets.find((a) => a.id == id)!)}
              balance={l2Balance}
              onClickBalanceIndicator={() => console.log('wtf')}
              onChangeValue={(value: string) => {
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
          
        </div>
      </div>
    </>
  );
}