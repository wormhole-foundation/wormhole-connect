import React from 'react';
import { makeStyles } from 'tss-react/mui';
import PageHeader from 'components/PageHeader';
import { showHamburgerMenu } from 'config';
import FooterNavBar from 'components/FooterNavBar';

const useStyles = makeStyles()(() => ({
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
      <PageHeader title="Terms" back showHamburgerMenu={showHamburgerMenu} />
      <div className={classes.body}>
        <div>Disclaimer:</div>

        <div>
          The operator (the "Operator") of this website or mobile application
          has implemented, deployed, and is operating open source software (the
          "SDK") that overlays the Wormhole protocol, a cross chain messaging
          protocol. THIS SDK AND THE WORMHOLE PROTOCOL ARE MADE AVAILABLE "AS
          IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND. By using or
          accessing this SDK or the Wormhole protocol, you and the Operator
          agree that no developer or entity involved in creating, deploying,
          maintaining, operating this SDK or the Wormhole protocol, or causing
          or supporting any of the foregoing, will be liable in any manner for
          any claims or damages whatsoever associated with your use, inability
          to use, or your interaction with other users of this SDK or the
          Wormhole protocol, or this SDK or the Wormhole protocol themselves,
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
          use of the SDK or the Wormhole protocol. For example, these losses may
          arise from or relate to: (i) incorrect information; (ii) software or
          network failures; (iii) corrupted cryptocurrency wallet files; (iv)
          unauthorized access; (v) errors, mistakes, or inaccuracies; or (vi)
          third-party activities.
        </div>
      </div>
      {showHamburgerMenu ? null : <FooterNavBar />}
    </div>
  );
}

export default Terms;
