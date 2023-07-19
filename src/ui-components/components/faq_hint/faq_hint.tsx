import { Link } from '../../index.js';
import { useUniqueId } from '../../util/index.js';
import style from './faq_hint.module.scss';
import { configuration } from '../../../config.js';

function FaqIcon() {
  const id = useUniqueId();
  return (
    <svg className={style.icon} viewBox="0 0 28 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.58.85c-1.255 0-2.458.5-3.344 1.388A4.742 4.742 0 0 0 .852 5.586v9.53c0 1.255.497 2.46 1.384 3.348a4.723 4.723 0 0 0 3.343 1.388h14.425l6.514 2.244a1 1 0 0 0 1.26-1.301l-2.057-5.4c.02-.081.035-.175.035-.28V5.587c0-1.255-.497-2.46-1.383-3.348A4.722 4.722 0 0 0 21.029.849H5.58Zm-1.928 2.8a2.722 2.722 0 0 1 1.927-.8h15.45c.723 0 1.416.287 1.928.8.511.513.8 1.21.8 1.936v9.3a1.15 1.15 0 0 0-.112.491 1 1 0 0 0 .065.356l1.438 3.776-4.65-1.602a1 1 0 0 0-.326-.055H5.579a2.722 2.722 0 0 1-1.927-.8 2.742 2.742 0 0 1-.8-1.936v-9.53c0-.726.288-1.423.8-1.936Zm3.233 9.821v-2.466l2.478.074V9.996H6.885V8.445h2.963V7.268H5.636v6.203h1.249Zm2.534 0 2.311-6.203h1.435l2.33 6.203h-1.286l-.485-1.29h-2.553l-.484 1.327-1.268-.037Zm3.895-2.41-.876-2.373-.875 2.373h1.751Zm2.312.56c.125.37.321.713.577 1.01.257.227.554.405.876.522.376.166.782.25 1.193.243h.391c.124.01.249.01.373 0 .15.253.346.475.578.654.267.205.57.357.894.449l.746-.916a2.512 2.512 0 0 1-.69-.261 1.642 1.642 0 0 1-.466-.411c.38-.284.675-.665.858-1.103.212-.47.32-.98.316-1.495a3.747 3.747 0 0 0-.205-1.233 2.897 2.897 0 0 0-1.528-1.719 3.05 3.05 0 0 0-2.385 0 2.554 2.554 0 0 0-.95.71c-.264.29-.462.635-.579 1.01a3.747 3.747 0 0 0-.204 1.232c-.007.445.062.887.205 1.308Zm3.382.681a1.47 1.47 0 0 1-1.78-.42 2.358 2.358 0 0 1-.466-1.513 2.395 2.395 0 0 1 .466-1.513 1.473 1.473 0 0 1 1.193-.56 1.488 1.488 0 0 1 1.193.56c.275.434.405.944.372 1.457a2.434 2.434 0 0 1-.447 1.57 1.492 1.492 0 0 1-.531.42Z"
        fill={`url(#${id})`}
      />
      <defs>
        <linearGradient id={`${id}`} x1={3.647} y1={4.045} x2={17.973} y2={7.619} gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f1f49" />
          <stop offset={1} stopColor="#2f1f49" />
          <stop offset={1} stopColor="#2f1f49" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FaqHint({ className }: { className?: string }) {
  return (
    <Link className={`${style.link} ${className}`} href={configuration.docsUrl} target="_blank">
      <span className={style.label}>Need help?</span>
      <FaqIcon />
    </Link>
  );
}
