import { Link, useLocation } from 'react-router-dom';
import { ReactComponent as MobileNavbarWallet } from '../../../images/mobile_navbar_wallet.svg';
import { ReactComponent as Clock } from '../../images/clock.svg';
import { bindStyle } from '../../util/classnames.js';
import { PendingBalances } from '../../../alt-model/top_level_context/pending_balances_obs.js';
import style from './navbar.module.scss';
import { useConfig } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import { Pages } from '../../../views/views.js';
import { useDropContext } from '../../../context/drop_context.js';
import { Dot } from '../../../components/dot.js';
import { useEffect, useState } from 'react';
import New from '../../../images/new-rectangle.svg';

const cx = bindStyle(style);

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export enum Theme {
  GRADIENT = 'GRADIENT',
  WHITE = 'WHITE',
}

interface NavbarProps {
  path?: string;
  theme?: Theme;
  isUserRegistered?: boolean;
  pendingBalances?: PendingBalances;
  onChange?: (path: string) => void;
  // NOTE: This is receiving an AccountComponent
  //     this should instead receive an AccountState and
  //     render the AccountComponent within here
  //     this will happen once we migrate AccountComponent to Storybook
  accountComponent?: JSX.Element;
}

interface LinkItem {
  url: string;
  label: string;
  mobileImage: JSX.Element;
  disabled?: boolean;
}

const LINKS: LinkItem[] = [];

export function Navbar({
  theme,
  isUserRegistered,
  accountComponent,
  pendingBalances,
  onChange,
}: NavbarProps): JSX.Element {
  const location = useLocation();
  const config = useConfig();
  const dropContext = useDropContext();

  const [hasClaimable, setHasClaimable] = useState(false);

  useEffect(() => {
    if (!dropContext.claims) return;
    for (const claim of dropContext.claims) {
      if (claim.id && !claim.hasClaimed) {
        setHasClaimable(true);
        return;
      }
    }

  }, [dropContext.claims]);

  return (
    <div className={style.headerRoot}>
      <div className={cx(style.logoRoot, { enabled: !!onChange })}>
        <Link to={Pages.HOME} className={style.headerTitle}>
          Nata Network
        </Link>
      </div>

      <div className={style.accountRoot}>
        <Link
          to="https://app.natarouter.com"
          className={cx(style.link, isSafari && style.noLetterSpacing, style.navLink, {
            white: theme === Theme.WHITE,
            gradient: theme === Theme.GRADIENT,
          })}
          target='_blank'
          rel='noreferrer noopener'
        >
          <MobileNavbarWallet className={style.mobileImage} />
          <div style={{ display: 'flex', alignItems: 'center'}}>
            <div>Router</div>
            <img src={ New } style={{ 
                width: '2.5em', marginLeft: '0.5em', marginBottom: '2px',
                filter: 'invert(12%) sepia(27%) saturate(1570%) hue-rotate(223deg) brightness(101%) contrast(96%)'
              }} 
            />
          </div>
        </Link>
        <Link
          to={Pages.SHOP}
          className={cx(style.link, isSafari && style.noLetterSpacing, style.navLink, {
            active: Pages.SHOP === location.pathname,
            white: theme === Theme.WHITE,
            gradient: theme === Theme.GRADIENT,
          })}
          style={{
            pointerEvents: config.tosAccepted && isUserRegistered ? 'inherit' : 'none',
            opacity: config.tosAccepted && isUserRegistered ? 1 : 0.5,
          }}
        >
          <MobileNavbarWallet className={style.mobileImage} />
          <div style={{ display: 'flex', alignItems: 'center'}}>
            { hasClaimable ? <Dot className={style.dot} size="xs" color="green" /> : null }
            <div>Donate</div>
          </div>
        </Link>
        <Link
          to={Pages.AIRDROP}
          className={cx(style.link, isSafari && style.noLetterSpacing, style.navLink, {
            active: Pages.AIRDROP === location.pathname,
            white: theme === Theme.WHITE,
            gradient: theme === Theme.GRADIENT,
          })}
          style={{
            pointerEvents: config.tosAccepted && isUserRegistered ? 'inherit' : 'none',
            opacity: config.tosAccepted && isUserRegistered ? 1 : 0.5,
          }}
        >
          <MobileNavbarWallet className={style.mobileImage} />
          Airdrop
        </Link>
        <Link
          to={Pages.EARN}
          className={cx(style.link, isSafari && style.noLetterSpacing, style.navLink, {
            active: Pages.EARN === location.pathname,
            white: theme === Theme.WHITE,
            gradient: theme === Theme.GRADIENT,
          })}
          style={{
            pointerEvents: config.tosAccepted && isUserRegistered ? 'inherit' : 'none',
            opacity: config.tosAccepted && isUserRegistered ? 1 : 0.5,
          }}
        >
          <MobileNavbarWallet className={style.mobileImage} />
          Earn
        </Link>
        <Link
          to={Pages.BALANCE}
          className={cx(style.link, isSafari && style.noLetterSpacing, style.navLink, {
            active: Pages.BALANCE === location.pathname,
            white: theme === Theme.WHITE,
            gradient: theme === Theme.GRADIENT,
          })}
          style={{
            pointerEvents: config.tosAccepted ? 'inherit' : 'none',
            opacity: config.tosAccepted ? 1 : 0.5,
          }}
        >
          <MobileNavbarWallet className={style.mobileImage} />
          {isUserRegistered ? 'Wallet' : 'Access'}
          {isUserRegistered && pendingBalances && Object.keys(pendingBalances).length > 0 ? (
            <Clock className={style.alert} />
          ) : null}
        </Link>
      </div>
      {isUserRegistered ? <div className={style.accountComponent}>{accountComponent}</div> : null}
    </div>
  );
}
