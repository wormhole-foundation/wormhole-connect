import React from 'react';
import { createSvgIcon } from '@mui/material';

const TxReadyForClaimIcon = createSvgIcon(
  <svg
    width="107"
    height="106"
    viewBox="0 0 107 106"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      fill="currentColor"
      d="M53.2,105.5c29,0,52.6-23.5,52.6-52.5S82.2.5,53.2.5.6,24,.6,53s23.5,52.5,52.6,52.5ZM53.2,102.1c27.2,0,49.2-22,49.2-49.1S80.4,3.9,53.2,3.9,4,25.9,4,53s22,49.1,49.2,49.1Z"
    />
    <rect fill="currentColor" x="51" y="28.8" width="5" height="42.6" />
    <rect
      fill="currentColor"
      x="48"
      y="63.9"
      width="25.5"
      height="5"
      transform="translate(-29.2 62.4) rotate(-45)"
    />
    <rect
      fill="currentColor"
      x="43.8"
      y="53.7"
      width="5"
      height="25.5"
      transform="translate(-33.4 52.2) rotate(-45)"
    />
  </svg>,
  'Alert',
);

export default TxReadyForClaimIcon;
