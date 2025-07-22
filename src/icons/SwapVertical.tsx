import React from 'react';
import { createSvgIcon } from '@mui/material';

const SwapVerticalIcon = createSvgIcon(
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect y="0.5" width="36" height="36" rx="8" fill="none" />
    <path
      d="M18.5 14.8235L15 11.3235L11.5 14.8235"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M24.5 21.8235L21 25.3235L17.5 21.8235"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M21 25.3235L21 16.3235" stroke="currentColor" strokeWidth="1.5" />
    <path d="M15 11.3235L15 20.3235" stroke="currentColor" strokeWidth="1.5" />
  </svg>,
  'SwapVertical',
);

export default SwapVerticalIcon;
