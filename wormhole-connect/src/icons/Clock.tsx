import React from 'react';

const ClockIcon = () => {
  return (
    <svg
      width="65"
      height="64"
      viewBox="0 0 65 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1.5"
        y="1"
        width="62"
        height="62"
        rx="31"
        fill="#FFE8D7"
        fillOpacity="0.1"
      />
      <rect
        x="1.5"
        y="1"
        width="62"
        height="62"
        rx="31"
        stroke="#E48329"
        strokeWidth="2"
      />
      <path
        d="M32.484 16C23.652 16 16.5 23.168 16.5 32C16.5 40.832 23.652 48 32.484 48C41.332 48 48.5 40.832 48.5 32C48.5 23.168 41.332 16 32.484 16ZM37.764 39.536L30.9 32.656V24H34.1V31.344L40.036 37.28L37.764 39.536Z"
        fill="#E48329"
      />
    </svg>
  );
};

export default ClockIcon;
