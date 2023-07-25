import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { Button } from '../../../../ui-components/index.js';
import { Answer } from './Answer.js';

export function Question({
  question,
  handleContinue
}) {
  const [canContinue, setCanContinue] = useState(false);

  function answerClicked(index) {
    if (question.answers[index].valid) setCanContinue(true);
  }

  return (
    <div style={{width: "100%", display: "flex", flexDirection: "column", gap: "20px"}}>
      <div>{question.question}</div>
      <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
        {
          question.answers.map((answer, index) => 
            <Answer key={index} text={answer.text} valid={answer.valid} onClick={()=> answerClicked(index)}/>
          )
        }
      </div>
      <CSSTransition
        timeout={500}
        classNames="fast-fade"
        in={canContinue}
        unmountOnExit
      >
        <div style={{marginTop: "0.5em"}}>
          <Button text="Continue" onClick={handleContinue} />
        </div>
      </CSSTransition>
    </div>
  );
}