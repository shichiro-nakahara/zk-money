import style from './claim.module.scss';
import { bindStyle } from '../../../ui-components/util/classnames.js';

const cx = bindStyle(style);

interface ClaimProps {
}

export function Claim() {
  return (
    <div className={style.root}>
      <div className={cx(style.segment, style.firstSegment)}>
        Drop 1
      </div>
      <div className={cx(style.segment, style.valueField)}>
        <div className={style.value}>2000 eNATA</div>
      </div>
      <div className={cx(style.segment, style.feeField)}>
        <div className={style.fee}>0x00</div>
      </div>
      <div className={cx(style.segment, style.lastSegment)}>
        <div className={style.time}>
          Claim
        </div>
      </div>
    </div>
  );
}