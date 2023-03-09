import React from 'react';
import { makeStyles } from 'tss-react/mui';
import PageHeader from '../components/PageHeader';

const useStyles = makeStyles()((theme) => ({
  terms: {
    width: '100%',
    maxWidth: '700px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  body: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontWeight: '300',
  },
}));

function Terms() {
  const { classes } = useStyles();
  return (
    <div className={classes.terms}>
      <PageHeader title="Terms" back />
      <div className={classes.body}>
        <div>Disclaimer:</div>

        <div>
          This SDK is an open source software SDK that leverages the Wormhole
          protocol, a cross chain messaging protocol. The SDK does not process
          payments. THIS SDK AND THE WORMHOLE PROTOCOL ARE PROVIDED "AS IS", AT
          YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND. By using or
          accessing this SDK or Wormhole, you agree that no developer or entity
          involved in creating, deploying, maintaining, operating this SDK or
          Wormhole, or causing or supporting any of the foregoing, will be
          liable in any manner for any claims or damages whatsoever associated
          with your use, inability to use, or your interaction with other users
          of, this SDK or Wormhole, or this SDK or Wormhole themselves,
          including any direct, indirect, incidental, special, exemplary,
          punitive or consequential damages, or loss of profits,
          cryptocurrencies, tokens, or anything else of value. By using or
          accessing this SDK, you represent that you are not subject to
          sanctions or otherwise designated on any list of prohibited or
          restricted parties or excluded or denied persons, including but not
          limited to the lists maintained by the United States' Department of
          Treasury's Office of Foreign Assets Control, the United Nations
          Security Council, the European Union or its Member States, or any
          other government authority.
        </div>

        <div>
          You assume all risks associated with using the SDK, the Wormhole
          protocol, and digital assets and decentralized systems generally,
          including but not limited to, that: (a) digital assets are highly
          volatile; (b) using digital assets is inherently risky due to both
          features of such assets and the potential unauthorized acts of third
          parties; (c) you may not have ready access to assets; and (d) you may
          lose some or all of your tokens or other assets. You agree that you
          will have no recourse against anyone else for any losses due to the
          use of the SDK or Wormhole. For example, these losses may arise from
          or relate to: (i) incorrect information; (ii) software or network
          failures; (iii) corrupted cryptocurrency wallet files; (iv)
          unauthorized access; (v) errors, mistakes, or inaccuracies; or (vi)
          third-party activities.
        </div>
      </div>
    </div>
  );
}

export default Terms;
