import { CSSTransition } from 'react-transition-group';
import style from './quiz.module.scss';
import circleIcon from '../../../../images/quiz_circle.svg';
import circleCheckIcon from '../../../../images/quiz_check_circle_bg.svg';
import circleXIcon from '../../../../images/quiz_x_circle_bg.svg';
import { useState } from 'react';
import './quiz.animation.scss';

export function Answer({
  text,
  valid,
  onClick
}) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    setClicked(true);
    onClick();
  }

  return (
    <div className={style.answer} onClick={handleClick}>
      <div style={{display: "grid"}}>
        <CSSTransition
          timeout={500}
          classNames="fast-fade"
          in={!clicked}
        >
          <img src={circleIcon} className={style.answerIcon} />
        </CSSTransition>
        <CSSTransition
          timeout={500}
          classNames="fast-fade"
          in={clicked && valid}
          unmountOnExit
        >
          <img src={circleCheckIcon} className={style.answerIcon} />
        </CSSTransition>
        <CSSTransition
          timeout={500}
          classNames="fast-fade"
          in={clicked && !valid}
          unmountOnExit
        >
          <img src={circleXIcon} className={style.answerIcon} />
        </CSSTransition>
      </div>
      <div className={style.answerText}>
        {text}
      </div>
    </div>
  );
}