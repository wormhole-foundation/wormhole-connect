import React, { useState } from 'react';
import config from 'config';
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
          Wormhole Connect supports bridging native USDC, native tokens using
          the Native Token Transfers framework, and wrapped assets. Tokens
          bridged using the Wormhole Token Bridge will be received as a
          Wormhole-wrapped token on the destination chain. In many cases,
          Wormhole-wrapped tokens are the canonical representation on the chain
          (e.g. WETH on Solana is a Wormhole minted token, see
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
      title: 'What chains and assets does Connect support?',
      content: (
        <>
          Connect can be configured to support any asset. See the full list of
          Connect supported chains in the{' '}
          <a
            href="https://github.com/wormhole-foundation/wormhole-connect/blob/development/wormhole-connect/src/config/mainnet/chains.ts"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            GitHub repository
          </a>
          .
        </>
      ),
    },
    {
      title: 'How do I resume a transaction?',
      content: (
        <>
          You can resume or view the status of a transaction by selecting
          "Resume Transaction" in the footer and providing the network and
          transaction hash from the source (sending) chain.
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
        showHamburgerMenu={config.showHamburgerMenu}
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
      {config.showHamburgerMenu ? null : <FooterNavBar />}
    </div>
  );
}

export default FAQ;
