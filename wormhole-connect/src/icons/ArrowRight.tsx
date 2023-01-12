import React from 'react';
import { createSvgIcon } from '@mui/material';

const ArrowRightIcon = createSvgIcon(
  <path
    d="M4 12H20M20 12L13 5M20 12L13 19"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
  'ArrowRight',
);

export default ArrowRightIcon;
