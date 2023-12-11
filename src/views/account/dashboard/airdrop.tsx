import { useState, useEffect, Fragment } from 'react';
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
import { configuration } from '../../../config.js';
import * as ethers from 'ethers';
import AirdropImg from '../../../images/airdrop.png';

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
  const [eligible, setEligible] = useState(null);
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const { data: signer } = useSigner();

  useEffect(() => {
    if (!isLoggedIn) navigate(Pages.BALANCE);

  }, []);

  useEffect(() => {
    getEligible();

  }, [accountState]);

  function handleComplete() {
    setQuizComplete(true);
  }

  async function getEligible() {
    if (!accountState || !accountState.ethAddressUsedForAccountKey) return;

    const address = accountState.ethAddressUsedForAccountKey.toString();
    const resultDrop0 = await (await fetch(
      `${configuration.tokenDropUrl}/drop/01122c4f-30ac-489d-864a-53f2375f9829/address/${address}`
    )).json();
    const resultDrop1 = await (await fetch(
      `${configuration.tokenDropUrl}/drop/152a06b2-319f-40b8-835c-8d4a1e85609c/address/${address}`
    )).json();

    if (resultDrop0.status != 200 && resultDrop0.status != 404) {
      throw new Error(`Could not get address eligibility for Airdrop 0`);
    }

    if (resultDrop1.status != 200 && resultDrop1.status != 404) {
      throw new Error(`Could not get address eligibility for Airdrop 1`);
    }

    if (resultDrop0.status == 404 && resultDrop1.status == 404) {
      setEligible({
        isEligible0: false,
        isEligible1: false,
        message: <>
          <div>
            {address} does not qualify for any Airdrops.
          </div>
          <div>
            Click{' '}
            <a href="https://gist.github.com/shichiro-nakahara/dba7b3fdb96dafaea0e4a15cd5777e94" target="_blank">
              here
            </a> for a list of eligible addresses.
          </div>
        </>
      });
      return;
    }

    const provider = new ethers.providers.JsonRpcProvider(configuration.ethereumHost);
    const contract = (await drop.getContract()).connect(provider);

    let eligible0;
    let eligible1;
    try {
      const hasClaimed0 = await contract.hasClaimed(5, address);
      const hasClaimed1 = await contract.hasClaimed(9, address);
      eligible0 = resultDrop0.status == 200 && !hasClaimed0;
      eligible1 = resultDrop1.status == 200 && !hasClaimed1;

      if (!eligible0 && !eligible1) {
        setEligible({
          isEligible0: false,
          isEligible1: false,
          message: `${address} has claimed all eligible Airdrops`
        });
        return;
      }
    }
    catch (e) {
      console.error(e);
      throw new Error(`Could not get Airdrops claimed status for ${address}`);
    }

    const combinedShare = (resultDrop0.status == 200 ? BigInt(resultDrop0.data.share) : 0n) + 
      (resultDrop1.status == 200 ? BigInt(resultDrop1.data.share) : 0n);

    setEligible({
      isEligible0: eligible0,
      isEligible1: eligible1,
      message: <div>
        { address } is eligible to claim a total of{' '}
        <span style={{fontWeight: 'bold'}}>
          { parseInt(ethers.utils.formatEther(combinedShare)) } eNATA
        </span>
      </div>
    });
  }

  const airdropClaimData = [
    {
      treeDataUrl: `https://gist.githubusercontent.com/shichiro-nakahara/522b575bcbae4678982db535111c03bf/raw/` +
        'b3a5fc1c03a7650e4bc5ee65d8e2882653ecd767/124c1074-877b-4fe3-9bab-90784804b78a.json',
      id: 5,
      addresses: 211816
    },
    {
      treeDataUrl: `https://gist.githubusercontent.com/shichiro-nakahara/21329bcb654c385e7f09937333fbce6e/raw/` +
        'bde5efc9ef3dcffc2515ce09d4018bf23fa01716/3cf79a34-ef76-4303-8362-f26924eec32e.json',
      id: 9,
      addresses: 92786
    }
  ];

  async function claimDrop(airdrop) {
    if (!accountState || !accountState.ethAddressUsedForAccountKey) {
      throw new Error('Could not claim drop, invalid state.');
    }
    if (!signer) {
      throw new Error('Could not claim, invalid signer. Please refresh page and try again.');
    }

    setTx(null);
    setClaiming(true);

    const airdropData = airdropClaimData[airdrop];

    let tree;
    try {
      const result = await fetch(airdropData.treeDataUrl);
      tree = await result.json();
    }
    catch (e) {
      throw new Error(e);
    }
    if (!tree || !tree.recipients || Object.keys(tree.recipients).length != airdropData.addresses) {
      throw new Error(`Could not get data for airdrop, please try again`);
    }

    setTimeout(async () => {
      try {
        const tx = await drop.claim(
          signer, 
          accountState.ethAddressUsedForAccountKey.toString(), 
          airdropData.id,
          tree
        );
        setTx(tx);
      }
      catch (e) {
        setClaiming(false);
        if (!e.toString().includes('user rejected transaction')) {
          throw new Error(e);
        }
      }
    }, 500);
  }
  
  return (
    <div style={{display: "flex", flexDirection: "column", gap: "30px"}}>
      <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
        style={{display: "flex", flexDirection: "column", gap: "20px", lineHeight: "1.5em", fontSize: "0.85em"}}
      >
        <div style={{display: "flex", justifyContent: "center", marginBottom: "1em", width: "100%"}}>
          <img src={AirdropImg} style={{maxWidth: "30em"}} />
        </div>
        <div>
          Nata Network is the first private ZK-rollup on Polygon, enabling decentralized applications to access privacy 
          and scale. Nata Network's rollup is secured by its industry-standard PLONK proving mechanism used by the 
          leading zero-knowledge scaling projects.
        </div>
        <div>
          At Nata Network we believe decentralization is premised on individual rights. Without widely accessible
          privacy, we compromise our ability to choose how we live our lives and earn our livelihoods.
        </div>
        <div>
          That's why we're building Nata Network, to deliver privacy without compromise:
          <li>
            <span style={{fontWeight: "bold"}}>Private.</span> Nata Network is the only zero-knowledge rollup built
            with a privacy-first architecture from the ground up.
          </li>
          <li>
            <span style={{fontWeight: "bold"}}>Compliant.</span> Our programmably private system supports opt-in 
            auditability and compliance while fully preserving confidentiality.
          </li>
        </div>
      </div>
      
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
                <Button text="Claim Airdrop #1" disabled={ eligible && !eligible.isEligible0 } onClick={() => {claimDrop(0)}} />
              </div>
              <div style={{width: "100%"}}>
                <Button text="Claim Airdrop #2" disabled={ eligible && !eligible.isEligible1 } onClick={() => {claimDrop(1)}} />
              </div>
            </div>
            <ClaimDropModal visible={ claiming } txHash={ tx ? tx.hash : null } onClose={() => setClaiming(false)} />
          </div>
        </CSSTransition>
      </div>
      <CSSTransition
        timeout={1000}
        classNames="slow-fade"
        in={!!eligible}
        unmountOnExit
      >
        <div className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)} 
          style={{display: "flex", flexDirection: "column", alignItems: "center", fontSize: "0.85em"}}
        >
          { eligible?.message }
        </div>
      </CSSTransition>
    </div>
  );
}
