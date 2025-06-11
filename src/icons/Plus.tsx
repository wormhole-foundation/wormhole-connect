import React from 'react';
import { createSvgIcon } from '@mui/material';

const PlusIcon = createSvgIcon(
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="36" height="36" rx="6" fill="#2E2E34" />
    <path
      d="M17.1429 17.6429V12.5H18.8571V17.6429H24V19.3571H18.8571V24.5H17.1429V19.3571H12V17.6429H17.1429Z"
      fill="white"
    />
  </svg>,
  'Plus',
);

export default PlusIcon;
