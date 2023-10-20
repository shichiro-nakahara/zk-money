import style from './claim.module.scss';
import { bindStyle } from '../../../ui-components/util/classnames.js';
import { useEffect, useState } from 'react';
import { useAccountStateManager } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import { useObs } from '../../../app/util/index.js';
import { ethers } from 'ethers';
import { CopyButton } from '../../../ui-components/components/copy_button/copy_button.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import { Button } from '../../../ui-components/index.js';
import { configuration } from '../../../config.js';
import * as drop from '../../../app/drop.js';

const cx = bindStyle(style);

dayjs.extend(utc);
dayjs.extend(advancedFormat);

enum Type {
  DONATION,
  REFERRAL
}

interface ClaimProps {
  address: string;
  amount: bigint;
  tokenDropUid: undefined | string;
  name: undefined | string;
  referralAddress: undefined | string;
  referralAmount: undefined | bigint;
  onClaimDrop: Function;
  id: null | number;
}

export function Claim(props: ClaimProps) {
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const address = accountState ? accountState.ethAddressUsedForAccountKey.toString() : '';

  const [type, setType] = useState(Type.DONATION);
  const [hasClaimed, setHasClaimed] = useState(false);

  useEffect(() => {
    if (!address) return;
    setType(address == props.address ? Type.DONATION : Type.REFERRAL);
  }, [props.address, address]);

  useEffect(() => {
    if (!props.id) return;
    async function run() {
      const provider = new ethers.providers.JsonRpcProvider(configuration.ethereumHost);
      const contract = (await drop.getContract()).connect(provider);
      try {
        const hasClaimed = await contract.hasClaimed(props.id, address);
        setHasClaimed(hasClaimed);
      }
      catch (e) {
        console.error(e);
        throw new Error(`Could not get claimed status for ${address}`);
      }
    }
    run();

  }, [props.id]);

  function getAmount() {
    if (type == Type.DONATION && props.referralAddress == address) {
      return `${parseInt(ethers.utils.formatEther(props.amount))} + ` +
        `${parseInt(ethers.utils.formatEther(props.referralAmount!))} eNATA`
    }
    if (type == Type.DONATION) {
      return `${parseInt(ethers.utils.formatEther(props.amount))} eNATA`;
    }
    return `${parseInt(ethers.utils.formatEther(props.referralAmount!))} eNATA`;
  }

  return (
    <div className={style.root}>
      <div className={cx(style.segment, style.firstSegment)}>
        { props.name ? `Drop ${props.name}` : 'Pending Drop'}
      </div>
      <div className={cx(style.segment, style.valueField)}>
        <div className={style.value}>{ getAmount() }</div>
      </div>
      <div className={cx(style.segment, style.feeField)}>
        <div className={style.fee}>
          { 
            type == Type.DONATION ? 
              'Donation' 
              : 
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Referred by {props.address.substring(0, 6)}...{
                  props.address.substring(props.address.length - 3, props.address.length)
                }
                <CopyButton text={props.address} iconWidth='1rem' />
              </div> 
          }
        </div>
      </div>
      <div className={cx(style.segment, style.lastSegment)}>
        <div className={style.time}>
          {
            props.id !== null ?
              <Button text={hasClaimed ? 'Claimed' : 'Claim'} onClick={() => props.onClaimDrop()} 
                disabled={hasClaimed} 
              />
              :
              `Claim after 00:00:00 (UTC)`
          }
        </div>
      </div>
    </div>
  );
}