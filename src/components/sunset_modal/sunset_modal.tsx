import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, CloseMiniIcon, Hyperlink } from '../../ui-components/index.js';
import { Pages } from '../../views/views.js';
import { ReactComponent as Background } from './background.svg';
import { ReactComponent as Graphic } from './graphic.svg';
import style from './sunset_modal.module.scss';

const SUNSET_MESSAGE_DISMISSED = 'sunset_message_dismissed';

export function SunsetModal() {
  const navigate = useNavigate();
  const [isSunsetMessageDismissed, setIsSunsetMessageDismissed] = useState(true);

  useEffect(() => {
    const sunsetMessageDismissed = !!localStorage.getItem(SUNSET_MESSAGE_DISMISSED);
    setIsSunsetMessageDismissed(sunsetMessageDismissed);
  }, []);

  function handleClose(e) {
    e.preventDefault();
    setIsSunsetMessageDismissed(true);
    localStorage.setItem(SUNSET_MESSAGE_DISMISSED, 'true');
  }

  function handleWithdraw(e) {
    handleClose(e);
    navigate(Pages.BALANCE);
  }

  if (isSunsetMessageDismissed) return null;

  return (
    <div className={style.overlay}>
      <div className={style.modal}>
        <Background className={style.background} />
        <div className={style.closeButton} onClick={handleClose}>
          <CloseMiniIcon />
        </div>
        <div className={style.title}>Nata Network is sunsetting</div>
        <div className={style.columns}>
          <div className={style.content}>
            <div className={style.subtitle}>
              <b>What does this mean?</b>
            </div>
            <div className={style.body}>
              We are sunsetting Nata Network and the infrastructure that powers it.
              <br />
              <br />
              Please with withdraw your funds immediately. Withdrawals will be available until 31st December 2024. <b>All user deposits will remain safe.</b> <br />
            </div>
            <Button className={style.learnMoreButton} onClick={handleWithdraw} text="Withdraw Funds" />
          </div>
          <Graphic className={style.graphic} />
        </div>
      </div>
    </div>
  );
}
