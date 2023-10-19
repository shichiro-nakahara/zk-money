import { useState } from 'react';
import Copy from '../../images/copy.svg';

interface CopyButtonProps {
  text: string;
  iconWidth?: string;
}

export function CopyButton(props: CopyButtonProps) {
  const [copyButtonClicked, setCopyButtonClicked] = useState(false);

  return (
    <button
      disabled={copyButtonClicked} 
      style={{ background: 'none', border: 'none', cursor: copyButtonClicked ? 'default' : 'pointer',
        opacity: copyButtonClicked ? '0.5' : '1'
      }}
      onClick={(e) => {
        navigator.clipboard.writeText(props.text);
        setCopyButtonClicked(true);
        setTimeout(() => {
          setCopyButtonClicked(false);
        }, 1000);
      }}>
      <img style={{ width: props.iconWidth ? props.iconWidth : '1.25rem' }} src={ Copy } />
    </button>
  );
}