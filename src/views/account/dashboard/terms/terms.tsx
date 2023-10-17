import style from './terms.module.scss';
import { bindStyle, Field, FieldStatus } from '../../../../ui-components/index.js';
import cardWrapperStyle from '../../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import { Button, ButtonTheme } from '../../../../ui-components/index.js';
import { useState } from 'react';
import { AcceptTerm } from './accept_term.js';
import { useSigner, useSignMessage } from 'wagmi';
import { useActiveWalletEthAddress } from '../../../../alt-model/active_wallet_hooks.js';

const cx = bindStyle(style);

interface TermsProps {
  address: string | undefined;
  termsAccepted: boolean;
  setTermsAccepted: Function;
}

export function Terms(props: TermsProps) {
  const [termsRejected, setTermsRejected] = useState(false);
  const [termChecked, setTermChecked] = useState('ffff');

  const ethAddress = useActiveWalletEthAddress();

  const messageToSign = useSignMessage({
    message: `I, owner of the address, ${props.address}, accept the following terms:\n\nI acknowledge that the ` +
      `contracts are unaudited and may be considered risky.\n\nI acknowledge that Nata Network and related software ` +
      `are experimental and that the use of experimental software may result in loss of funds.\n\nI am not a citizen ` +
      `or resident of the United States of America (including its territories: American Samoa, Guam, Puerto Rico, ` +
      `the Northern Mariana Islands, and the U.S. Virgin Islands) or any other Restricted Jurisdiction (as defined ` +
      `in the Terms of Service).\n\nI am not a Prohibited Person (as defined in the Terms of Service) nor acting on ` +
      `behalf of a Prohibited Person.`,
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
        You may not use this feature.
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
          onClick={(clicked) => setTermChecked(`${clicked ? 't' : 'f'}${termChecked.substring(1, termChecked.length)}`)}
          text={"I acknowledge that the contracts are unaudited and may be considered risky."} 
        />
        <AcceptTerm 
          onClick={(clicked) => 
            setTermChecked(`${termChecked[0]}${clicked ? 't' : 'f'}${termChecked.substring(2, termChecked.length)}`)
          }
          text={"I acknowledge that Nata Network and related software are experimental and that the use of " +
            "experimental software may result in loss of funds."} 
        />
        <AcceptTerm 
          onClick={(clicked) => 
            setTermChecked(`${termChecked.substring(0, 2)}${clicked ? 't' : 'f'}${termChecked[termChecked.length - 1]}`)
          }
          text={"I am not a citizen or resident of the United States of America (including its territories: American " +
            "Samoa, Guam, Puerto Rico, the Northern Mariana Islands, and the U.S. Virgin Islands) or any other " + 
            "Restricted Jurisdiction (as defined in the Terms of Service)."} 
        />
        <AcceptTerm 
          onClick={(clicked) => setTermChecked(`${termChecked.substring(0, 3)}${clicked ? 't' : 'f'}`)}
          text={"I am not a Prohibited Person (as defined in the Terms of Service) nor acting on behalf of a " + 
            "Prohibited Person."} 
        />
      </div>
      <div style={{ display: "flex", gap: "1em", width: "100%", justifyContent: "end", marginTop: "1em" }}>
        <Button text="Reject" theme={ButtonTheme.Secondary} onClick={() => setTermsRejected(true)} />
        <Button 
          text="Sign" 
          disabled={termChecked != 'tttt' || props.address != ethAddress?.toString()} 
          onClick={() => messageToSign.signMessage()}
        />
      </div>
    </div>
  );
}