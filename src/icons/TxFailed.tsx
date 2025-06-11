import React from 'react';
import { createSvgIcon } from '@mui/material';

const TxFailedIcon = createSvgIcon(
  <svg
    width="106"
    height="106"
    viewBox="0 0 106 106"
    stroke="none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M52.5829 105C81.6236 105 105.166 81.4949 105.166 52.5C105.166 23.5051 81.6236 0 52.5829 0C23.5422 0 0 23.5051 0 52.5C0 81.4949 23.5422 105 52.5829 105ZM52.582 101.597C79.7404 101.597 101.757 79.6157 101.757 52.5001C101.757 25.3844 79.7404 3.40283 52.582 3.40283C25.4235 3.40283 3.40723 25.3844 3.40723 52.5001C3.40723 79.6157 25.4235 101.597 52.582 101.597Z"
      fill="currentColor"
    />
    <path
      d="M65.7583 39.2417L39.2418 65.7582"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      d="M39.2417 39.2417L65.7582 65.7582"
      stroke="currentColor"
      strokeWidth="4"
    />
  </svg>,
  'Alert',
);

export default TxFailedIcon;
