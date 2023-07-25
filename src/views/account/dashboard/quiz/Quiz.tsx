import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { Question } from './Question.js';
import { bindStyle } from '../../../../ui-components/index.js';
import cardWrapperStyle from '../../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import style from './quiz.module.scss';
import './quiz.animation.scss';

const cx = bindStyle(style);

export function Quiz({
  questions,
  handleComplete
}) {
  const [questionIndex, setQuestionIndex] = useState(0);

  function handleContinue() {
    if (questionIndex >= questions.length -1 ) {
      handleComplete();
      return;
    }
    setQuestionIndex(questionIndex + 1);
  }

  return (
    <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}>
      <div>Question {questionIndex + 1} of {questions.length}</div>
      <div style={{display: "grid", width: "100%"}}>
        {
          questions.map((question, index) => 
            <CSSTransition
              key={index}
              timeout={500}
              classNames="fast-fade"
              in={questionIndex == index}
              unmountOnExit
            >
              <div style={{gridColumn: 1, gridRow: 1}}>
                <Question question={question} handleContinue={handleContinue} />
              </div>
            </CSSTransition>
          )
        }
      </div>
    </div>
  );
}