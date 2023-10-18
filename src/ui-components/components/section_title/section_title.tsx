import styles from './section_title.module.scss';

interface SectionTitleProps {
  label: string;
  sideComponent?: JSX.Element;
  style?: any;
}

export function SectionTitle({ label, sideComponent, style }: SectionTitleProps) {
  return (
    <div className={styles.sectionTitleWrapper} style={style ? style : {}}>
      <h1 className={styles.title}>{label}</h1>
      {sideComponent}
    </div>
  );
}
