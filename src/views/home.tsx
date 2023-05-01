import Cookies from 'js-cookie';

import { Button } from '../ui-components/index.js';
import privateUnderline from '../images/underline.svg';
import arrow from '../images/arrow.svg';

import sendReceive from '../images/send_receive.svg';
import shieldFunds from '../images/shield_funds.png';

import whyZkMoney1 from '../images/why_zkmoney_1.svg';
import whyZkMoney2 from '../images/why_zkmoney_2.svg';

import polyAztecLogo from '../images/poly_aztec_logo.svg';

import { bindStyle } from '../ui-components/util/classnames.js';
import { DefiRecipe } from '../alt-model/defi/types.js';
import style from './home.module.scss';

const cx = bindStyle(style);

interface HomeProps {
  onSignup: () => void;
  recipes?: DefiRecipe[];
}

export function Home({ onSignup, recipes }: HomeProps) {
  return (
    <div className={style.homeWrapper}>
      <Banner onShieldNow={onSignup} recipes={recipes} />
      <div className={style.section}>
        <div className={style.sectionTitle}>How do I use PolyAztec?</div>
        <div className={style.steps}>
          <div className={style.step}>
            <div className={style.number}>1</div>
            <div className={style.line} />
            <div className={style.content}>
              <div className={style.title}>Shield funds</div>
              <div className={style.description}>
                Connect your Polygon wallet to shield funds to PolyAztec and register an account alias.
              </div>
            </div>
            <img src={shieldFunds} className={style.stepImage} alt="" />
          </div>
          <div className={style.step}>
            <div className={style.number}>2</div>
            <div className={style.content}>
              <div className={style.title}>Send and receive privately</div>
              <div className={style.description}>
                Funds within PolyAztec can be sent fully privately to another PolyAztec alias or sent to Layer 1. Remember to
                follow privacy best practices!
              </div>
            </div>
            <img src={sendReceive} className={style.stepImage} alt="" />
          </div>
        </div>
      </div>
      <div className={style.section}>
        <div className={style.sectionTitle}>Why PolyAztec?</div>
        <div className={style.howItWorksWrapper}>
          <img className={cx(style.whyZk, style.whyImage1)} src={whyZkMoney1} alt="" />
          <img className={cx(style.whyZk, style.whyImage2)} src={whyZkMoney2} alt="" />
          <div className={style.contentWrapper}>
            <div className={style.content}>
              <div className={style.title}>How does shielding work?</div>
              <div className={style.description}>
                Shielding funds to PolyAztec creates a private note on Layer 2. Private notes can be traded 
                just like normal Polygon assets–but with full privacy protection.
              </div>
            </div>
          </div>
          <div className={style.contentWrapper}>
            <div className={style.content}>
              <div className={style.title}>Privacy by default</div>
              <div className={style.description}>
                Using PolyAztec means full privacy without having to opt-in. All transactions are default
                privacy-shielded. Learn more about best practices here.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Banner({ onShieldNow, recipes }: { onShieldNow: () => void; recipes: DefiRecipe[] | undefined }) {
  return (
    <div className={style.banner}>
      <div className={style.stack}>
        <div className={style.polyAztecWrapper}>
          <img className={style.polyAztecLogo} src={polyAztecLogo} alt="" />
        </div>
      </div>
      <img src={arrow} className={style.arrow} alt="" />
      <div className={style.text}>
        <div className={style.title}>
          {`The `}
          <span className={style.bold}>
            private <img src={privateUnderline} className={style.underline} alt="Underline" />
          </span>
          transaction layer for Polygon.
        </div>
        <div className={style.subtitle}>
        PolyAztec is your portal to private Polygon transactions. Shield
          funds to start accessing!
        </div>
        <Button text="Shield Now" onClick={onShieldNow} className={style.shieldButton} disabled={Cookies.get('tos_accepted') !== 'true'}/>
      </div>
    </div>
  );
}