import React from 'react';
import { createSvgIcon } from '@mui/material';

const BridgeIcon = createSvgIcon(
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8M10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8M10 8H14M6 8H2"
      stroke="currentColor"
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
  'Alert',
);

export default BridgeIcon;
