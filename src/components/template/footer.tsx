import React from 'react';
import { default as styled } from 'styled-components';
import { Link } from '../../ui-components/index.js';
import { breakpoints, spacings } from '../../ui-components/styles/layout.js';
import { PaddedBlock } from '../padded_block.js';
import { TextLink } from '../text_link.js';
import { ContentWrapper } from './content_wrapper.js';
import style from './footer.module.scss';

interface MenuItem {
  name: string;
  href?: string;
  to?: string;
}

const staticHelpItems = [
  {
    name: 'Docs',
    href: 'https://docs.natanetwork.io',
  },
  {
    name: 'Github',
    href: 'https://github.com/shichiro-nakahara',
  },
  {
    name: 'Dune Analytics',
    href: 'https://dune.com/polyaztec/natanetwork',
  },
];

const socialItems = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/nata_network_io',
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/fm7bn6RV'
  },
  {
    name: 'Matrix',
    href: 'https://matrix.to/#/!EiAngTwTXkkAWgdYIJ:matrix.org',
  },
  {
    name: 'Governance',
    href: 'https://natanetwork.canny.io/dao-governance',
  },
  {
    name: 'Feedback',
    href: 'https://frenreviews.com/project/403',
  },
  {
    name: 'Snapshot',
    href: 'https://snapshot.org/#/natanetwork.eth'
  },
  {
    name: 'Blog',
    href: 'https://mirror.xyz/natanetwork.eth'
  }
];

const Col = styled.div`
  @media (max-width: ${breakpoints.s}) {
    padding: ${spacings.xs} 0;
  }
`;

const MenuLink = styled(TextLink)`
  display: inline-block;
  color: #99a5ee;
`;

interface FooterMenuProps {
  title: string;
  menuItems: MenuItem[];
}

const FooterMenu: React.FunctionComponent<FooterMenuProps> = ({ title, menuItems }) => (
  <Col>
    <PaddedBlock size="s">
      <div className={style.menuText}>{title}</div>
    </PaddedBlock>
    {menuItems.map(({ name, href, to }) => (
      <PaddedBlock key={name} size="xs">
        <MenuLink text={name} to={to} href={href} target={href ? '_blank' : undefined} color="purple" size="s" />
      </PaddedBlock>
    ))}
  </Col>
);

const Foot = styled.div`
  display: flex;
  justify-content: center;
  padding: ${spacings.l} 0;

  @media (max-width: ${breakpoints.s}) {
    padding: ${spacings.m} 0;
  }
`;

interface FooterProps {
  explorerUrl: string;
}

export function Footer(props: FooterProps) {
  const network = [...staticHelpItems, { name: 'Block Explorer', href: props.explorerUrl }];
  return (
    <div className={style.root}>
      <ContentWrapper>
        <div className={style.content}>
          <FooterMenu title="Network" menuItems={network} />
          <FooterMenu title="Community" menuItems={socialItems} />
        </div>
        <Foot>
          <Link className={style.techLink} href="https://github.com/shichiro-nakahara/aztec-connect" target="_blank">
            Community run fork of Aztec Connect
          </Link>
        </Foot>
      </ContentWrapper>
    </div>
  );
}
