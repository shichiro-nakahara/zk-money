import style from './terms.module.scss';
import { bindStyle, Field, FieldStatus } from '../../../../ui-components/index.js';
import cardWrapperStyle from '../../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import { Button, ButtonTheme } from '../../../../ui-components/index.js';
import { useEffect, useState } from 'react';
import { AcceptTerm } from './accept_term.js';
import { useSignMessage } from 'wagmi';
import { useActiveWalletEthAddress } from '../../../../alt-model/active_wallet_hooks.js';

const cx = bindStyle(style);

interface TermsProps {
  address: string | undefined;
  termsAccepted: boolean;
  setTermsAccepted: Function;
}

export function Terms(props: TermsProps) {
  const [termsRejected, setTermsRejected] = useState(false);
  const [term1Checked, setTerm1Checked] = useState(false);
  const [term2Checked, setTerm2Checked] = useState(false);
  const [term3Checked, setTerm3Checked] = useState(false);

  const ethAddress = useActiveWalletEthAddress();

  const messageToSign = useSignMessage({
    message: `I, owner of the address, ${props.address}, accept the following terms:\n\nI certify that I am not a ` +
      `citizen or resident of, or incorporated in, any jurisdiction designated, blocked, or sanctioned by the United ` +
      `Nations, the European Union, the U.K. Treasury, or the U.S. Treasury's Office of Foreign Assets Control, ` +
      `including but not limited to Cuba, the Democratic Republic of Congo, Iran, North Korea, Russia, Syria, Yemen, ` +
      `or the Crimea, Donetsk, or Luhansk regions of Ukraine.\n\nI am not a citizen or resident of the United States ` +
      `of America (including its territories: American Samoa, Guam, Puerto Rico, the Northern Mariana Islands, and ` +
      `the U.S. Virgin Islands) or any other Restricted Jurisdiction (as defined in the Terms of Service).\n\nI ` +
      `understand that tokens must be claimed within a year of donation, or risk forteiture.`,
    onError: () => setTermsRejected(true),
    onSuccess: () => props.setTermsAccepted(true)
  });

  if (props.termsAccepted) return null;

  if (termsRejected) {
    return (
      <div 
        className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
        style={{ minHeight: "15em" }}
      >
        You may not participate in the private sale.
      </div>
    );
  }

  return (
    <div 
      className={cx(style.cardWrapper, cardWrapperStyle.cardWrapper)}
      style={{ alignItems: "start" }}
    >
      <Field
        value={props.address ? props.address : ''}
        label="Your Polygon Address"
        placeholder="Loading..."
        disabled={true}
        status={ethAddress && ethAddress.toString() != props.address ? FieldStatus.Error : undefined}
        message={ethAddress && ethAddress.toString() != props.address ? `Please switch wallet to ${props.address}` : ''}
      />

      <div>Terms</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
        <AcceptTerm 
          onClick={(clicked) => setTerm1Checked(clicked)}
          text={"I certify that I am not a citizen or resident of, or incorporated in, any jurisdiction designated, " +
            "blocked, or sanctioned by the United Nations, the European Union, the U.K. Treasury, or the U.S. " +
            "Treasury's Office of Foreign Assets Control, including but not limited to Cuba, the Democratic Republic " +
            "of Congo, Iran, North Korea, Russia, Syria, Yemen, or the Crimea, Donetsk, or Luhansk regions of Ukraine."} 
        />
        <AcceptTerm 
          onClick={(clicked) => setTerm2Checked(clicked)}
          text={"I am not a citizen or resident of the United States of America (including its territories: American " +
            "Samoa, Guam, Puerto Rico, the Northern Mariana Islands, and the U.S. Virgin Islands) or any other " + 
            "Restricted Jurisdiction (as defined in the Terms of Service)."} 
        />
        <AcceptTerm 
          onClick={(clicked) => setTerm3Checked(clicked)}
          text={"I understand that tokens must be claimed within a year of donation, or risk forteiture."} 
        />
      </div>
      <div style={{ display: ethAddress?.toString() != props.address ? 'block' : 'none', color: '#e64e20', 
        fontSize: '15px', marginTop: '1em'
      }}>
        Please unlock your wallet and select the one with address { props.address }.
      </div>
      <div style={{ display: "flex", gap: "1em", width: "100%", justifyContent: "end", marginTop: "1em" }}>
        <Button text="Reject" theme={ButtonTheme.Secondary} onClick={() => setTermsRejected(true)} />
        <Button 
          text="Sign" 
          disabled={!term1Checked || !term2Checked || !term3Checked || props.address != ethAddress?.toString()} 
          onClick={() => messageToSign.signMessage()}
        />
      </div>
    </div>
  );
}