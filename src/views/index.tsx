import { useContext, useEffect, useState } from 'react';
import { Location, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { TopLevelContext } from '../alt-model/top_level_context/top_level_context.js';
import { useAccountState } from '../alt-model/account_state/index.js';
import { DefiRecipe } from '../alt-model/defi/types.js';
import wave from '../images/wave.svg';

import { Template } from '../components/index.js';
import { Config } from '../config.js';
import { PageTransitionHandler } from '../page_transition_handler.js';
import { Pages } from './views.js';
import { getTOSToast } from './toasts/toast_configurations.js';
import { Navbar, Theme } from '../ui-components/index.js';
import { UserAccountMenu } from '../components/template/user_account_menu.js';
import { Balance } from './account/dashboard/balance.js';
import { Earn } from './account/dashboard/earn.js';
import { DefiModal, DefiModalProps } from './account/dashboard/modals/defi_modal/defi_modal.js';
import { Home } from './home.js';
import { Toasts } from './toasts/toasts.js';
import { useL1PendingBalances } from '../alt-model/assets/l1_balance_hooks.js';
import './app.css';
import { Airdrop } from './account/dashboard/airdrop.js';

function useShowTOS(config: Config) {
  const { toastsObs } = useContext(TopLevelContext);

  useEffect(() => {
    if (config && !config.tosAccepted) {
      toastsObs.addToast(getTOSToast(toastsObs, config));
    }
  }, [config, toastsObs]);
}

function getTheme(location: Location) {
  return location.pathname === Pages.HOME ? Theme.GRADIENT : Theme.WHITE;
}

interface ViewsProps {
  config: Config;
}

export function Views({ config }: ViewsProps) {
  const { pendingBalancesObs } = useContext(TopLevelContext);
  const [defiModalProps, setDefiModalProps] = useState<DefiModalProps>();
  const navigate = useNavigate();
  const pendingBalances = useL1PendingBalances();
  const accountState = useAccountState();
  const location = useLocation();
  const theme = getTheme(location);
  const hasAccountState = !!accountState;
  const isLoggedIn = !!accountState?.isRegistered;

  useEffect(() => {
    pendingBalancesObs.set(pendingBalances);
  }, [pendingBalancesObs, pendingBalances]);

  const handleCloseDefiModal = () => {
    setDefiModalProps(undefined);
  };
  const handleOpenDefiEnterModal = (recipe: DefiRecipe) => {
    setDefiModalProps({ recipe, flowDirection: 'enter', onClose: handleCloseDefiModal });
  };
  const handleOpenDefiExitModal = (recipe: DefiRecipe) => {
    setDefiModalProps({ recipe, flowDirection: 'exit', onClose: handleCloseDefiModal });
  };

  useShowTOS(config);

  const isInAccessPage = location.pathname === Pages.BALANCE && (!isLoggedIn || accountState?.isSyncing);
  const shouldCenterContent = location.pathname === Pages.TRADE || isInAccessPage;

  return (
    <>
      <Template theme={theme} explorerUrl={config.explorerUrl}>
        {location.pathname === '/' && <img className={'wave'} src={wave} alt="" />}
        <Navbar
          path={location.pathname}
          theme={theme}
          pendingBalances={pendingBalances}
          isUserRegistered={accountState?.isRegistered}
          accountComponent={hasAccountState ? <UserAccountMenu /> : undefined}
        />
        <TransitionGroup
          style={{
            margin: shouldCenterContent ? 'auto 0' : 'initial',
            maxWidth: location.pathname === '/' ? 'initial' : 'calc(1350px + 20%)',
            padding: location.pathname === '/' ? 'initial' : '0 10%',
            alignSelf: 'center',
            width: '100%',
          }}
        >
          <CSSTransition key={location.pathname} classNames="fade" timeout={250}>
            <Routes location={location.pathname}>
              <Route path={Pages.AIRDROP} element={<Airdrop />} />
              <Route path={Pages.EARN} element={<Earn isLoggedIn={isLoggedIn} />} />
              <Route path={Pages.BALANCE} element={<Balance onOpenDefiExitModal={handleOpenDefiExitModal} />} />
              <Route path={Pages.HOME} element={<Home onSignup={() => navigate(Pages.BALANCE)} />} />
              <Route
                path="*"
                element={
                  <Template theme={Theme.WHITE} explorerUrl={config.explorerUrl}>
                    <div>Not Found</div>
                  </Template>
                }
              />
            </Routes>
          </CSSTransition>
        </TransitionGroup>
        <Toasts />
        {defiModalProps && <DefiModal {...defiModalProps} />}
      </Template>
      <PageTransitionHandler />
    </>
  );
}