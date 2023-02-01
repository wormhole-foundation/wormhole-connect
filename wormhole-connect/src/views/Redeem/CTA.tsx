import React from 'react';
import InputContainer from '../../components/InputContainer';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';

type Props = {
  ctaText: string;
  cta?: React.MouseEventHandler<HTMLDivElement>;
};

function CTA(props: Props) {
  return (
    <div>
      <InputContainer>
        <div>The bridge is now complete.</div>
        <div>
          Click the button below to begin using your new Wormhole assets.
        </div>
      </InputContainer>
      <Spacer />
      <Button text={props.ctaText} onClick={props.cta} action elevated />
    </div>
  );
}

export default CTA;
