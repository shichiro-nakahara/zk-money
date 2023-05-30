import { Link, useLocation } from 'react-router-dom';
import { ReactComponent as MobileNavbarWallet } from '../../../images/mobile_navbar_wallet.svg';
import { ReactComponent as Clock } from '../../images/clock.svg';
import { bindStyle } from '../../util/classnames.js';
import { PendingBalances } from '../../../alt-model/top_level_context/pending_balances_obs.js';
import style from './navbar.module.scss';
import { useConfig } from '../../../alt-model/top_level_context/top_level_context_hooks.js';

const cx = bindStyle(style);

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

enum Pages {
  HOME = '/',
  EARN = '/earn',
  SEND = '/send',
  TRADE = '/trade',
  BALANCE = '/balance',
}

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

  return (
    <div className={style.headerRoot}>
      <div className={cx(style.logoRoot, { enabled: !!onChange })}>
        <Link to={Pages.HOME} className={style.headerTitle}>
          PolyAztec
        </Link>
      </div>

      <div className={style.accountRoot}>
        {LINKS.map(link => (
          <Link
            key={link.url}
            to={link.url}
            className={cx(style.link, isSafari && style.noLetterSpacing, style.navLink, link.label == 'Earn' && style.disabledLink, {
              active: link.url === location.pathname,
              white: theme === Theme.WHITE,
              gradient: theme === Theme.GRADIENT,
            })}
          >
            {link.mobileImage}
            {link.label}
          </Link>
        ))}
        <Link
          to={Pages.BALANCE}
          className={cx(style.link, isSafari && style.noLetterSpacing, style.navLink, {
            active: Pages.BALANCE === location.pathname,
            white: theme === Theme.WHITE,
            gradient: theme === Theme.GRADIENT,
          })}
          style={{
            pointerEvents: config.tosAccepted ? 'inherit' : 'none',
            opacity: config.tosAccepted ? 1 : 0.5
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
