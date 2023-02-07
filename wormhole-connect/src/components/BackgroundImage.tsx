import React from 'react';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  container: {
    position: 'fixed',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
    height: '100vh',
    width: '100vw',
    zIndex: '-1',
  },
}));

const BackgroundImage = () => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <svg
        width="1440"
        height="1170"
        viewBox="0 0 1440 1170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_1900_86296)">
          <rect width="1440" height="1170" fill="#030712" />
          <g filter="url(#filter0_b_1900_86296)">
            <circle
              cx="108.5"
              cy="220.5"
              r="398.5"
              fill="url(#paint0_radial_1900_86296)"
              fillOpacity="0.5"
            />
          </g>
          <g opacity="0.04">
            <circle cx="206.206" cy="303.151" r="160.389" stroke="white" />
            <circle cx="260.084" cy="346.555" r="260.664" stroke="white" />
            <circle cx="297.5" cy="370.5" r="334" stroke="white" />
          </g>
          <g filter="url(#filter1_b_1900_86296)">
            <circle
              cx="1079.5"
              cy="501.5"
              r="437.5"
              fill="url(#paint1_radial_1900_86296)"
              fillOpacity="0.5"
            />
          </g>
          <g filter="url(#filter2_b_1900_86296)">
            <circle
              cx="1397.5"
              cy="683.5"
              r="437.5"
              fill="url(#paint2_radial_1900_86296)"
              fillOpacity="0.7"
            />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_b_1900_86296"
            x="-314"
            y="-202"
            width="845"
            height="845"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feGaussianBlur in="BackgroundImageFix" stdDeviation="12" />
            <feComposite
              in2="SourceAlpha"
              operator="in"
              result="effect1_backgroundBlur_1900_86296"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_backgroundBlur_1900_86296"
              result="shape"
            />
          </filter>
          <filter
            id="filter1_b_1900_86296"
            x="618"
            y="40"
            width="923"
            height="923"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feGaussianBlur in="BackgroundImageFix" stdDeviation="12" />
            <feComposite
              in2="SourceAlpha"
              operator="in"
              result="effect1_backgroundBlur_1900_86296"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_backgroundBlur_1900_86296"
              result="shape"
            />
          </filter>
          <filter
            id="filter2_b_1900_86296"
            x="936"
            y="222"
            width="923"
            height="923"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feGaussianBlur in="BackgroundImageFix" stdDeviation="12" />
            <feComposite
              in2="SourceAlpha"
              operator="in"
              result="effect1_backgroundBlur_1900_86296"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_backgroundBlur_1900_86296"
              result="shape"
            />
          </filter>
          <radialGradient
            id="paint0_radial_1900_86296"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(108.5 220.5) rotate(90) scale(398.5)"
          >
            <stop stopColor="#5A1E46" stopOpacity="0.62" />
            <stop offset="1" stopColor="#5A1E46" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="paint1_radial_1900_86296"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1079.5 501.5) rotate(90) scale(437.5)"
          >
            <stop stopColor="#302A60" />
            <stop offset="1" stopColor="#302A60" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="paint2_radial_1900_86296"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1397.5 683.5) rotate(90) scale(437.5)"
          >
            <stop stopColor="#3B234E" />
            <stop offset="1" stopColor="#3B234E" stopOpacity="0" />
          </radialGradient>
          <clipPath id="clip0_1900_86296">
            <rect width="1440" height="1170" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

export default BackgroundImage;
