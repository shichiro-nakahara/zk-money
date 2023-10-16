import style from './terms.module.scss';
import { bindStyle, Field, FieldStatus } from '../../../../ui-components/index.js';
import cardWrapperStyle from '../../../../ui-components/components/card/card_wrapper/card_wrapper.module.scss';
import { Button, ButtonTheme } from '../../../../ui-components/index.js';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { AcceptTerm } from './accept_term.js';

const cx = bindStyle(style);

interface TermsProps {
  address: string | undefined;
  setAddress: Function;
}

export function Terms(props: TermsProps) {
  const [addressValue, setAddressValue] = useState('');
  const [addressStatus, setAddressStatus] = useState<FieldStatus | undefined>(undefined);
  const [termsRejected, setTermsRejected] = useState(false);
  const [termChecked, setTermChecked] = useState('ffff');

  if (props.address) return null;

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
        value={addressValue}
        label="Your Polygon Address"
        placeholder="Enter address"
        status={addressStatus}
        message={addressStatus == FieldStatus.Error ? "Please enter a valid Polygon address" : ""}
        onChangeValue={(value: string) => {
          try {
            const validAddress = ethers.utils.getAddress(value);
            setAddressValue(validAddress);
            setAddressStatus(FieldStatus.Success);
          }
          catch (e) {
            setAddressValue(value);
            setAddressStatus(FieldStatus.Error);
          }
        }}
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
          text="Accept" 
          disabled={termChecked != 'tttt' || addressStatus != FieldStatus.Success} 
          onClick={() => props.setAddress(addressValue)}
        />
      </div>
    </div>
  );
}