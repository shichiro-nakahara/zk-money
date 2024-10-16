import { FormWarning, Hyperlink } from '../../ui-components/index.js';
import style from './sunset_warning.module.scss';

export function SunsetWarning() {
  return (
    <FormWarning
      className={style.formWarning}
      text={
        <div className={style.text}>
          We are sunsetting Nata Network. Deposits are now closed, but withdrawals are enabled.
          <br />
          Please withdraw your funds before 31st December 2024.
        </div>
      }
    />
  );
}
