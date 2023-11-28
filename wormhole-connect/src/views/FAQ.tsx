import React, { useState } from 'react';
import { showHamburgerMenu } from 'config';
import { makeStyles } from 'tss-react/mui';
import Dropdown from 'components/Dropdown';
import PageHeader from 'components/PageHeader';
import AlertBanner from 'components/AlertBanner';
import FooterNavBar from 'components/FooterNavBar';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    maxWidth: '700px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
  },
  faqs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  link: {
    color: theme.palette.text.primary,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}));

function FAQ() {
  const { classes } = useStyles();
  const FAQs = [
    {
      title: 'What is Wormhole Connect?',
      content: (
        <>
          Wormhole Connect is an open source frontend SDK that lets Web3
          developers embed asset bridging directly into their apps or websites.
        </>
      ),
    },
    {
      title: 'What types of assets does Connect support?',
      content: (
        <>
          Initially, Connect will only support bridging wrapped assets. This
          means that any native token bridged through Connect and the underlying
          Wormhole Token Bridge will be received as a Wormhole-wrapped token on
          the destination chain. In some cases, Wormhole minted tokens are the
          canonical representation on the chain (e.g. WETH on Solana is a
          Wormhole minted token, see
          <a
            href="https://github.com/wormhole-foundation/wormhole-token-list"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            https://github.com/wormhole-foundation/wormhole-token-list
          </a>
          ) and in other cases Wormhole minted tokens can be swapped on the
          destination chain’s DEX(s) for whatever assets you need (e.g. USDCeth
          bridged from Ethereum to Avalanche can be swapped for native USDC on
          Trader Joe).
        </>
      ),
    },
    {
      title: 'Will Connect support native asset bridging?',
      content: (
        <>
          Yes, Connect will soon surface multiple Wormhole-powered services
          (e.g. cross chain asset swaps) that enable other forms of bridging
          more suitable for certain use cases. Check{' '}
          <a
            href="https://wormhole.com/connect"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            https://wormhole.com/connect
          </a>{' '}
          for updates on Connect support.
        </>
      ),
    },
    {
      title: 'What chains and assets does Connect support?',
      content: (
        <>
          Initially, Connect supports wrapped asset bridging of ETH, WETH, USDC,
          MATIC, WMATIC, BNB, WBNB, AVAX, WAVAX, FTM, WFTM, CELO, GLMR, WGLMR,
          AND SOL across Ethereum, Polygon, BSC, Avalanche, Celo, Moonbeam,
          Base, Solana and Sui. Connect will support other Wormhole-connected
          chains and assets in the future, see the full list of Connect
          supported chains on the{' '}
          <a
            href="https://github.com/wormhole-foundation/wormhole-connect/blob/development/wormhole-connect/src/config/mainnet/chains.ts"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            GitHub repository
          </a>{' '}
          and Wormhole supported chains at{' '}
          <a
            href="https://wormhole.com/network"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            https://wormhole.com/network
          </a>
          .
        </>
      ),
    },
    {
      title: 'What is automatic relaying?',
      content: (
        <>
          On EVM-based chains, Connect lets users bridge assets while only
          having to pay gas on the source chain. The automatic relaying feature
          pays gas on behalf of users on the destination chain. Connect will
          support automatic relaying for other chains in the future.
        </>
      ),
    },
    {
      title: 'What is gas dropoff?',
      content: (
        <>
          Gas dropoff is a Connect feature that enables users to pay an
          additional fee on the source chain to request a small amount of native
          gas on the destination chain. For example, a user bridging USDC from
          Ethereum to Sui can pay a fee denominated in USDC from their sending
          wallet to receive some native SUI in their receiving wallet in
          addition to the USDC they are bridging over. Gas dropoff is currently
          supported on EVM-based chains and Sui, and will be supported on other
          chains in the future.
        </>
      ),
    },
    {
      title: 'Can I customize Connect inside my application?',
      content: (
        <>
          Connect supports both light and dark modes and can optionally be fully
          customized. See the{' '}
          <a
            href="https://www.npmjs.com/package/@wormhole-foundation/wormhole-connect"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            NPM package readme
          </a>{' '}
          for more details.
        </>
      ),
    },
    {
      title: 'Contact',
      content: (
        <>
          If you have any further questions or require troubleshooting, please
          reach out to Wormhole's community managers on{' '}
          <a
            href="https://discord.com/invite/wormholecrypto"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            Discord
          </a>
          .
          <AlertBanner
            show
            warning
            content="Beware of scams. Admins will never DM or message you first."
            margin="16px 0 0 0"
          />
        </>
      ),
    },
  ];

  const [selected, setSelected] = useState(undefined as number | undefined);

  const toggle = (key: number) => {
    if (key === selected) {
      setSelected(undefined);
    } else {
      setSelected(key);
    }
  };

  return (
    <div className={classes.container}>
      <PageHeader
        title="FAQ"
        description="This page collects and answers the most commonly asked questions."
        showHamburgerMenu={showHamburgerMenu}
        back
      />

      <div className={classes.faqs}>
        {FAQs.map((faq, i) => {
          const id = i + 1;
          return (
            <Dropdown
              key={id}
              title={faq.title}
              open={!!selected && selected === id}
              onToggle={() => toggle(id)}
            >
              {faq.content}
            </Dropdown>
          );
        })}
      </div>
      {showHamburgerMenu ? null : <FooterNavBar />}
    </div>
  );
}

export default FAQ;
