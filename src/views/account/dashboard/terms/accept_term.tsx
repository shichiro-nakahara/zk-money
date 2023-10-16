import { CSSTransition } from 'react-transition-group';
import style from './terms.module.scss';
import circleIcon from '../../../../images/quiz_circle.svg';
import circleCheckIcon from '../../../../images/quiz_check_circle_bg.svg';
import { useState } from 'react';
import './terms.animation.scss';

export function AcceptTerm({
  text,
  onClick
}) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    setClicked(!clicked);
    onClick(!clicked);
  }

  return (
    <div className={style.acceptTerm} onClick={handleClick}>
      <div style={{display: "grid"}}>
        <CSSTransition
          timeout={500}
          classNames="fast-fade"
          in={!clicked}
        >
          <img src={circleIcon} className={style.acceptTermIcon} />
        </CSSTransition>
        <CSSTransition
          timeout={500}
          classNames="fast-fade"
          in={clicked}
          unmountOnExit
        >
          <img src={circleCheckIcon} className={style.acceptTermIcon} />
        </CSSTransition>
      </div>
      <div className={style.acceptTermText}>
        {text}
      </div>
    </div>
  );
}