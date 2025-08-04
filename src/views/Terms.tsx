import React from 'react';
import Box from '@mui/material/Box';
import PageHeader from 'components/PageHeader';
import FooterNavBar from 'components/FooterNavBar';
import config from 'config';

function Terms() {
  const styles = {
    terms: {
      width: '100%',
      maxWidth: '700px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    body: {
      textAlign: 'left' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      fontWeight: '300',
      ol: {
        marginBottom: '8px',
      },
      li: {
        marginBottom: '8px',
      },
    },
  };
  return (
    <Box sx={styles.terms}>
      <PageHeader title="Terms of Service" back />
      <Box sx={styles.body}>
        <p>Last Updated: April 18, 2025</p>
        <p>
          These Terms of Service (the "Agreement") explain the terms and
          conditions by which you may access and use the Services provided by
          W7, LLC (d.b.a. Wormhole Labs) (the "Company," "we," "us," or "our").
          The "Services" shall include, but not limited to, the website located
          at{' '}
          <a
            href="https://portalbridge.com"
            target="_blank"
            style={{ whiteSpace: 'nowrap' }}
            rel="noreferrer"
          >
            https://portalbridge.com
          </a>{' '}
          (the "Interface"), and any app, content, functionality, and services
          offered on or through the Interface, and all technologies made
          available from the Interface, together with all of the existing and
          any updated or new features, functionalities and technologies.
        </p>
        <p>
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
        </p>
        <p>
          You must read this Agreement carefully as it governs your use of the
          Services. By accessing or using any of the Services, you (on behalf of
          yourself or the entity that you represent) signify that you have read,
          understand, and agree to be bound by, this Agreement and our Privacy
          Policy in its entirety, and you represent and warrant that you have
          the willingness, right, authority, and capacity lawfully to enter into
          this Agreement (on behalf of yourself or the entity that you
          represent). If you do not agree, you are not authorized to access or
          use any of our Services and should not use our Services.
        </p>
        <p>
          To access or use any of our Services, you must be able to form a
          legally binding contract with us. Accordingly, you represent that you
          are at least the age of majority in your jurisdiction (e.g., 18 years
          old in the United States) and have the full right, power, and
          authority to enter into and comply with the terms and conditions of
          this Agreement on behalf of yourself and any company or legal entity
          for which you may access or use the Interface. If you are entering
          into this Agreement on behalf of an entity, you represent to us that
          you have the legal authority to bind such entity.
        </p>
        <p>
          You further represent that you are not (a) the subject of economic or
          trade sanctions administered or enforced by any governmental authority
          or otherwise designated on any list of prohibited or restricted
          parties (including but not limited to the list maintained by the
          Office of Foreign Assets Control of the U.S. Department of the
          Treasury) or (b) a citizen, resident, or organized in a jurisdiction
          or territory that is the subject of comprehensive country-wide,
          territory-wide, or regional economic sanctions by the United States.
          Finally, you represent that your access and use of any of our Services
          will fully comply with all applicable laws and regulations, and that
          you will not access or use any of our Services to conduct, promote, or
          otherwise facilitate any illegal activity.
        </p>
        <p>
          NOTICE: This Agreement contains important information, including a
          binding arbitration provision and a class action waiver, both of which
          impact your rights as to how disputes are resolved. Our Services are
          only available to you — and you should only access any of our Services
          — if you agree completely with these terms.
        </p>
        <ol>
          <li>
            Modifications of this Agreement or our Services{' '}
            <ol type="a">
              <li>
                Modifications of this Agreement. We reserve the right, in our
                sole discretion, to modify this Agreement from time to time. If
                we make any material modifications, we will notify you by
                updating the date at the top of the Agreement and by maintaining
                a current version of the Agreement at
                https://portalbridge.com/terms-of-use. All modifications will be
                effective when they are posted, and your continued accessing or
                use of any of the Services will serve as confirmation of your
                acceptance of those modifications. If you do not agree with any
                modifications to this Agreement, you must immediately stop
                accessing and using all of our Services.
              </li>
              <li>
                Modifications of our Services. We reserve the following rights,
                which do not constitute obligations of ours: (a) with or without
                notice to you, to modify, substitute, eliminate or add to any of
                the Services; (b) to review, modify, filter, disable, delete,
                and remove any and all content and information from any of the
                Services.
              </li>
            </ol>
          </li>
          <li>
            Intellectual Property Rights
            <ol type="a">
              <li>
                General
                <ol type="i">
                  <li>
                    The Services and their entire contents, features, and
                    functionality (including but not limited to all information,
                    software, text, displays, images, video and audio, and the
                    design, selection, and arrangement thereof), are owned by
                    us, our licensors or other providers of such material and
                    are protected by copyright, trademark, patent, trade secret,
                    and other intellectual property or proprietary rights laws.
                    Neither the Agreement (nor your use of the Services)
                    transfers to you or any third party any rights, title, or
                    interest in or to such intellectual property rights, except
                    as indicated otherwise.
                  </li>
                  <li>
                    Subject to the terms of this Agreement, we grant you a
                    limited, revocable, non-exclusive, non-sublicensable,
                    non-transferable license to access and use our Services
                    solely in accordance with this Agreement. You agree that you
                    will not use, modify, distribute, tamper with, reverse
                    engineer, disassemble or decompile any of our Services for
                    any purpose other than as expressly permitted pursuant to
                    this Agreement. Except as set forth in this Agreement, we
                    grant you no rights to any of our Services, including any
                    intellectual property rights.
                  </li>
                </ol>
              </li>
              <li>
                Feedback. If you provide us with any feedback or suggestions
                regarding the Services (“Feedback"), you hereby assign to us all
                rights in such Feedback and agree that we have the right to use
                and fully exploit such Feedback and related information in any
                manner we deem appropriate. Any Feedback you provide will be
                treated as non-confidential and non-proprietary, and we will be
                entitled to the unrestricted use and dissemination of such
                Feedback for any purpose, commercial or otherwise, without
                acknowledgment, attribution, or compensation to you.
              </li>
            </ol>
          </li>
          <li>
            Your Use of the Services
            <ol type="a">
              <li>
                Prohibited Uses. You may use the Services only for lawful
                purposes and in accordance with the Agreement. You agree not to:
                <ol type="i">
                  <li>
                    use the Services in any way that violates any applicable
                    federal, state, local, or international law or regulation,
                    including, without limitation, any applicable sanctions
                    laws, export control laws, securities or other financial
                    regulatory laws, anti-money laundering laws, or privacy
                    laws;
                  </li>
                  <li>
                    use any device, software or routine that interferes with the
                    proper working of any Service;
                  </li>
                  <li>
                    attempt to probe, scan or test the vulnerability of the
                    Services, or otherwise seek to interfere with or compromise
                    the integrity, security, or proper functioning of the
                    Services;
                  </li>
                  <li>
                    attempt to interfere with the proper working of the
                    Services, or interfere with, damage, or disrupt any parts of
                    the Services, the server(s) on which the Services is stored,
                    or any server, computer or database connected to the
                    Services;
                  </li>
                  <li>
                    engage in any other conduct that restricts or inhibits
                    anyone's use or enjoyment of the Services, or which, as
                    determined by us, may harm us or users of the Services or
                    expose them to liability; or
                  </li>
                  <li>
                    encourage or enable any other individual to do any of the
                    foregoing.
                  </li>
                </ol>
              </li>
              <li>
                Your Responsibilities. By using the Services, you agree and
                understand that:
                <ol type="i">
                  <li>
                    You are solely responsible for your use of the Services and
                    interactions with the Protocol, including all of your
                    transfers of digital assets; all transactions you submit to
                    the Protocol are considered unsolicited, which means that
                    they are solely initiated by you;
                  </li>
                  <li>
                    to the fullest extent not prohibited by applicable laws, we
                    owe no fiduciary duties or liabilities to you or any other
                    party, and that to the extent any such duties or liabilities
                    may exist at law or in equity, you hereby irrevocably
                    disclaim, waive, and eliminate those duties and liabilities;
                  </li>
                  <li>
                    You are solely responsible for reporting and paying any
                    taxes applicable to your use of the Services;
                  </li>
                  <li>
                    We have no control over, or liability for, the delivery,
                    quality, safety, legality, or any other aspect of any
                    digital assets that you may transfer to or from a third
                    party, and we are not responsible for ensuring that a
                    counterparty with whom you transact completes the
                    transaction or is authorized to do so;
                  </li>
                  <li>
                    The Services are non-custodial application, meaning we do
                    not ever have custody, possession, or control of your
                    digital assets at any time; we accept no responsibility for,
                    or liability to you, in connection with your use of a wallet
                    and make no representations or warranties regarding how any
                    of our Services will operate with any specific wallet;
                    likewise, you are solely responsible for any associated
                    wallet and we are not liable for any acts or omissions by
                    you in connection with or as a result of your wallet being
                    compromised; and
                  </li>
                  <li>
                    Transactions that take place on a blockchain network require
                    the payment of transaction fees to the validators or node
                    operators of the relevant network ("Gas Fees"); you will be
                    solely responsible to pay the Gas Fees for any transaction
                    that you initiate via any of our Services.
                  </li>
                </ol>
              </li>
              <li>
                Release of Claims. You expressly agree that you assume all risks
                in connection with your use of the Services. You further
                expressly waive and release us, as well as its affiliates and
                service providers, and each of their respective past, present
                and future officers, directors, members, employees, consultants,
                representatives and agents, and each of their respective
                successors and assigns from any and all liability, claims,
                causes of action, or damages arising from or in any way relating
                to your use of the Services.
              </li>
            </ol>
          </li>
          <li>
            Disclaimers
            <ol type="a">
              <li>
                EACH OF OUR SERVICES IS PROVIDED ON AN "AS IS" AND "AS
                AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, WE
                DISCLAIM ANY REPRESENTATIONS AND WARRANTIES OF ANY KIND, WHETHER
                EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO,
                THE WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
                PURPOSE. YOU ACKNOWLEDGE AND AGREE THAT YOUR USE OF EACH OF OUR
                SERVICES IS AT YOUR OWN RISK. WE DO NOT REPRESENT OR WARRANT
                THAT ACCESS TO ANY OF OUR SERVICES WILL BE CONTINUOUS,
                UNINTERRUPTED, TIMELY, OR SECURE; THAT THE INFORMATION CONTAINED
                IN ANY OF OUR SERVICES WILL BE ACCURATE, RELIABLE, COMPLETE, OR
                CURRENT; OR THAT ANY OF OUR SERVICES WILL BE FREE FROM ERRORS,
                DEFECTS, VIRUSES, OR OTHER HARMFUL ELEMENTS. NO ADVICE,
                INFORMATION, OR STATEMENT THAT WE MAKE SHOULD BE TREATED AS
                CREATING ANY WARRANTY CONCERNING ANY OF OUR SERVICES.
              </li>
              <li>
                SIMILARLY, THE PROTOCOL IS PROVIDED "AS IS", AT YOUR OWN RISK,
                AND WITHOUT WARRANTIES OF ANY KIND. WE DO NOT PROVIDE, OWN OR
                CONTROL THE PROTOCOL, WHICH OPERATES AUTONOMOUSLY ON BLOCKCHAINS
                SUBJECT TO GOVERNANCE BY A DECENTRALIZED SET OF VALIDATORS. NO
                DEVELOPER OR ENTITY INVOLVED IN CREATING THE PROTOCOL WILL BE
                LIABLE FOR ANY CLAIMS OR DAMAGES WHATSOEVER ASSOCIATED WITH YOUR
                USE, INABILITY TO USE, OR YOUR INTERACTION WITH OTHER USERS OF,
                THE PROTOCOL, INCLUDING ANY DIRECT, INDIRECT, INCIDENTAL,
                SPECIAL, EXEMPLARY, PUNITIVE OR CONSEQUENTIAL DAMAGES, OR LOSS
                OF PROFITS, CRYPTOCURRENCIES, TOKENS, OR ANYTHING ELSE OF VALUE.
                WE DO NOT ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY
                ADVERTISEMENTS, OFFERS, OR STATEMENTS MADE BY THIRD PARTIES
                CONCERNING ANY OF OUR SERVICES.
              </li>
              <li>
                Information Only. You agree that the information presented on or
                through the Services are for general informational purposes
                only. We do not warrant the accuracy, completeness or usefulness
                of this information. Any reliance you place on such information
                is strictly at your own risk. We disclaim all liability and
                responsibility arising from any reliance placed on such
                materials by you or any other visitor to our Services, or by
                anyone who may be informed of any of its contents.
              </li>
              <li>
                Third Party Information. The Services may include content
                provided by third parties, including materials provided by other
                users, bloggers and third-party licensors, syndicators,
                aggregators, and/or reporting services. All statements and/or
                opinions expressed in these materials, and all articles and
                responses to questions and other content are solely the opinions
                and the responsibility of the person or entity providing those
                materials. These materials do not necessarily reflect our
                opinion. We are not responsible, or liable to you or any third
                party, for the content or accuracy of any materials provided by
                any third parties.
              </li>
            </ol>
          </li>
          <li>
            Indemnification
            <ol type="a">
              <li>
                To the fullest extent permitted by applicable laws, you agree to
                indemnify, defend and hold harmless us, as well as its
                affiliates and service providers, and each of their respective
                past, present and future officers, directors, members,
                employees, consultants, representatives and agents, and each of
                their respective successors and assigns ("Indemnified Parties")
                from and against all actual or alleged third party claims,
                damages, awards, judgments, losses, liabilities, obligations,
                taxes, penalties, interest, fees, expenses (including, without
                limitation, attorneys' fees and expenses) and costs (including,
                without limitation, court costs, costs of settlement and costs
                of pursuing indemnification and insurance), of every kind and
                nature whatsoever, whether known or unknown, foreseen or
                unforeseen, matured or unmatured, or suspected or unsuspected,
                in law or equity, whether in tort, contract or otherwise
                ("Claims"), including, but not limited to, damages to property
                or personal injury, that are caused by, arise out of or are
                related to: (a) your access and use of any of our Services; (b)
                your violation of any term or condition of this Agreement, the
                right of any third party, or any other applicable law, rule, or
                regulation; (c) any other party's access and use of any of our
                Services with your assistance or using any device or account
                that you own or control; (d) any dispute between you and (i) any
                other user of any of the Services or (ii) any of your own
                customers or users; and (e) your negligence or willful
                misconduct. You agree to promptly notify us of any third-party
                Claims and cooperate with the Indemnified Parties in defending
                such Claims. You further agree that the Indemnified Parties
                shall have the right to control the defense or settlement of any
                third-party Claims as they relate to us, if it so chooses.
              </li>
            </ol>
          </li>
          <li>
            LIMITATION OF LIABILITY
            <ol type="a">
              <li>
                TO THE FULLEST EXTENT ALLOWED BY APPLICABLE LAW, UNDER NO
                CIRCUMSTANCES AND UNDER NO LEGAL THEORY (INCLUDING, WITHOUT
                LIMITATION, TORT, CONTRACT, STRICT LIABILITY, OR OTHERWISE)
                SHALL THE INDEMNIFIED PARTIES OR ANY OF THEM BE LIABLE TO YOU OR
                TO ANY OTHER PERSON FOR: (A) ANY INDIRECT, SPECIAL, INCIDENTAL,
                PUNITIVE OR CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING DAMAGES
                FOR LOST PROFITS, BUSINESS INTERRUPTION, LOSS OF DATA, LOSS OF
                GOODWILL, WORK STOPPAGE, ACCURACY OF RESULTS, OR COMPUTER
                FAILURE OR MALFUNCTION; (B) ANY SUBSTITUTE GOODS, SERVICES OR
                TECHNOLOGY; (C) ANY AMOUNT, IN THE AGGREGATE, IN EXCESS OF
                ONE-HUNDRED ($100) DOLLARS; OR (D) ANY MATTER BEYOND THE
                REASONABLE CONTROL OF THE INDEMNIFIED PARTIES OR ANY OF THEM.
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF
                INCIDENTAL OR CONSEQUENTIAL OR CERTAIN OTHER DAMAGES, SO THE
                ABOVE LIMITATIONS AND EXCLUSIONS MAY NOT APPLY TO YOU.
              </li>
            </ol>
          </li>
          <li>
            Governing Law, Dispute Resolution and Class Action Waivers
            <ol type="a">
              <li>
                Governing Law: You agree that the laws of the State of New York,
                without regard to principles of conflict of laws, govern this
                Agreement and any Dispute between you and us. You further agree
                that each of our Service shall be deemed to be based solely in
                the State of New York, and that although Service may be
                available in other jurisdictions, its availability does not give
                rise to general or specific personal jurisdiction in any forum
                outside the State of New York. The parties acknowledge that this
                Agreement evidences interstate commerce. Any arbitration
                conducted pursuant to this Agreement shall be governed by the
                Federal Arbitration Act. You agree that the federal and state
                courts of New York County, New York are the proper forum for any
                appeals of an arbitration award or for court proceedings in the
                event that this Agreement's binding arbitration clause is found
                to be unenforceable.
              </li>
              <li>
                Dispute Resolution: Any claim or controversy arising out of or
                relating to any of our Services, this Agreement, or any other
                acts or omissions for which you may contend that we are liable,
                including, but not limited to, any claim or controversy as to
                arbitrability ("**Dispute**"), shall be finally and exclusively
                settled by arbitration under the JAMS Optional Expedited
                Arbitration Procedures. You understand that you are required to
                resolve all Disputes by binding arbitration. The arbitration
                shall be held on a confidential basis before a single
                arbitrator, who shall be selected pursuant to JAMS rules,
                including where applicable the JAMS' Mass Arbitration Procedures
                and Guidelines. The arbitration will be held in New York, New
                York, unless you and we both agree to hold it elsewhere. Unless
                we agree otherwise, the arbitrator may not consolidate your
                claims with those of any other party. Any judgment on the award
                rendered by the arbitrator may be entered in any court of
                competent jurisdiction. If for any reason a claim by law or
                equity must proceed in court rather than in arbitration you
                agree to waive any right to a jury trial and any claim may be
                brought only in a Federal District Court or a New York state
                court located in New York County, New York.
              </li>
              <li>
                Class Action and Jury Trial Waiver: You must bring any and all
                Disputes against us in your individual capacity and not as a
                plaintiff in or member of any purported class action, collective
                action, private attorney general action, or other representative
                proceeding. This provision applies to class arbitration. You and
                we both agree to waive the right to demand a trial by jury.
              </li>
            </ol>
          </li>
          <li>
            Miscellaneous
            <ol type="a">
              <li>
                Entire Agreement. These terms, together with the Privacy Policy,
                constitute the entire agreement between you and us with respect
                to the subject matter hereof. This Agreement supersedes any and
                all prior or contemporaneous written and oral agreements,
                communications and other understandings (if any) relating to the
                subject matter of the terms.
              </li>
              <li>
                Assignment. You may not assign or transfer this Agreement, by
                operation of law or otherwise, without our prior written
                consent. Any attempt by you to assign or transfer this Agreement
                without our prior written consent shall be null and void. We may
                freely assign or transfer this Agreement. Subject to the
                foregoing, this Agreement will bind and inure to the benefit of
                the parties, their successors and permitted assigns.
              </li>
              <li>
                Not Registered with Any Governmental Agency. We are not
                registered with any governmental agency in any other capacity.
                You understand and acknowledge that we do not broker trading
                orders on your behalf. We also do not facilitate the execution
                or settlement of your trades, which occur entirely on public
                distributed blockchains like Ethereum. As a result, we do not
                (and cannot) guarantee market best pricing or best execution
                through our Services.
              </li>
              <li>
                Notice. We may provide any notice to you under this Agreement
                using commercially reasonable means, including using public
                communication channels. Notices we provide by using public
                communication channels will be effective upon posting. You can
                contact us at contact@wormholelabs.xyz.
              </li>
              <li>
                Severability. If any provision of this Agreement shall be
                determined to be invalid or unenforceable under any rule, law,
                or regulation of any local, state, or federal government agency,
                such provision will be changed and interpreted to accomplish the
                objectives of the provision to the greatest extent possible
                under any applicable law and the validity or enforceability of
                any other provision of this Agreement shall not be affected.
              </li>
            </ol>
          </li>
        </ol>
      </Box>
      {config.ui.showFooter && <FooterNavBar />}
    </Box>
  );
}

export default Terms;
