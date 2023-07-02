import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pages } from '../../views.js';
import style from './earn.module.scss';

interface EarnProps {
  isLoggedIn: boolean;
}

export function Earn(props: EarnProps) {
  const { isLoggedIn } = props;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate(Pages.BALANCE);
  }, []);
  
  return (
    <div>
      <div>Coming soon...</div>
      <div style={{fontSize: "smaller", marginTop: "1em"}}>
        Keep an eye out on <a href="https://twitter.com/poly_aztec" target="_blank">Twitter</a> for details.
      </div>
    </div>
  );
}
