import { useState, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import { Quiz } from './quiz/Quiz.js';
import { bindStyle } from '../../../ui-components/index.js';
import cardWrapperStyle from '../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import './airdrop.animation.scss';
import style from './airdrop.module.scss';
import circleCheckIcon from '../../../images/quiz_check_circle_bg.svg';
import { Button } from '../../../ui-components/index.js';
import { ClaimDropModal } from './modals/claim_drop_modal/claim_drop_modal.js';
import * as drop from '../../../app/drop.js';
import { useAccountStateManager } from '../../../alt-model/top_level_context/top_level_context_hooks.js';
import { useSigner } from 'wagmi';
import { useObs } from '../../../app/util/index.js';
import { Pages } from '../../views.js';
import { useNavigate } from 'react-router-dom';

const questions = [
  {
    question: "Transactions inside Nata Network's zkRollup are...",
    answers: [
      {
        text: "End-to-end encrypted and fully private",
        valid: true
      },
      {
        text: "Public",
        valid: false
      },
      {
        text: "Expensive",
        valid: false
      },
      {
        text: "Unsecured",
        valid: false
      }
    ]
  },
  {
    question: "Nata Network is a fork of...",
    answers: [
      {
        text: "Aave",
        valid: false
      },
      {
        text: "Compound",
        valid: false
      },
      {
        text: "Aztec",
        valid: true
      },
      {
        text: "yEarn",
        valid: false
      }
    ]
  },
  {
    question: "What is publically exposed when performing a transaction via Nata Network?",
    answers: [
      {
        text: "Transaction amount",
        valid: false
      },
      {
        text: "Destination address",
        valid: false
      },
      {
        text: "Sender address",
        valid: false
      },
      {
        text: "Nothing",
        valid: true
      }
    ]
  },
  {
    question: "A user must participate in every Earn epoch to avoid slashing and redeem $eNATA:$NATA at a 1:1 " +
      "ratio, true or false?",
    answers: [
      {
        text: "True",
        valid: true
      },
      {
        text: "False",
        valid: false
      }
    ]
  }
];

const cx = bindStyle(style);

interface AirdropProps {
  isLoggedIn: boolean;
}

export function Airdrop(props: AirdropProps) {
  const { isLoggedIn } = props;
  const navigate = useNavigate();
  const [quizComplete, setQuizComplete] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [tx, setTx] = useState(null);
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const { data: signer } = useSigner();

  useEffect(() => {
    if (!isLoggedIn) navigate(Pages.BALANCE);
  }, []);

  function handleComplete() {
    setQuizComplete(true);
  }

  async function claimDrop() {
    if (!accountState || !accountState.ethAddressUsedForAccountKey) {
      throw new Error('Could not claim drop, invalid state.');
    }
    if (!signer) {
      throw new Error('Could not claim, invalid signer. Please refresh page and try again.');
    }

    setTx(null);
    setClaiming(true);
    try {
      const tx = await drop.claim(
        signer, 
        accountState.ethAddressUsedForAccountKey.toString(), 
        0, // TODO: dropId 
        '51ed6f49-1ad1-4c10-8447-746592f13721' // TODO: dropUid
      );
      setTx(tx);
    }
    catch (e) {
      setClaiming(false);
      if (!e.toString().includes('user rejected transaction')) {
        throw new Error(e);
      }
    }
  }
  
  return (
    <div style={{display: "grid", width: "100%"}}>
      <CSSTransition
        timeout={1000}
        classNames="slow-fade"
        in={!quizComplete}
      >
        <div style={{gridRow: 1, gridColumn: 1}}>
          <Quiz 
            questions={questions}
            handleComplete={handleComplete}
          />
        </div>
      </CSSTransition>
      <CSSTransition
        timeout={1000}
        classNames="slow-fade"
        in={quizComplete}
        unmountOnExit
      >
        <div style={{gridRow: 1, gridColumn: 1}}>
          <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
            style={{display: "flex", flexDirection: "column", alignItems: "center"}}
          >
            <img src={circleCheckIcon} style={{height: "3em"}} />
            <div>Quiz Complete!</div>
            <div className={style.paragraphText} style={{textAlign: "center"}}>
              <div>
                To be eligible for this airdrop, your address must have deposited to one of the following protocols:
              </div>
              <div>Aztec v1</div>
              <div>Aztec v2</div>
              <div>RAILGUN</div>
              <div>Tornado Cash</div>
              <div>zkBob</div>
            </div>
            <div className={style.paragraphText}>
              Click{' '}
              <a href="https://gist.github.com/shichiro-nakahara/dba7b3fdb96dafaea0e4a15cd5777e94" target="_blank">
                here
              </a> for a list of eligible addresses.
            </div>
            <div style={{marginTop: "0.5em", width: "100%"}}>
              <Button text="Claim" onClick={claimDrop} />
            </div>
          </div>
          <ClaimDropModal visible={ claiming } txHash={ tx ? tx.hash : null } onClose={() => setClaiming(false)} />
        </div>
      </CSSTransition>
    </div>
  );
}
