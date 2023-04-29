import React, { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { CENTER } from '../utils/style';
import { Icon } from '../config/types';

const useStyles = makeStyles<{ size: number }>()((theme, { size }) => ({
  container: {
    height: size,
    width: size,
    ...CENTER,
  },
  icon: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
}));

export const getIcon = (icon: Icon) => {
  switch (icon) {
    case Icon.WBTC: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="200"
          height="201"
          viewBox="0 0 200 201"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_314_9802)">
            <path
              d="M197.008 124.204C183.651 177.782 129.385 210.389 75.8004 197.028C22.2386 183.671 -10.3679 129.402 2.99519 75.8283C16.3465 22.2444 70.6123 -10.3645 124.18 2.99268C177.76 16.3499 210.365 70.625 197.006 124.205L197.007 124.204H197.008Z"
              fill="#F7931A"
            />
            <path
              d="M144.1 85.7619C146.091 72.4526 135.958 65.2984 122.102 60.5258L126.597 42.4971L115.623 39.7625L111.247 57.3165C108.362 56.5969 105.399 55.9189 102.454 55.2467L106.862 37.5769L95.8939 34.8423L91.3965 52.8651C89.009 52.3215 86.664 51.7842 84.3889 51.2181L84.4016 51.1614L69.2674 47.3822L66.3481 59.1037C66.3481 59.1037 74.4903 60.9701 74.3187 61.085C78.7628 62.1942 79.5665 65.1361 79.433 67.4679L74.3128 88.0067C74.6188 88.0844 75.0158 88.1969 75.4538 88.3729C75.0876 88.2819 74.698 88.1827 74.2938 88.0859L67.117 116.858C66.5739 118.208 65.1954 120.234 62.0883 119.465C62.1982 119.624 54.1118 117.474 54.1118 117.474L48.6631 130.037L62.9447 133.597C65.6016 134.263 68.2052 134.96 70.7692 135.616L66.2278 153.851L77.1897 156.586L81.6871 138.544C84.6817 139.357 87.5879 140.107 90.433 140.814L85.9508 158.771L96.9258 161.505L101.467 143.304C120.181 146.846 134.252 145.418 140.175 128.491C144.948 114.863 139.937 107.002 130.092 101.876C137.263 100.222 142.664 95.5061 144.104 85.7634L144.101 85.7609L144.1 85.7619ZM119.026 120.923C115.634 134.551 92.689 127.184 85.2498 125.336L91.2763 101.178C98.715 103.035 122.571 106.71 119.027 120.923H119.026ZM122.42 85.5644C119.326 97.9606 100.228 91.6628 94.0333 90.1185L99.4972 68.208C105.692 69.7522 125.643 72.6345 122.421 85.5644H122.42Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_314_9802">
              <rect width="200" height="200.022" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    }
    case Icon.BUSD: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_313_9795)">
            <path
              d="M99.6979 0.420898L124.296 25.6121L62.3557 87.5527L37.7573 62.9542L99.6979 0.420898Z"
              fill="#F0B90B"
              stroke="#F0B90B"
            />
            <path
              d="M137.04 37.7632L161.639 62.9543L62.3557 162.237L37.7573 137.639L137.04 37.7632Z"
              fill="#F0B90B"
              stroke="#F0B90B"
            />
            <path
              d="M25.0135 75.1055L49.6119 100.297L25.0135 124.895L0.415039 100.297L25.0135 75.1055Z"
              fill="#F0B90B"
              stroke="#F0B90B"
            />
            <path
              d="M174.382 75.1055L198.981 100.297L99.698 199.579L75.0996 174.981L174.382 75.1055Z"
              fill="#F0B90B"
              stroke="#F0B90B"
            />
          </g>
          <defs>
            <clipPath id="clip0_313_9795">
              <rect width="199.401" height="200" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    }
    case Icon.USDT: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="230"
          height="200"
          viewBox="0 0 230 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_313_9792)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M42.0972 0.982283L0.176253 89.0373C0.0167314 89.3648 -0.0338199 89.7348 0.0319915 90.0931C0.0978028 90.4514 0.276524 90.7792 0.54202 91.0287L113.76 199.519C114.082 199.828 114.51 200 114.956 200C115.402 200 115.83 199.828 116.151 199.519L229.37 91.0355C229.635 90.786 229.814 90.4582 229.88 90.0998C229.946 89.7415 229.895 89.3716 229.736 89.0441L187.815 0.989056C187.679 0.69333 187.462 0.442813 187.188 0.267445C186.914 0.0920761 186.596 -0.00072543 186.27 0.000131083H43.6551C43.3283 -0.00393409 43.0074 0.086632 42.731 0.260904C42.4545 0.435177 42.2344 0.68571 42.0972 0.982283Z"
              fill="#50AF95"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M129.502 98.0801C128.689 98.1411 124.49 98.3917 115.122 98.3917C107.671 98.3917 102.381 98.1682 100.525 98.0801C71.7311 96.8135 50.2389 91.8011 50.2389 85.7998C50.2389 79.7985 71.7311 74.7929 100.525 73.506V93.0881C102.408 93.2235 107.8 93.5419 115.251 93.5419C124.192 93.5419 128.669 93.1693 129.475 93.0948V73.5195C158.208 74.7997 179.653 79.8121 179.653 85.7998C179.653 91.7876 158.215 96.7999 129.475 98.0733L129.502 98.0801ZM129.502 71.4943V53.9713H169.601V27.25H60.4262V53.9713H100.518V71.4875C67.9312 72.9844 43.4248 79.4395 43.4248 87.1748C43.4248 94.9101 67.9312 101.358 100.518 102.862V159.014H129.495V102.842C162.008 101.345 186.474 94.8966 186.474 87.1681C186.474 79.4395 162.028 72.9912 129.495 71.4875L129.502 71.4943Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_313_9792">
              <rect width="229.912" height="200" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    }
    case Icon.DAI: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_313_9788)">
            <path
              d="M100 0C155.234 0 200 44.7754 200 100C200 155.234 155.234 200 100 200C44.7754 200 0 155.229 0 100C0 44.7754 44.7754 0 100 0Z"
              fill="#F5AC37"
            />
            <path
              d="M103.686 107.06H141.684C142.494 107.06 142.877 107.06 142.935 105.998C143.246 102.133 143.246 98.2448 142.935 94.3748C142.935 93.6233 142.562 93.3128 141.747 93.3128H66.1237C65.1877 93.3128 64.9357 93.6233 64.9357 94.5008V105.625C64.9357 107.06 64.9357 107.06 66.4343 107.06H103.686ZM138.691 80.3121C138.799 80.0286 138.799 79.7181 138.691 79.4391C138.057 78.0576 137.305 76.7391 136.432 75.5016C135.118 73.3866 133.57 71.4381 131.806 69.6875C130.974 68.63 130.011 67.6805 128.931 66.875C123.522 62.2715 117.091 59.0134 110.179 57.3754C106.692 56.5924 103.128 56.2189 99.5546 56.2504H65.9932C65.0572 56.2504 64.9312 56.6239 64.9312 57.4384V79.6236C64.9312 80.5597 64.9312 80.8117 66.1192 80.8117H138.241C138.241 80.8117 138.867 80.6857 138.993 80.3121H138.687H138.691ZM138.691 120.061C137.629 119.944 136.558 119.944 135.496 120.061H66.1868C65.2507 120.061 64.9357 120.061 64.9357 121.312V143.002C64.9357 144.001 64.9357 144.253 66.1868 144.253H98.1866C99.7166 144.37 101.247 144.262 102.745 143.943C107.389 143.61 111.957 142.602 116.313 140.941C117.897 140.392 119.427 139.677 120.871 138.817H121.308C128.809 134.916 134.902 128.787 138.745 121.263C138.745 121.263 139.182 120.318 138.691 120.07V120.061ZM52.3761 155.499V155.125V140.563V135.627V120.939C52.3761 120.124 52.3761 120.003 51.3771 120.003H37.814C37.0625 120.003 36.752 120.003 36.752 119.004V107.128H51.2511C52.0611 107.128 52.3761 107.128 52.3761 106.066V94.3163C52.3761 93.5648 52.3761 93.3803 51.3771 93.3803H37.814C37.0625 93.3803 36.752 93.3803 36.752 92.3813V81.3832C36.752 80.6947 36.752 80.5102 37.751 80.5102H51.1881C52.1241 80.5102 52.3761 80.5102 52.3761 79.3221V45.6348C52.3761 44.6358 52.3761 44.3838 53.6271 44.3838H100.5C103.902 44.5188 107.281 44.8923 110.625 45.5088C117.514 46.7823 124.134 49.2438 130.186 52.7584C134.2 55.1209 137.895 57.9739 141.184 61.259C143.66 63.8285 145.892 66.6095 147.872 69.5705C149.838 72.5721 151.472 75.7806 152.754 79.1331C152.912 80.0061 153.749 80.5957 154.622 80.4472H165.809C167.244 80.4472 167.244 80.4472 167.307 81.8242V92.0753C167.307 93.0743 166.934 93.3263 165.93 93.3263H157.304C156.431 93.3263 156.179 93.3263 156.242 94.4513C156.584 98.2583 156.584 102.079 156.242 105.886C156.242 106.948 156.242 107.074 157.434 107.074H167.303C167.739 107.636 167.303 108.199 167.303 108.766C167.366 109.49 167.366 110.224 167.303 110.948V118.513C167.303 119.575 166.992 119.89 166.052 119.89H154.239C153.416 119.733 152.615 120.259 152.426 121.078C149.613 128.391 145.113 134.947 139.299 140.203C137.175 142.116 134.943 143.916 132.612 145.576C130.11 147.016 127.675 148.515 125.11 149.703C120.39 151.827 115.44 153.393 110.359 154.387C105.535 155.251 100.644 155.643 95.734 155.575H52.3581V155.512L52.3761 155.499Z"
              fill="#FEFEFD"
            />
          </g>
          <defs>
            <clipPath id="clip0_313_9788">
              <rect width="200" height="200" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    }
    case Icon.GLMR: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
          width="200"
          height="200"
          viewBox="0 0 200 200"
        >
          <g id="logo-symbol" transform="translate(-83 -294)">
            <rect
              id="Rectangle_37"
              width="200"
              height="200"
              transform="translate(83 294)"
              fill="none"
            />
            <g id="symbol" transform="translate(-224.332 64.165)">
              <path
                id="Path_185"
                d="M808.276,400.23A61.3,61.3,0,0,0,747,461.543h0c0,.043,0,.084,0,.128l0,.1a3.016,3.016,0,0,0,3.017,2.845H866.534a3.015,3.015,0,0,0,3.016-2.845l.005-.1c0-.044,0-.085,0-.128h0A61.3,61.3,0,0,0,808.276,400.23Z"
                transform="translate(-382.261 -154.395)"
                fill="#53cbc8"
              />
              <path
                id="Path_186"
                d="M673.015,617.7a3.729,3.729,0,1,1-3.73-3.732A3.73,3.73,0,0,1,673.015,617.7Z"
                transform="translate(-348.846 -242.095)"
                fill="#e1147b"
              />
              <path
                id="Path_187"
                d="M853.29,585.287H728.267a3.677,3.677,0,0,0-3.231,5.423c.02.039.041.078.062.116a3.668,3.668,0,0,0,3.232,1.924h124.9a3.669,3.669,0,0,0,3.232-1.924l.062-.116A3.678,3.678,0,0,0,853.29,585.287Z"
                transform="translate(-373.07 -230.326)"
                fill="#e1147b"
              />
              <path
                id="Path_188"
                d="M869.9,527.924H728.262a3.681,3.681,0,0,0-3.666,3.887c0,.039,0,.078.006.117a3.665,3.665,0,0,0,3.667,3.459H869.9a3.666,3.666,0,0,0,3.667-3.459c0-.039,0-.078.006-.117A3.681,3.681,0,0,0,869.9,527.924Z"
                transform="translate(-373.068 -206.789)"
                fill="#e1147b"
              />
              <path
                id="Path_189"
                d="M833.6,671.331H769.767a3.675,3.675,0,0,0-1.638,6.964l.234.117a3.657,3.657,0,0,0,1.637.382h63.364a3.662,3.662,0,0,0,1.638-.382l.233-.117A3.675,3.675,0,0,0,833.6,671.331Z"
                transform="translate(-390.097 -265.632)"
                fill="#e1147b"
              />
              <path
                id="Path_190"
                d="M899.737,642.649H835.906a3.676,3.676,0,0,0-1.637,6.964l.233.117a3.668,3.668,0,0,0,1.638.381H899.5a3.665,3.665,0,0,0,1.638-.381l.233-.117A3.676,3.676,0,0,0,899.737,642.649Z"
                transform="translate(-417.236 -253.863)"
                fill="#e1147b"
              />
              <path
                id="Path_191"
                d="M798.341,620.256l-.108-.116a3.674,3.674,0,0,1,2.694-6.173h103.6a3.674,3.674,0,0,1,2.694,6.173l-.108.116a3.7,3.7,0,0,1-2.693,1.174H801.034A3.7,3.7,0,0,1,798.341,620.256Z"
                transform="translate(-402.878 -242.095)"
                fill="#e1147b"
              />
              <path
                id="Path_192"
                d="M691.913,613.968h49.472a3.676,3.676,0,0,1,1.637,6.964l-.233.117a3.657,3.657,0,0,1-1.637.382h-49a3.658,3.658,0,0,1-1.638-.382l-.233-.117A3.676,3.676,0,0,1,691.913,613.968Z"
                transform="translate(-358.154 -242.095)"
                fill="#e1147b"
              />
              <path
                id="Path_193"
                d="M709.367,531.655a3.729,3.729,0,1,1-3.73-3.731A3.73,3.73,0,0,1,709.367,531.655Z"
                transform="translate(-363.763 -206.789)"
                fill="#e1147b"
              />
              <path
                id="Path_194"
                d="M786.534,561.345c.01-.038.02-.078.031-.116a3.672,3.672,0,0,0-3.549-4.622H679.4a3.671,3.671,0,0,0-3.549,4.622c.01.038.021.078.032.116a3.681,3.681,0,0,0,3.547,2.724H782.986a3.683,3.683,0,0,0,3.548-2.724"
                transform="translate(-353.019 -218.558)"
                fill="#e1147b"
              />
              <path
                id="Path_195"
                d="M660.5,560.337a3.729,3.729,0,1,1-3.729-3.731A3.731,3.731,0,0,1,660.5,560.337Z"
                transform="translate(-343.711 -218.558)"
                fill="#e1147b"
              />
              <path
                id="Path_196"
                d="M709.367,589.018a3.729,3.729,0,1,1-3.73-3.731A3.731,3.731,0,0,1,709.367,589.018Z"
                transform="translate(-363.763 -230.326)"
                fill="#e1147b"
              />
              <path
                id="Path_197"
                d="M817.008,646.381a3.729,3.729,0,1,1-3.73-3.731A3.73,3.73,0,0,1,817.008,646.381Z"
                transform="translate(-407.928 -253.863)"
                fill="#e1147b"
              />
              <path
                id="Path_198"
                d="M750.868,675.063a3.729,3.729,0,1,1-3.729-3.731A3.73,3.73,0,0,1,750.868,675.063Z"
                transform="translate(-380.79 -265.632)"
                fill="#e1147b"
              />
            </g>
          </g>
        </svg>
      );
    }
    case Icon.AVAX: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
          enableBackground="new 0 0 254 254"
          width="254"
          height="254"
          viewBox="0 0 254 254"
        >
          <circle
            cx="127"
            cy="127"
            r="127"
            fill="#e84142"
            fillRule="evenodd"
            clipRule="evenodd"
          ></circle>
          <path
            fill="#fff"
            d="M171.8 130.3c4.4-7.6 11.5-7.6 15.9 0l27.4 48.1c4.4 7.6.8 13.8-8 13.8h-55.2c-8.7 0-12.3-6.2-8-13.8l27.9-48.1zm-53-92.6c4.4-7.6 11.4-7.6 15.8 0l6.1 11L155.1 74c3.5 7.2 3.5 15.7 0 22.9l-48.3 83.7c-4.4 6.8-11.7 11.1-19.8 11.6H46.9c-8.8 0-12.4-6.1-8-13.8l79.9-140.7z"
          ></path>
        </svg>
      );
    }
    case Icon.BNB: {
      return (
        <svg
          id="Layer_1"
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
          width="511.97"
          height="511.97"
          viewBox="0 0 511.97 511.97"
        >
          <defs></defs>
          <title>binance-coin-bnb</title>
          <g id="Layer_2" data-name="Layer 2">
            <g id="Layer_1-2" data-name="Layer 1-2">
              <path
                fill="#f3ba2f"
                d="M156.56,215.14,256,115.71l99.47,99.47,57.86-57.85L256,0,98.71,157.28l57.85,57.85M0,256l57.86-57.87L115.71,256,57.85,313.83Zm156.56,40.85L256,396.27l99.47-99.47,57.89,57.82,0,0L256,512,98.71,354.7l-.08-.09,57.93-57.77M396.27,256l57.85-57.85L512,256l-57.85,57.85Z"
              />
              <path
                fill="#f3ba2f"
                d="M314.66,256h0L256,197.25,212.6,240.63h0l-5,5L197.33,255.9l-.08.08.08.08L256,314.72l58.7-58.7,0,0-.05,0"
              />
            </g>
          </g>
        </svg>
      );
    }
    case Icon.BSC: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50.7548 0L24.1998 15.3175L33.9648 20.975L50.7573 11.3175L67.5498 20.975L77.3148 15.3175L50.7548 0ZM67.5498 28.975L77.3148 34.635V45.9525L60.5198 55.61V74.9275L50.7573 80.585L40.9923 74.9275V55.61L24.1973 45.95V34.6325L33.9623 28.9725L50.7548 38.6325L67.5498 28.9725V28.975Z"
            fill="#F0B90B"
          />
          <path
            d="M77.3148 53.95V65.2675L67.5498 70.9275V59.61L77.3148 53.95Z"
            fill="#F0B90B"
          />
          <path
            d="M67.4525 78.925L84.2475 69.2675V49.95L94.0125 44.2925V74.9275L67.4525 90.245V78.925ZM84.25 30.635L74.48 24.975L84.25 19.3175L94.015 24.975V36.2925L84.25 41.9525V30.635ZM40.9925 94.3425V83.025L50.755 88.6825L60.52 83.025V94.3425L50.7575 100L40.9925 94.3425ZM33.9625 70.925L24.1975 65.2675V53.9525L33.9625 59.61V70.925ZM50.755 30.635L40.9925 24.975L50.755 19.3175L60.52 24.975L50.755 30.635ZM27.03 24.975L17.265 30.635V41.9525L7.5 36.2925V24.975L17.265 19.3175L27.03 24.975Z"
            fill="#F0B90B"
          />
          <path
            d="M7.5 44.2925L17.265 49.9525V69.2675L34.06 78.9275V90.245L7.5 74.925V44.2925Z"
            fill="#F0B90B"
          />
        </svg>
      );
    }
    case Icon.CELO: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          version="1.1"
          id="Celo_Rings"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="950"
          height="950"
          viewBox="0 0 950 950"
          xmlSpace="preserve"
        >
          <title>Artboard 1</title>
          <path
            id="Bottom_Ring"
            fill="#FBCC5C"
            d="M375,850c151.9,0,275-123.1,275-275S526.9,300,375,300S100,423.1,100,575S223.1,850,375,850z
          M375,950C167.9,950,0,782.1,0,575s167.9-375,375-375s375,167.9,375,375S582.1,950,375,950z"
          />
          <path
            id="Top_Ring"
            fill="#35D07F"
            d="M575,650c151.9,0,275-123.1,275-275S726.9,100,575,100S300,223.1,300,375S423.1,650,575,650z
          M575,750c-207.1,0-375-167.9-375-375S367.9,0,575,0s375,167.9,375,375S782.1,750,575,750z"
          />
          <path
            id="Rings_Overlap"
            fill="#5EA33B"
            d="M587.4,750c26-31.5,44.6-68.4,54.5-108.1c39.6-9.9,76.5-28.5,108.1-54.5
          c-1.4,45.9-11.3,91.1-29.2,133.5C678.5,738.7,633.3,748.6,587.4,750z M308.1,308.1c-39.6,9.9-76.5,28.5-108.1,54.5
          c1.4-45.9,11.3-91.1,29.2-133.4c42.3-17.8,87.6-27.7,133.4-29.2C336.6,231.5,318,268.4,308.1,308.1z"
          />
        </svg>
      );
    }
    case Icon.ETH: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
          width="1920"
          height="1920"
          viewBox="0 0 1920 1920"
        >
          <path fill="#8A92B2" d="M959.8 80.7L420.1 976.3 959.8 731z"></path>
          <path
            fill="#62688F"
            d="M959.8 731L420.1 976.3l539.7 319.1zm539.8 245.3L959.8 80.7V731z"
          ></path>
          <path fill="#454A75" d="M959.8 1295.4l539.8-319.1L959.8 731z"></path>
          <path fill="#8A92B2" d="M420.1 1078.7l539.7 760.6v-441.7z"></path>
          <path fill="#62688F" d="M959.8 1397.6v441.7l540.1-760.6z"></path>
        </svg>
      );
    }
    case Icon.FANTOM: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100Z"
            fill="#13B5EC"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M53.75 40.3125L65 33.75V46.875L53.75 40.3125ZM65 68.4375L50 77.1875L35 68.4375V53.125L50 61.875L65 53.125V68.4375ZM35 33.75L46.25 40.3125L35 46.875V33.75ZM51.875 43.4375L63.125 50L51.875 56.5625V43.4375ZM48.125 56.5625L36.875 50L48.125 43.4375V56.5625ZM63.125 30.625L50 38.125L36.875 30.625L50 22.8125L63.125 30.625ZM31.25 29.375V70.3125L50 80.9375L68.75 70.3125V29.375L50 18.75L31.25 29.375Z"
            fill="white"
          />
        </svg>
      );
    }
    case Icon.POLYGON: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="100"
          height="88"
          viewBox="0 0 100 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_103_6769)">
            <path
              d="M75.5208 26.5625C73.6979 25.5209 71.3542 25.5209 69.2708 26.5625L54.6875 35.1563L44.7917 40.625L30.4687 49.2188C28.6458 50.2605 26.3021 50.2605 24.2187 49.2188L13.0208 42.448C11.1979 41.4063 9.89583 39.323 9.89583 36.9792V23.9584C9.89583 21.875 10.9375 19.7917 13.0208 18.4896L24.2187 11.9792C26.0417 10.9375 28.3854 10.9375 30.4687 11.9792L41.6667 18.75C43.4896 19.7917 44.7917 21.875 44.7917 24.2188V32.8125L54.6875 27.0834V18.2292C54.6875 16.1459 53.6458 14.0625 51.5625 12.7605L30.7292 0.520874C28.9062 -0.520793 26.5625 -0.520793 24.4792 0.520874L3.125 13.0209C1.04167 14.0625 0 16.1459 0 18.2292V42.7084C0 44.7917 1.04167 46.875 3.125 48.1771L24.2187 60.4167C26.0417 61.4584 28.3854 61.4584 30.4687 60.4167L44.7917 52.0834L54.6875 46.3542L69.0104 38.0209C70.8333 36.9792 73.1771 36.9792 75.2604 38.0209L86.4583 44.5313C88.2812 45.573 89.5833 47.6563 89.5833 50V63.0209C89.5833 65.1042 88.5417 67.1875 86.4583 68.4896L75.5208 75C73.6979 76.0417 71.3542 76.0417 69.2708 75L58.0729 68.4896C56.25 67.448 54.9479 65.3646 54.9479 63.0209V54.6875L45.0521 60.4167V69.0105C45.0521 71.0938 46.0937 73.1771 48.1771 74.4792L69.2708 86.7188C71.0937 87.7604 73.4375 87.7604 75.5208 86.7188L96.6146 74.4792C98.4375 73.4375 99.7396 71.3542 99.7396 69.0105V44.2709C99.7396 42.1875 98.6979 40.1042 96.6146 38.8021L75.5208 26.5625Z"
              fill="#8247E5"
            />
          </g>
          <defs>
            <clipPath id="clip0_103_6769">
              <rect width="100" height="87.2396" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    }
    case Icon.SOLANA: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          width="96"
          height="84"
          viewBox="0 0 96 84"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#a)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.368 64.052A3.214 3.214 0 0 1 19.744 63l73.312.06a1.612 1.612 0 0 1 1.188 2.698l-15.612 17.19A3.213 3.213 0 0 1 76.254 84l-73.31-.06a1.611 1.611 0 0 1-1.188-2.698l15.612-17.19Zm76.876-14.31a1.611 1.611 0 0 1-1.188 2.698l-73.31.06a3.213 3.213 0 0 1-2.378-1.052l-15.612-17.2a1.612 1.612 0 0 1 1.188-2.698l73.312-.06a3.213 3.213 0 0 1 2.376 1.052l15.612 17.2ZM17.368 1.052A3.215 3.215 0 0 1 19.744 0l73.312.06a1.612 1.612 0 0 1 1.188 2.698l-15.612 17.19A3.213 3.213 0 0 1 76.254 21l-73.31-.06a1.611 1.611 0 0 1-1.188-2.698l15.612-17.19Z"
              fill="url(#b)"
            />
          </g>
          <defs>
            <linearGradient
              id="b"
              x1="4.168"
              y1="85.832"
              x2="91.832"
              y2="-1.832"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#9945FF" />
              <stop offset=".2" stopColor="#7962E7" />
              <stop offset="1" stopColor="#00D18C" />
            </linearGradient>
            <clipPath id="a">
              <path fill="#fff" d="M0 0h96v84H0z" />
            </clipPath>
          </defs>
        </svg>
      );
    }
    case Icon.USDC: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
          data-name="86977684-12db-4850-8f30-233a7c267d11"
          width="2000"
          height="2000"
          viewBox="0 0 2000 2000"
        >
          <path
            fill="#2775ca"
            d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z"
          ></path>
          <path
            fill="#fff"
            d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z"
          ></path>
          <path
            fill="#fff"
            d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zm441.67-1300c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z"
          ></path>
        </svg>
      );
    }
    default: {
      return undefined;
    }
  }
};

const noIcon = (
  <svg
    style={{ maxHeight: '100%', maxWidth: '100%' }}
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <rect width="56" height="56" fill="url(#pattern0)" />
    <defs>
      <pattern
        id="pattern0"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <use
          xlinkHref="#image0_1595_78782"
          transform="translate(0 -0.00224215) scale(0.0044843)"
        />
      </pattern>
      <image
        id="image0_1595_78782"
        width="223"
        height="224"
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAN8AAADgCAYAAACD1bNUAAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAJXGSURBVHgB7f1rrCTJlRgGR2ZEZVbVvXUf3benp7uHM0vuwxJH0md5CUoQdrXkZ334pDXX+mBhaD0MYQX52wW0oIwV/Phhwxz+ky15ZaygH6R/yJK8ljEDa7GQTZmQgBkDCxMQlvDaK1ILackhZzj9mLnd9/ate6sqMyMyfc6JiMyIfFXWffT0zPSZqb5VmZHxyjhx3icYewbP4Bl8IBCwZ/CBw6uvvhrevXuX3759m9+6dSs8Pj7mRVGE+BklCS+2WFicsTAbjYKZyHgmMnhvE/ivguWSsdFIFvA3D6YsXyxYzubzPB6NVLC3l69WKwXF8mvXrqlHjx6pL3/5yyoIgoI9gw8MniHfk4EAECz49Ke/Hbz+OuMvv/yygGvR9jYTSZKOsiyPp1zwIooFBwCkE3GgeMpYGKmQM8FCFYb4rkJesDDPc/gu6P8SpGRhGBZKijzneQG/c5mxnPNcQZVKQiNBzKRachWwRKbBWI5Go2wyOc4Wi90Uysizs7OMsTdzxj6XQ38RMZ8h5xXCM+S7Ggg+97nP8T/4B/8g/wPXr/N7gGhbWyxKEjGK4yLKzlQcxOEkDHNAPBaNCEIOuBTCag8Z5yEQuSDIQ/yn4x1x80dVl5SC/zk8jl/huwRSV+QFVJDngNFFjr9CVeQZfA0UXFHjOExWKloFQZbmuVrGsciECAHv0+TRIyYfPnyofvqnf1p+8YtfVOwZXCo8Q77LAaJsyDr+vt+3JbbSm9GhujfmfD8eB3xSBOFEBmrCZBAH8B1xCp4JA8AARBQRCzaNIsbjmCFS0TUhWIlgTBFlk2s6gQinnxfwXWpklHgNniXExN/4nWosq2Yc0FwjKRLILIxGC6CVC8DQZJmLBHaA1WyWAWIyee8edUM+o4wXh2fId04AqhF85StfARmNRUqt4uK9caymfCvLi23gDGdI4VQQjkIgaBypGdPrfDab0Rda8wa3Yh6zKAbu0l4Q1T3NW0r9jMRvGm2EuUx4aepWBqM05UN8NReUfQqQL8FvSYXI1BeFl1ii9FVbD1zPoRkJomeWFWkiBD8bj/l8Pg9Pp9Np8vhf/sv01k+y7N692wqQMWfPYCN4hnzDIQCEY4hwoLSA5f0oVirdUstovxip3VEw3knTfCSAXQTWDRCAszieMh4ZLDKLfDablsiHgHdjQDwexV65CjiV8a6VyOHSQo2FhFsuZTPfpC3qICL9qxJ6jihjUt2RBuHLkk7zQLgXkmVnQKsfF9nqROyM5sCirt588838jTfeQEUOFntGFdfAM+QbBsErr7wy+sxnPhNPJmw3mctrRaB2hcgnBaBNIIJAAIXixClyomQcEGoKfBpoUvBiSYXiOG5Uzisyp1lF/65/XTKDctJHVAdDlHmOuyjr4ClRypLKpZqlVZZtxQL1PkifUpq24A8odMIEnlvBtZNikT3cGQEism+vXn31dVDePEPAPniGfGvgV3/11Z0sE7tnZ8nBZBTthpwDOcPNPyeEm+5MPeTB70LEmqJNtfylQZpFK5iPa5IlidJsIv6lckojK9xbgM0gTZRmN5WDErxCSv0noa+6L5ryIr9LTK9+gB6JoT/cYXE58K8aqa1cyFqQzwepKky2OA8iYwFVoYpnmajgRMjgeHrt2vt/5a/80hkQwmdI2ALPkK8GaHODP2J3d3daFPM7wErux5xHwHFGsILEFNhGUE0GepEjlcOnRCmnaVlLMqKEyE6aRa6MwgPv4V+iS0YhgouZvlvWMUWkW8LnBBAvrfXQUcJ435tlLN5jWwJ/cH2HEJKbclzLnMTcwvU4Elq4LKsSrA72ki1mWVRUqIZBWGSoUwU5MSiyM7AunoBG9z4UO4G5fUYNHXiGfAaAreQ/+ZM/uV0Uq+ugar8RBHwHiNsIVlWICBSiZhJYRlA0AEXTWkkEXq5jg0xApRbpwt6lfxNAsDRNWFNdaeQxpeU3sPmxdLlgySJhKSGlYiXhqiFUFyhfk1I2KUwVGsmqPmtOOfZshjhevbfEQMU5PYNIWVFRVWurAlmyw2g3QfMGmDYKQD8RzSdBdH8k5fHXXn998a1vfStjH3P4uCNf8Ku/+quRlI+2iiI6AMX6dRZEk2CUxxGa3YCPKpk2rlk1REBeLspKa4kUb3EyJ8STifRV+WUdeoUjq+l+J+rna0lICYMV87ZeOxeF8q9JRybTF7R0lqRajWKpbYKbgbmvKzLtWnaWV8imkVHo8YtIU3tD8ftpr1YA4ehAKpacF8sRK5LVkh1FjD1k29snf/Wv/lVEwo+lpvRjiXyGtYyiKJntxLN9WQS7Ksi3BcsnoKrjMSGYLqvlt4pNc2U4XHEpLOYkSWjFa9ktaaUISMIieBaRCqkjj+0i5w4HKcpLwqVQNfB1obV7HcZALc9powQhHyJ9YqgjKF20qUJvBDgW16poR8xjcszR1J7GEulNyZTS4iav9Ud5CiIeRgqM+SsgiAugjY/yPD0+O2On3/72t5PXX38dkfBjw5Z+3JCPKB383eFc7uZJtseCfCfPizEYv3lkqI0QhkoRUkSObkMZe5tenPg7WQBLqawKsqanFJZ9g4UquNGElkvZIBdfz0teKshqLEzbAlVKtgZASGUQMCVkTUkWTY161MXqSp4tKSL+F2vZkrsIiPXadpWrlEX/HbkKGJ/nXJ7kOTt+773T+d/8m38TkPLjgYAfG+QDaoe+lDuz2fWDIpP7YVhswcKLC5DpaHGhsmEal1Y1Vlf/g6IEWTekcqqyXTNmrG0kOwmXPbOsalwtRoe6VeBKh9WlBjoK1izXpHtVv6wR3gFZGc9ZKxjE02UlaVkTo0WVcJ1YVmBXtT1QGta06ksEtkrLmlrNqtszaW2MDluMWlJ4KIX6l0XBj7Ls7PDb3/7+I6CCH3nlzEcd+YKvfvWruAKmYfretYxPrgVKHLAgRc/JwJWNLKLUnZUrtyythVSyZgC3SGFYyjgyLmIx6RhZO+NYPk5AVQhHvitxVVSIKBwk5V4PHPmyiXyeLGmol0Yv5dgMWYkQqsWJTWtpQQmEmw8ogxJExNRuQilz7PFmAwL7ZsTNdzMLwLLq5qUjl5YN078ZQBQVx/lydD95/PiE7e6efpQ1pB9Z5HsNtJfsc5+bzMf5jlrJ5/IiuAFULkb7nDKsI4JGHrPgcCevVj6bz3GXxx/tCEduYdO4VMSYx5hV4XvUyyBPVP5TSkqOYkM0EKuBkZ6JYQAoVftpF7tjpDdzIWFzSZ3NpZVSEvVCJHS0smlasqvVeI1ZI4pK6h+XqmE99lIz6rSDbPA0GiXLTB1yPj68fZs//N73zhJAwnWurR86+Mghn/G5HD333HNbIj+5XYxGzxUy36ZXiy86kY6MJWkdoOsVijbxVIBSRC/sFBbWIvEXOj6mVe4RUbjSEZoxXwPJDAXAH5EoEQyRS8uAnHWxjD6U+lT2RMDYGpWxOzJjg0xVjUoyi8QaedBEgs4Ai2QB80iTrDc3YzLEeYuiKSBhpOeQNivh2UDpL7ybxJmGaKQWoAC7v1qJ+2n6f86//OXXso9SDOJHCvnQVvfyyy9v3bm+dT3j4c0wZNeUyogvc18s560iEdjwrP1OseMjrSbgwmUpp8bUwJhFCFH+o9GQI7IZ25hGNt7kFR1o60cFPvKtVcv0VlazSRioLA2tDGepZEpRo0smC+loMN2iynjrpOQcgE4CFolRRozIzS4uTTao3IodBETib13clMF0SdrRUOVKPs5Y8N5opN6/c+fT849KeNOTVLNdKSDF+9rX/pv9JMk+sVLqubBQETFBVs4oS+LL5V4EgDYtVIvSyoKRNaqDSl2zpPQE/VtOnHDsYEARI14tqCbL2D7hTeWKiyAtCpkaqN7K/Hr62hay+QwiioRHJ8A+KmAvubDaUOkongBdjMZzCtxDDHO2D/fnaPcEijhPjol9R5HaevLIRL8DKEryITNeOBoJpWF1SasMN8JrMKuzQPJrD3/wg7dARfP+R8Fl7UNP+dBmF8er3Tie3o7C4naa8XHp+Ouo/911FRPbKGj3dWUp/RwvWcsK4fR1K8dp+YX4J0A2H3HrCCfci6J+W1Q2PWa5Yc4aVGq9zsYDR49UylGV3mWg6KS8P54pRTo3NTIl2saZStOeUwnZQhN2YhCR2FK3/9poSE7o06mJBOFGiUSKrqSMuMBAKEDwrMjZQ6Cxb52eskcf5lCmDzPyYQDr6GBb3Mry8AUugq2skFGeoxbTyCtYylE4aHYnYnGNdXQXuzARCdwJqistc0KzlTEhpmZHXQO8W5Z5CGXumKIljgleL+3+qH91frSRty4MVc4USHvJ86qpjCUu6st6NdVXVylDF3xZUZtjVFlFYuTDZJES+4pISIZ9Vwww7wZ9Z2MytEa6rTLqQhH1RI81QEIwUOQnYcjvv/POe+/+rb/1t5bsQwgfSuRDFvP1r/1XO+8vwk/GI34d2MyYFTJMszxIjU2qDMExrlwo7KNM51M7hIocxS61s54bxlDuspUaiVxE4a2aTYuT3DHSibpmhrm4y2u/10kFTYRzxT5XHm08Y3xHrWeLhopK1sGT8lT9HvM2O+XIf8qykDZmEIsYBDwhSlhpSCt5UFNBEcflPFsH9LI3WQG6NJHOl8nDMIzfOjk5Of6wUcEPG/IhteOfurl1bSHzFwvGr2eZjBDBdIyaIidmi3gWiXZAsLA2JxesXc9SL0vtSm2lpXJUj5blPIJZUjveNIJ7SMdLRLB9cmEYstUpq/ujhy9lXdTTViB9a4SHRLJiW2vgWzBkjTKyMgQK/0uNB400BntlEB+1oylqSdF2WEfCWBvtSea2URilacQ4rBFbWmScB4/TPH/n0aPlIayPFfuQwIcG+VC2u3EDRIPi4HoeJnfAbreTJumoDMexO3nptMxJUYLUzkU64bh36dAay25V8W9W5nPtbhpB64oT7iBUdZWVLTAP8cp6ypv2q1iDP7V2Rfu9+q+GfrOXba2B9UYxiKS1nokTRuRQ2botsfwmy3QWmhpWPrAoB2oTD8qLiICaJU3ShemrZunpHc5iE6AcVWxx+c4TliuWS5adFIW4L8TWvTfffHP5+uuvP/UaUc4+BICId+vWeDYOZs/ngbzDArUvC8mztIZ4KJCH2uE3jkdsMok9VXYYCs1GhiNMs9dEPIw8H42A7Rnpsoa9DHUKFqxA12We0tcwn5/taej1OzTPhM6tkJR0oVc0rP1uQlirs/2e94vr7lKX6SPsF9YP3PRP0ByEIqBkTpi5UASCBVghVBUorWzMzRhBFvD6UNiRhTk8B39hgjHen0M9gcA9P9CP0L2ITeCdhZi7DdrP85wVgOUgXWDaNQoyxhoFta23rwLnNcBaoCwrgjAIY1VkkzCU/Natl+RLL70kv/Wtbz3VbOhTj3yvvfZqNJlc2wfc+gRscLeKPJ9JmQdJpr0xMvjkls3kIzadjAHpJqRUCUNn0aLbF/wuHZnxO3yNAHNGoOqejFEDGrHRCNnMsCRnof5TrnorB9p1TMUK1sCKCh8N8uX6U4RNZOtHPv8VlXWV5QvWQE7vC3WYddetUUV/47SRWKTVn5A+xAXApiVGAuYItf+AiKOQyqDdO2S6XG4e1M/B9UJ/ZwYJAzFiowCRekT3AdVYgONBW+ooxjyKGpfzkCglIiBusEWuZT6adihDzH6onbhxkwgEIGARRnlWTPmoiJ97br/4I3/kpzKggk+tZ8xTjXx/9+/+3XFRTK/JpboN1O0mGFvhdwbcT85WlMBOEuIh4EuJI6R2ESGhBU3xgAKOuFkENmwHoxdCuh4jhYSFxEMr39k/ocNThmU7LOxa7BorvEmFBZZXtNMQvcJiobmUe7996KBsHdSvZR9gNWxldnTVN4ci9hDGChkNIhJFRIoWGGIJ1AnT+SKBypEquciIhjmDlIaScg6bGWx2+BzunkQPod5RNDJUEP09tSiRExIWNJYCCo+ozthE6Ic0CkxxqvJMwN8JH41GO1FQfOaP/lTytCLgU4t8X/3qV0eg1XwuTRefAN7jhgrykVplDN4FfQqpWRH7cpElGeGCIDaGkXYzhN+YoyQcWQW/pnwhvnTASsyViQhLVy3iMeasw7CxkjWOFSUClpTRKeHRIvpRRz5zIyy/MUJRMGC5iO11pv4rXFPGZtVsf4AWvs+W+kVotohB4CX1cz+4ceEcwhqnzY7mHZNn0MYHCCLCEhkDg7SCxkz7EXqusBFQvyDUDgojoREU+FmG2XHi0RQ20hG8epDmMtSa6phbpZAlhXK8ICSHXRMUMrh9CTO3xBZzsDlOVB7Es92x/Lf/7T+ZfeMb33jqZMCnUeESfPWrvyDy/Pc9B3jzKdjFdjBxpI6dS8pClXO0Dd+x9jNhlCZTJ5RHK2AIBYH7jJwIBqsA4W5MnadkcS4w17OFM+9OizLDv1fTeNobnuKlUYDV90fR+NJejjcu1ZRBvMVM0aPIqZ6zddVC4E0gbmnTM7lnlDLvDPOCeipRv15tmliyJbxjCUoXZYqgvHd8dMhO5nNKxaHNPtrrCBVj050ZbKLaNlsmoVIYeQEsq5RAL8OTaDr94fbx6t4rv/zLq6fJN/Sponxov7t9O5go9aN3YBo/Cb93KN4O2I3CeFNYoB0btlRk/yOQQ8II6BfKEygzECsT6l3QIh7XbkzoJhUCtfOoG2cuY9hC+Soyom/xJpfWQmH8S0VZX1mHX7xibD0i1SLTtYpwLdSvjzq2sLlhiyxJDLdRVoWhSx5rpNKwkyOgXijPITXE4nishH5WU1KimCj7OSwpPUvUD94LcCy4CQT0n+bGp+NtQLYxsaAY1kSGdxYSFZRZginxYUONSHTYGuP7x/bgd1AEYIyPc6lmq3E0+j/+j3+y+vrX30i/8pWvsKcBnirk+9znfmQ8n4uXRMA/ARL2Ngh0Aaq2iwLtdxniYPm6tR9gSIhELAy87GikWU1EPKtYwQFGUG5sFDBhWCGOHnxYsSsWGsjnlWYuggxHPlOfq3RBKFitriZSNOps3G9eDGt1N++3IF+jWGi5ZtbRaBOKnEoKQsYRsbeAAPgqSw0o8p3EYea15C0kOgSklCFtK8mCwGoCscL3u7W9DQhYAAKifXBFuwXoYAH5FCEgjomDpjqKUITIrY4LFLMZijDbo9Fk+p3v/OvjX//1X38qkjcNMPg8GQBzwviHP0z+jSAvboZcRTkw7DlrOVuAMfKGt9QMPeWF5bFcW5qxE2k2M7Y3+sFjAXkbT6lBdD/ngtbAVr+l86h27/7g9j5qv9ZBt3+1wlDOvVsdxtIA7rLdaHONiEVc8NTkuklYyW7TH8dPVJr+GJOqSrSztgAWNmH6uZs3Dxj6uR8dHwEC6uh6yabGU0dRH+OpSUDFYqqXbINSjgARb7JsUbz22mu/+8orr5x90CzoU4F8aMd7/vnr/4ZMklt4tkEGvIpO9VNJFlZlYkN6yNveWoE9OauieDptiiuv+Yu99IKpwUZIsa6o1whZInX0gGjcNPV1okAFA4qcG2qiXAm1cWgE1Bd8HHR/VJVg6CM5TCteRsYz48jOyj/KPKXz6EgujGy9NN3S8uPewQH5gT548IAQMJXaYVuLl0fwyAHj0ymbzTSGL+Z6JYU5WgPDG1jRt771v3wXqOHyg0TAD5TtRBkPYPzCCzde4jz/BDARaKcJ0F8BTQgF8JkKDK5oU0L184h8MyfEzixOl+zwvUN2Nj9jKWjDEiir5Qot9yHbY48oIT0cjdTnFSvqJjyWq8kSumxfjW31WLs2Dxfvkm5JuN2osbBUX900UDBHJ6rvGJ6qm61kDS1sHfTQ/Ou22pwUr3pwRUtZz4aqOUkjBYYk3epfhVceNZ/4ftDYjjInjQVlRBhvUbDSNqjt9VqrijbBAuTGkTFr0HXgifDe1nSHJdDRdLmkdcICNEKg2T2F/oc0kgjXDuoBQDmDTGpeSGxiPD9b5Mvv/XD51f/xf5QflAz4gSEfUrvf+Z3fmd24MXlJKP4JMCWMJdntwJwAs48eKyEGmqOnSqyN5gKMsCHcO1ss2OH778PfM5j0gMkVTDZcR5lQO1UXpMcNUf0dWOOvthBZWaeS9xx6WEe+2g1RPuMVd77kzPrD+Pc4s0uT8MUxuBfYJ8fkUCFgm4zFTSv9smYb0rfZ+qgZXOlF0WhPlFU6fXPK4KEx+An1INwhVojIHfMElCsI0UJtHzSR/WSkV1gHqWAqW6D9oIIm0nOOHjajkb4eoV0WZIoJiCCZBAElT9kK1kEByphCwlrIlqQLQCUc+oeOQGFDrGwasFW2AsYpnM6LYvTtb/8upiyspwV/IvCBIB9SvN/+7d/evXZt+zZsWLfAZjPFF5lnmXYXK7THBRrAJ/FU71ygvSpA+J6fnADiPWILQDwE0qSZbGEMd0nQiCHyKqhLkoeEtqeoQpGyXxvaXaoTtitGyt/VFNFPEbJacebratq0GP1eKK7msULANsN7VY/uS6OhriYbZZp9aaGcYa3esO35+k7EmL/7VNfI24UoY1EiYZ7rtgUgpjLXK4TNS6THT8CMwozrTTUQejNFV0LMtIYOGOg3KrOUjPI4hcj94PmHI9i40TMnBVsxqmLwxO2xIEfC/C/9h//h8sd+7McUGOOfKAv6gSDfyy+/DOaE4xeA3b4NlGJaoEoYkCW3uyn1DANVpzRp+OYURUYfs8OHRxQhbdcBmhlwCrX7k/HVCEyQJ1BAma0ACTPa3ZWhiCIIKrX5WuSrLerwPMjXUk+9vbDlERZ2IlCta6yBmI37CE3qtxnyNXjdduTrgsL+qdY4UrOcGFDYONHAnjvr37Cjuu2QjPUi0G5limnkxPeMSIya7zzLadNFcUXCRo2uh6hjBaaVzEwhKH+Qs1LQBvI7AfC0QvBIFIm8efvF5B/+w3/4RLWgTxr5gl/5lV+ZjNTZDeD7X4DXOAvQcxcmC70YEMgfMIyI1SQfQpjUrJDs6NEhe3T0CBDPUjzKCMKi6Yg0alprZ1g+y8YV2iMCvSOKwnjYw+4oMy1X4IsWYVDt6EOQLw9ZY72VX0QPsXFZV1Zrr2hHat62oh0Ea+BSTUZrpX515LFf1iNfxZ0611jYshF0QLnfOdSNadYSEQttggHKc7lmQOlNhHnJxjLLhtIrQF24QDEPj4yiiIcxyHUZmh3wnWeS5EA0QxR5QnXFE/RNDcAUAXoBVMqhxgF+5jyIYH3kP//zP5f9D//DkzNDPFEPl7//9//+lpSnN8FO8wIIwjtgZA1Q6YEhJVbrjenZkeLZxLMLUE8fPThkD44esnSeVMoxYCdms5i8HTwPEnPPQpn23UYw2Lg+k+5cn9DDKO+IjeGrB8rS8+5AOnJoNvWpjPVd8GP8/Hv6Z3fE+kaeLqzZz/YyLd40wn+48nDxa+AX3MbL1B8UVpS0xxHWcuHjCU4nC516DkOUbBa148P7YIqYkyaUehfjWtljB2CmQFMFrRnTqFILPHoXUXg+DiZ3r91i737mMz+3YE8Anhjl+9KXvhTfvLl7kCfJC7B293JSPQFrkBsZDz1QxJRNpttgENeaytVKskeHj9gDUK6kq6TcXfEeJuoJw0kpw7kMX10Th4vFEizcVXH3RIEgyDMy2ir4nsFOiVQRqWGA8iEPmXV8bAawdrF+YQ/ls1A0nm9l8aho2Ml2lvQrb/ahtbWeMuupn9PnVmVQ0SoPbgJaYxqSTG3Dj9C5wmdDQ+/DRwF5zKBUQR4xoWGN0dFCKaKCKtNac9SArtIMNtwJrJ1I+6WCMiaHh6CNIE9zEYSZyJMg/+SP//5TPGWXXTE8ETsfajZ/4if29tJFcKuIgOJhnEhYJYK0FI+iliNt0cPd7/jwkD0kW05F8fD4OMyvWe5eNeCifT8pvTtb7isbdZ1wEtjxgK/pNNHp47lJJ2jjAq/KxtZldOwp2N6VNtthvYz/5LCmdSn9b7NlfTAnuxiQNZw5fraYTClh5WGhbiECzLMKRju0IarInCmBKdFgfRzoOg7VHN4rUkSkcqAzuK9jPPf20FZINVCdUIJnabaHpog/+kc/fQLE8OiqbYBXjnyUb+X1v3v99HTxI3wkr4VZaMzLGvMoVw5M8mxvZo5MRgdqyR7cP2Tv3n1XZ1DWXCJN2lRba+nZwS+75gHTD5L6tlgIemGCLwylNYhYJlXiDQ+W80Lb4u9a5Oev8ZxwlQb9FuDm1CadjlGRUV47aSdOVjQHAeErnnNPB44urOfTAt4bFn6ezPKL+Rz+QQ8bxh7cfUBxgZSLVVwnDipJ9AAVT0PQPewEKvrx3/zN//Vfwdo9vkoEvHK28/r166CLDH4MDKPP5UWoNRJoWsLJCxkt6On2lG1PtolpQ6/0995/j90FxDtdrEp2BpUv6FYWlrF6YSX8O2yny/6U8kmo79rypX4ldO+zmtIDuQ7gjEM09Cu2wmRA6CkP39HIC9K6bk+47FbYx2Uy3ZoXPecrb8IWlrGV9Wyyrk2os97d97vazxv1h059l896ep2xbCguGfIBRWUMc9jQwitMJiVcT/AdNaH4npBtHQFHhQ7Z+P5Qm45jSsgeqFnQMXBbEXFb2nBfyCQopBpBEX737oPjv/f3/t6VxQJe6Z4G7KbY2Ql/DOx415W0/J7JKiaFoSgz2Ll2aBdYAqv57t232dtvv0vCslVf6OzGlgXUUFKc2vZh05NrEJ0ET7QqDrqAl3UvmFYIxLC7YhZYnnKdCl1cXOnQzruZ5ES819/rownI8eCUoC+vYkS5dIY1c5Pp3/SL5kdRLtWYfDp1ehF8ZwcH+3Tv+PCYCDk6cBw+PLRNkLsari/L2j5+fAKGw9VzK3GyeuONN777+c9//koQ8MreHrKbb731L++A4uLFIA/H6JtOu5XSVA8N6NPtGbFzaMtDpcvbbwPi/eAuaLHAHIAGWc4ojRwaURHCsFqAYdj4UtKCirKFJVUjekMGWrNXlrt32EH5GKtuOOFE5hL2V+FuCTtxAYobtB/lmHcEt1bhOILVZrhBG3OnGT1xXj+oZdc1rq22tkD1DSlf3YPFK9VK+Vpsfp3R+BcA42rGyCQ0IrexIMi0cb4qYNrX74UsiSonUpiDEg2VMRi/iaYHtPsi8cQcNKiAQbK6vbtjUkOiogfD1ESgshQzXGwF6cniH/xP//OcXQFc9lQRAOKFv/Zrf3sGdpsXYZeaShBiy+hIRCiwy80MxSOqARePD48A+d4hVTECUqaIMkOzjaA6sqt2o4x4aF5f1wQ5+jL3eV5+Q/kBAzdR7Y3BnoslZmae6/PVKVWe1HkxXSdip+0yFtW7MSToulaXZLU8t3bC/a+9oJoFZfkP8+tre9xmObtMMFOtZUAt89tjuasC9qugCBZMNUjJsKYRKfHQCRs38QN0yJ5Oy1BgfEeHR8ckB6JSTx8dEOlzBgEBl6vVOFH8pW984xtbSEzYJcNVUL4ATwiCQfx4oPIbtB2afIvo60cTOEEFyz4Mcky76PzRMfvt//v/ZqfzM81qhlprGUXaB1D3tMoiVmWb1jutlaOIvrnyHA8rLacn7wnHsB42VO1WpUL/1uSb0KGEvCK6ROcCooIFubJhmotM6cDPPAvIOZgigklWdAW9CnwC41IUxtrU+1YyDVsrqUbSndelxeDeLNigfn53nhAFNG2Sk/xI0D6BBnktA2Jj1hWGUWCuvpfrfDHmRk4ubQFLlmfkZYOP5iDcpVmGrjOAqFtsPEbnjoDWqsyyIEllDNSTgyh0+g/+wT+4VCfsS0c+zL0yHoc/wgt2C/OuWMRDQLZhGxBvOt0Be96YBGLURP2r3/suKFne12V4WB6nPIoMW6gf1vdqLJCPHBq5SqoXWifnsIZ8oce2lihX4kRFJkPm1u8uOrcOxhjz3dTw5RIHpDR7mgMSZnlufFfpChPIibNqofpIUkeKdrbTL9n9owWnDOR+PcS1+cjjs7ambME6g3ULd24uG3BuTUY0CmQAFlRHzDsIyPQaCMiGpxEQxQDK+2MUOBk68GeKhiVXK/KEEqMxIJ8Wg8JQj2O1OANph8fAxaXf+973Fr/2a792aaT9UqcIFSyT/GSfF8HNrChi3zNCK03QkySeTmjnQhYT5bwHD+7aUprL4NYjpUOrwtzLThvr9Celtwu7IBgFjHNFdJTRBauksfosg9R8tPIGBX0t7NsU96wFumX+y9IGqJZvXaWGcrJXAZzb9cRLO6xmQ92PKE+PIm4rmpJ+YYreLvt7pOij06eYnr/5/Ji9C2vxISliJD2D7CfaekG2mOR5civOsr3f+q3fGrFLgsvUdgY/du3aNImiW6Mg30IpydrySn6d1LpTOu8AEe8QDOh3372rI5yZPh6KUoMz4RjLuf3fd75qINAlE/G26rpmy430Fl0PM5PuXM+JsmpZhcG1So9X6Y1BCWaizHvqqhqmb6U57rLschdSpioa11UqYys3N2Wi6qVBwEobqmU4LcriCgNNA80Pno+6v7djtKE64TI6VxwfHwECogF+j/QR0ynmjJmxBRjnZcF2F/ny+fCddxKQ/x5fhv3v0qYHHaYn1/hzvAhfEmI0ykPt2Ky1dzigfRjQjG0DWc8Lye7/8C5763u/x44eo6M0CWhshPLbONKcmOVbeJUHU18zv0oWsYPlZDqPSFkG79nfLk8UVlpSr87QbSa0XWGs9Tdr2BwZ65hcp21F86PI8VunxwuI/QETFbBLCpR1gWF/TNxcD+tZfvMQr+ILtc2QdfA6Yfs386Np76u7mzHWlBPDS+armmBTGGZZTkG5tN6YDsjV2lCdY5STDGiN8iPYJzH/y4hiAxPQeOZpSmNErmS1AjMSyJQ729ssnkzgWdCKJpg3JglVkUbzLJGHv/V/nv293/iNCzMclzI9r732Gt/dzfbzlN0GOc+c7WRuAjbMgHTPJjrFG8Ic5Ly3330bNE2owTWeLpwZDxcLxn7T1ehansfRTxrvmGYR7mgvu8Dyqu2Xq+/tjl5sfc1VeaUPDFkkS/ik7OQk0YeIJNVZCV1M5mBidxFeUfbVeXHmtz4fQ+ymmqOKDXdV1VRPg4gcFzppIKsagc4B2U9kPff3ZxQRUebWgXl/9+59EIUOiYLGMWrlJzqtxYqNQyWvv8P5Dq55dkG4MPKh3+b9+/e3IrZ7I+TBLl6TDnuFh0jO9g7YbGdK3uV4LBSymoeGt7Zel9PYYypZk7V0ZUBWY8l4v7w3ZF1sOpUDF/F517oymlLrqT83iKiTBknvWC8EOaAHg6wNHdflhuW1vyzbCNzi5ZvlzOZUqokeTlmU/4SW/7hzEE4TASNCwCkgEyIgHlU9ne2zvZlGQAQr/33vrbeADT2hayguTYB4pKB1yQuxNxXixnaabhUXjAq6MPJ9+tNM7O4We8WIX1elKkMSo40/ULjdR+EWdp5kocht7C0Y2MLIeQia4LkGtzo9ascsQkfB1itaWu+vxzbvMbnx4+eDJjlkeivT1BARcDFfEEKiXdF4E1ddvATty6YbRlX+clQ/vOtiF/bh5SgulS4eAnqlBMV+Tim50gQ4sn12AJRv5wDMXpOpQ/1A/puj3fmtUh9hjyoDs4QoRunzi3Fw8OYbb1xoFVyCaP7pXSFOnpcypzAD5Rw3iqeMoqzHgS1Ad+UHhw9AoH2HHcHAbPPEbvJKMepzcJy1dpEzJgas/svBjzVRAm6H27u6trphXbCKFaVZC3R1w6OSY+3zqv0TTQRGewW1by60RCmgIqNNaeJlXmNVbS0V06VzjLd8pG0X6KkrIrHGOmDrE6xIB1YG0BjWFC/H5IRG48Tn9oEzE1AeRSLyVwAO463f+z1A0Cl78ZMvErt6cP0A1u4xboDTUC2eu3f0f6HC4gE7J1yI8gHfuy3lApQsai/HMGTHuwF3n5sHd9gOUj0RsUP0YPnd7xEvrUEvFC6cMxIIq9pn17uqzCJ0L3Q91UCIvv1GsFbhzrvcssJ6QA244ja1SU10FQ+ZBGo4P0aKeMIW6YJJ3K1lT8WDTRkdfZWDe8cuHRQrzVEWvL2Q3MTwmyOmCB09o1+j0Z5b0xefAPXb004fQCyQFbWAsvbv/u7v0V9kaWf7U6KAlFE74rvR1v7Nf/zVr07ZOeHcxEEfVhl/ArRKd1TBx3mWBtaYPom22e7+Lnvu+edAuRSzxeox+7++9dvsh/ffAVZpRdrP2KQTJ43VyGoHrYaMkyrRDWP1DM0lTlljbjUM68GiswY6WkvzrOBWdxc6Cr1KS8mdBpta0Lbf+MX4cTbVgj4nTc06fWU1aNUaul8qrxb9qSIJKC1RoVMtYo6SJNMJZfMcsyIo5qZ6D1sbZ6zuqVJmNzNteL4snubTpnxolHI0tWwjaBS38+cENYROuTLGwYwzxBQSmHKpYCaVYVGmx7YpCymhVqSf1drQADTNoAE9O7NF9fFzoJHe3kbvly2qf7U6hQ0uD3Ow9vOpkHkYzb/zne9sbHo4L+ULXnppdyfP+b4IwgkMNNAZmImWsekO+tHdLDNFHx4e00EXNiMxN0xjVI8EcIhOg7NrbBM9+wbv+93NIjYdJLtYuDqIQd1YD5dhoGOlQiZJtJIGT309OZlTug5Mrah6KdKmchtnHuvZ1p+LUECn+vL3mqJ4EI5OruzqDlq4Ks6IXcfykwi0mqCE2QHlC/p/WkAb4P13H5ASBrXR+rTjHTbewlNDg0mWB8/9+T//52fsHHAu5PvqV78qZrPnbkRhMUMnalkuWn060N7edTJSImZpY7pmNWc7oNoF7dLObEqeA3TewpoFx/1/mvec65cR2GpBNL50QE+bg5dcfYFtAgNwxSLjYrHwPqhNXecIrbqa9JytVf8DTwCMKFf95sbrpTx92ICwr7SacGI/Y+uEDezldGLSzWtYAuF4AAi4IOdrQfZqQsAxGAQDvnt6enrwxhtvbLxzbvwAenf/+q///R0wBt/Iw3is5JJSdetzxdF1B20n+yY1OChZQLt5fHRECZEEaJS44Rm1aUh7FyDg4Rd4z90lNc41mftSK8Xa1qwztaWLJmf+k11QPlC1IPnax7pu1+VU92JXvzthjeJiqF7DNVNgBLcwCaVsSI2mFjUFzKDKLe/ToWTZUPFSTldt3rzvNUSvX9auZdZlzzl4gJQwZS4F7QkDxADL7cD6pY2KgqfnVrcFtr8HpLlH5dbOjiZ0UC5IFydxGPIbRwBw6SHbADbeb2/fvj2CzeEOvKgbUmZRlmLsnSRRBneOGzeeh51hn8qenDxi//q7v8cWZwvy9qdjL1AzN8LUbQHGTVXHegXo2aJPK7XcvCfnMdaUvRhrSZak5QvhPFuVyb1oBq8u82zo/mT+j9BvqBTDQje9e1jvYQ1CJzYQwd0l2oo3fnR7knTF5HUBeYSgTJNnJpWijhJA+YfS7DjyZGtypY6Qirb4w+Kcke5h44tXaeczdi4Kk9uTmRSE5SPkBWNKFnbNFJRzXBUZRbonQBAwwRY1hZEPUGi2uwvy3zZdw6RbIFsHea4CoIrqN37jNw7ZecY2FICqzcDUcQ3UuRF5XjhbOiLf/v5BGWv1LhjT52CotIdYugooilzAeL1Yn2KzR5okJP0T+uD56CXV69giujLrifqFy4a1MWvK+ff8XWk1UzRq9X+3hOStB9zdpXb4Rg4EZUWSDY1HDVVJRn/2FAFnnvW9eddoRQUo94zJintCitGK8vI6ZVaI9TqeztA2PSvXElK/o+NjcrzGuUJWlcoBxQyBBdwK84N//I8303xuxHZi1IKUx7eEiLfkSoaahVHEqiAfjBmhEJGwc2gvQYO6MqH5OgGSYE5WTFaftakj6CplnV51slsllJNAp38V8Ja6e0v343g7eCkf2qaxi8/ig4oN7QsxiFI5ygTl/ekThNtEaZxjHWGx0Mmt8NBJk+OUqlX+ZLVmc3Mdzd3LZq1sAp7Nr+9Ra8BzH2Ra9sNz4jhLjDO7ZmVtSXIbkxUCYmr5KJmSzkIdpGyxRNONzv+ZgpyMypfbN2+yA/jgek3TPfT6C2G9b8fL6W0o9l3WSZN92IjyfeYzz82CYHQtTYsYz0GwXiw4QKR4+MEXhZN89+232eJEH+lk4/PE4IkX5LGAWqcdmATMToWfHRMSgrZBLvwtr0yOy4YD7/i+/kHOzqXd6dRLNMLQu7cX1XH3vM4laxSfykboLxakLU2SOVxcGEqotEwku6psjutCChmPqteFwfaK9fpkhhury/R6DZUUkLEyVIm8YND+N/Op33x+REeTJTAfcazXZUTROlF4kpzeAmXkZGjU+yZrNTg54Teh4mlRqJAYTpmQShc1PyjnoaMqsiooe2LaP3e7EnwjIut0Dg+64GSS1//o+nAh4OEYzJwBrosObMMtxtsu1qAvTGcTHOwqW66j8+TTvIRwogENWWSj70gIeEKslz7i08oTylvIF2lvs+d58yJdKskf5fdEiq4vNX0FKQAOFTRwfxojAUFKD2IUGN/RzIBZ9RDQbPPuu4ds7/oBuwPr3mpK0y3Bl8fhjhDp3he/+MWEDdhmhlK+AM0LSoXPSylH1ndTj0uznLgDkA8iDPCdd96mw0zovmE3h8923+qp6kCE3wOt6pTsMugkG18KHnTCRd0WL7LYBsDleFVuVicFAxM1PCFZUSe3xTuXKxx6tZUMz4AJ9ZgjXoua6XjABN+iyxmltURuazL1uLbj4wfsIZjPkI3VfqK49vFIch7yQrzwcz/3c2M2wOl6EPKBrMdv7oyeh/q2RqMwUJZnBjzZ2UEli44M1h07ZEeHG7q7DVqYjnDtlEekQx/S6XQf2ASMnthjHBQ3Tn7bEoTjcNsE2fNrc6h1s/V+A1p35S44j2Zlc9A2Pb8tVWufDqCRSYmE2ri/8Khl9ayrpFsPjXn02E5VK6lq17nnjkYspZNw2ZMehKuA0U7aqJ+Yglnh5vO32QTt0qYoKhqRs8OEX+jJh4SA5EBYfyoorjP2+LnXXnttLW4NYlJu3boVrZR8nhdh6O5sUYTs5s3StEBpId5CqqczkJVUr3WlORc9jkHzTnVDKKua7dBjaOaHWFQZm7AmZew7qtK41l/8OVmgdY90V6vvXJTzaq+XlXWz8teQJy4PEAml1G8PtacC5XOuSqN3GYF+3gngnT86yrtllPZ8WdAxLF4Ru0dgz/HobqJ+gHATpOazBPQNE9hYZKl8QYXi4YP7YHq7Thv/FHUTmA3tMBJpmt1YLo+QAi1Zj/Jlbe/Rh/P27d19sJZ8Mig4z0j7WJA9bnt7hz333PNkVEc4BlXst3/nX5S7HR5kSL6bNfuUTr9ZsxvV7EWlzU6UV9zbzM0AVmUv07/RVIgvGq+h9koEIxagTRE+lP+xKFitMt8y12JP9PoY+smS6n2zULCww05l/R5rl+3CZG4dbWWadZXf6va4Aba1yj6IC3JYVrOw5tvp+29W5XSSIx2tj9H5aDcLc51TszD+qF19bOBZo1jY8jtsua6oj/boacwqh8m7XCjK/KCFOZVbH1ct6dBNMLsU6K11qvOzUt5PxQIgLNeB2u3t7+iIesCLVK5YkEt4UhyBEmbV5/O59s38DJSZisn1ouAjTfQqH879/evEcnLjRnb37tugBEnK2epXCF6EZeom2J4G03hs6IzX2p44m07NgSxTnXxn7fajetvQ0Bbsxzuq7jK0nBcui/W0Y2iL7LgIqDJBlE0atUDtaaLZU5tUqhXO8W66K+JlLiFP8+mUKL85ESx6DU3NupmRpl1TR5sA7B0T86c1pJj/BQqNOZf7P/uzP9ubbKl3lpHqvftj16Y8WV4f8VGwyPS5acQ7T2NKwz2ZaNscJp85vF8Z+LkN62gRjquU7pfPfJnWyz+8vCJKUxjJfnSojSStFr186YcpbbL8NKO8RtXo+UtdxZj7Gh7YXmmfs3CZSFg1Ym2JKGNpu6FykIKVGcf6cev8c4jKFK35lF51roLU9gMVLgn2daqN6ohwS6m17Ev0Wz48pM+dO3dKNz2grsDc5ddTdvweUPakK9lS3+wGL730UpSmy4PxKNhKaOcyspw5Ygl3Apwwzf8+YEfHR+VIeENK7t/x/RKOH17rmjYXedcAmgvOK2dyt3h+pvY5adJg4I7cgU/ty1nUSrBqDOsfbqljKNQr0w1U0u36Rdp17oUF60gtRKMZ56dyaH194uq/q4eVcckhJZ6KTX9UiYiRoyRzFJcXAmv3U8q14FVVG09l2oyt3Q/7hoq9nWRKdk+ptF8yrv0Hd+9SNmy0+8VCa1WXy/mMS7H/33/lKyuoatXWj062E3nx0XwejXm0GwZ4CDZ0JTUnfRqjuqV6GK5yeHRYerOsg7ZS/Yu5u6LLULFzK2DziFKLux7uNjGPx85uUHMDeh+WmxVve9rYtZX9q6rPZrD5RuC3Idt6t+Z53Wmb2xSpU5Vyv64ldbWam0NJXdcWNFEPlH4C18fUSVPBSMzCQHFEQk3BY8IL+DtaFeHu8e5up9mhs/UAD03/8Vsz2INuh0ExSTGtGgic8WjE9nevs9svvMi2tqY0Qffv32d33/kBHXCiITRsZYsyw5aoCee+zC26FS5GKdGl8Aj9G+aOcGNYfYWJ7W+oy1Fto5BSjo/iEWYR18eABVqBwuvKgbAK7HX/IBQs7FCW1JyrvcsdZ6YPvKCftmoaVXl/9yg3wnLseV9D3rPtqQjD2jkvodOrep1tWa1DU6cJFaa0igGdvo7p3xG5C1rHeiw6c3VnPsQe0HOjlS6FSTlYDUzrXooyFT2+tpVERZ2iLNfIbtoDV0JzNtn2zjZRPzoLKCeKGMhVysbTcH5yslx+//vfz9t60QrAcgoY8AwExy0yl6hUs2oiLo3quAMcH8+J552fJOWzvIsDOyfU2Q3/9xDaINf2Q9lyNUD5wAZakqKGPBpirUW1KQuuQjTq6+igTV9tdHl447Vfqnm/ooCuEqe/rm7Qvr1oW7MKG2T7SmrofDYBzdG05LxxFleVBRtkv4iTyyNSv9lOTByS7h0j/08MIkBZFstgyBFmyAab+BZL1OzP/bk/F7X1oXPZ7O6GW4EKDvCgQK1kYebklykZHZG/RTg6QoETTRpXYTW6GLg96ZY6WJfY1KhNJymqFTVp4KsH3W++JORP0TBFSGepjkc33Qcu+raa/TN2TGVlyT4E7KitZ2oskkmSQbsL8rUbs/E3NopBV/lS2f2qvOuIpzEq59CeR8HIEji9Y5PtOiWdB/p9ojiG8iH6hS4WRyJL8908PzkCSr2sK15aKV/xxhsCTAsTYFsnVj2L6kHtSKoNiigXIZ+LHi2Yyq4ckGCVIVVfstPGhoFoXfjVtzYX+isA1fmjBLQvoiwQAWWMJqCGJvNFVMmJbe9+3Wpv8XK5ohF+yMGdFSsrJg1q2EcR9TvqyvjmFtT/YCCtPfaAEvU6SxEN8G/93lvlAzN0TxNTYEH5FqyU6Ve+8pUeC60Dr7//nXFUZNtJkpH6SdtjUurEzZt7sNgmtPPM5ydA+eaOba8JtaCS6qtRCPSCWHthOPSqyuovcijo54jzFPpsN2Q76MRaPjWKHHZOGDJBz6AJFhFl5Qi+BgE1DFlbnDx2kAjRwSuREwIHuo8H97VbJWpH6UCgCE88CqMgU1MU4+q1tSLfZPLiWObRjkpVRNmSgcJhCAWm1sbESDs7OuMh8rmHpR9ne9ZoX4k7TLvUhIvv/aLxZdPqh/VBUEBmRB8MxpwSVZwSUhJF9GrsEN6GXWq9c/Xo2tJn1VO0/Ht5PbO4JNdWaakhyokpaevr1NC1L7rgh2qapF9cnxnJ4RNTwO2UWV9tZD8x2BY1/8QnAoLuAesZTbdGMhSzo6OjRqBtA/nQsL5cPprKwCTBdTo5mewbP05uWM4jIrebQsmVDkAE3n+7r4UnCy3TYKP1hdDsKXnVYJxiVGXWaoynsUdVFV8G+6k6L25uGjh/g6aFwfk/uwsO17NIkt48ZDQmGEKoFhbFmPwt/hFQfA6ZpDgpXfC7BeQAj0H5SEZ5KI/i2Xi8FUyjaDyZsEn9fIcG8n32s9dGYTiagZp1apUGWruHWhwdvYB8MlI8pIasZtvbbNl3SdVd5Zqs2DBG9AmoI3ua4NZNKUZEnNAH51AflzY1NifB2lgH/iRVqZcsXJ6vOjUMATfWJdSbQbu1dW/rVgrx+mW7mU71Ia9x5KcZxKMQsF5KSUHhRsD97EzjcSCnYJLzGmgg3+kplAvAjE8HrBkSLSVhONkxmJYB8RAJ6/HSi3IXfqF8o/vK+beCJyc78ZZvJShWKmKsryl+BH5KRY3wjLid03fueVU9v9gGpoyeOmpa38okcdH3cInv0b6e0gnBHF6apL2KGv3+zNnvJuLdjfVDs9vR0TFtpPhu0ewQcRGJrevTa9eueQGFDVSP49k4TdWYPB+lpBAR0uoB5cNzFwghgWRjAxjVW3ZKlGPpQJc2U4TrZuSqpk1l9LXtuQ4QmsrUi6/LDcrWCd0DTYm+q9pALoCbPtu/Su/9KNhLJ45ucw+VzaH73RnocLe7UIvSe1HldfT57FNWuSl02hHFMI391obyhelUl0BYEAHNso4I06oB200RU3om6HYWaX9PpHI2BWaSanHs+Tu3NZKS0mUUZEcnW8vjh0gmTxrDRXjllVe4lPlYiCBCTzKdVJWRinUPZL2YXGtA3lvMyabhOaYOgu6ZOL9WcFNoWWJrV1079K/FzSu1pilMmqF0VJlmwsjQZBBRrW9L1jppTFlV6Voio4oytdU0DNtcZGir6fKg6lMbzgkHgX17YwfUEFA3oXPT6ITryhkK99qxuYQQwRKbZClR5GqJv6dTYdzi0BSRTRIhMOegdtFhNbYTkC8KQNEiE3L1Lzseg5x38+Z1Ot8MKzs6PNIJdQb6clajrKalm4MQjfJ+LRfceuU5bvayYX1zsEZ71FOatGuRZm9QVsTDZpAaCi8Em7POtpzr1clGDjuoFBvmBCP9bxe2gHRkDBDNXnT7pcqyTOOO9Ougf9VQzkGQLO5lPVHau4YOKQVODz/SRMGQPiQS5PViWU+c4iNUulAkf2L8gjkbRWE0HRVboNAsWU8P+UajsxgULeMiLEJVdkfnstihfJyMqJ3F7H40qL20tjd92aKYmZBLqKQDNqu7IX8OeFzjufTKW0QkmRDlRIops8jnfrpBNr5UrXX148JT2VmB7PnFaiki++toQyp5jnVlXcn0KUZN0UX3RtsP0dk7Qa4Qo/bxLHhkLx1zxXy+BO5Qc5dkEyRTUxQWRRDvakdrghL50MSQZWyc52xM5y8YeQ8TM2Lei70yVUTK5mDPUKkT9jMAOhFwQ+WI2cfXQH1XvzqFizcu2dOflq99oKxqvAxTYKUyhigipVHUmbOIIor1iFh/B4O60kvxa8ih+sr13W9BmNomofr60UvaXGrfXqLENcQ7c0ZDaftrm06dmQTkOwVsJlBCxAWnDOb3nB/PaUw6BSEoXUIe5kUeFWeHW7ZciXw/8zM/E+Z5igmSYlZqf3RDE+jQbG9GlWFaQI3VqjE41uhnNYPrnMKaE9O3NOSgcsotrbrvN3+fB1n7+ntFAq3RvOFZ9/SZag2cEG0sqVnk9E8dYdahoc/FNGdn/ebS38LFSGwffRxaAqEtwr0BVMS6D2oTUt0egfODWk9fEUTC5YhNr0+Q0OGVEvnef/99QL54DBq2yFpabJ2CgmY1q4pp0xI6RIJ1DrNnVQ8C1+Fg+LJolue9Jc8BalgfeuHKFEvG/hSbdHc2dYbHompwKSAty0EIeNnQ9+Yu3hd5ztdd+TKvLakzInDr8+mjLVoDlHG7JGYWF7UYjYAuTlg9I87u7moEu2ZcSDYiLsckCUV57+ZNbd9DTMaz9pCsDoOrMRCfZ/0OeRdt9T7pJVkHwwStKdXspTChTzGxqFPDnjpIuLF8fPHN6/Lnsg+Bzw9COHYzpR3oid23tiTSPmsWVYsCdoOrIMUcNdaAb9KuQL2gd8nR3ufTyocPxfZopMZ5ACZ2FChTjWD4AtGfE2FBJgYwrg92KavUwpUPQam3HTALw4pJU2cbazvY5tjQSVd9vwhsMNrO5xmZHbr70ttTYbN9O9pmMmhJljiyVK9Kvm0Q9SUgLjpSv97LmH0ddsTOAcb2bH8K5pzrXpWhFBMwvykiIM7vonoI5cH50ZzcMVEUQE+Xk5NFuDxaxLNgiT5pSUn5JpMAc8yPwNRQhrzb1ArcnDBLGYoXc3bV9MAVSS7yOnnvnebdYZJBO7RrEy8HLptTpbAnkg+nJCva01mfPNQkSMkcddoHyXPw9m+NZSPI0E72vtr8IcU7wtOYlU4tgW6ZmGB6NAn4mVKk8bTIFyRJNgnDQqc6o02ME+uCuert6UHLpTnRVPqSVfdrE963jTehtbbATZ5ZhxeXsfguf8GUbOfa7qkubUiHTsUmho20ooaQURj5RbAPAhXXQb/N72LgncFq8rv0zYF2sLbO1S0KxQStAkdEsOxxYhOdrlKcBQFpPAn5fuu3fktEEZ5OGVC6Y0QubBiN6jOTlxMBo9YXJkdhoydroGNdrJU92qiRajhX89aQoc1QYYA6lK6t0WqKgXVfCZy3HW4cvSP6kKJmao7uxnQZ8bCts59z6DM3aOg3Ivkmg2aypmFIuM7g7p7Ua8Ee71cV8s38ZOfDo8XiyOsREipMeYGAXjBa7h7xIMi28CQjqvLevW+NomBbqDAIUokWfJ2fMxYxpcK2AigqW6omm/vC5e+WXXKEvxCkc3XdbnW+9i4RNmhiEzevdSVc6kc7rKncpksgudKoAdwAU27yeEaRKx8qf9LrbbUsbl2nKvth/VmH9d4bhVtro13efmsQeGnjMbVgai72bAql5iTSIWNk9zPFyQuMPF0YWQtMTGcI6BR97WtfM0dD8C2RqlDINAul3X+U1nS6J7ugw+iTcPAdDJeOK25l5xT3W9ZRo5vn6bfP6Q9turMqP3dviwKqBGH+1UmHpSejKe/pTeAJbHPngspZm7d20KKizutpr7WPJEmW9NEbmz7zXowEULyRODn51xGxnaenUZxlMpIFnjZrwilIPRoBn2qyNIHq6OTEKluGTpusenwuGP7gkEVXLRvV8u0yYC3TNaToxfsg6zYz1VaqutVexAeyU3HawSk5LO7icVTaxZp5a1RLg31wObKb6h3MJpPu81Eu51lSO6+0KIOnLSDLuUz1UX2U+wUzm812kE0VnG/HhHwT9hBY/VyAlUFrOqXGZuJTjbIFw4jStN++1znstWPeDDvrpc+nyBluvh+yNjsefYpADbiyCSCmoSJI+/7qj4+EfANniTawZzxsChcZlwlfrfW/jQqaCzb5rmiGQClKd6hMfZw0nlvbW4EMgpE8YZFJqboV5Tkv88rinAoKBtSHiiDVm5+ckOamPhn8nNzZZUKfs1nri3DzAgyueUNoPHq+RaS6KxzWrHQ/qrONSiZsb6f+3v1zLbRDMlJFkm0IESMPCS9kybjIZtbxHvqVLvgvdrh2mGY9NssynNU/HguKTds8o8hyorPD1s5OMBmNeCoyTfnSUMRFEZaRDMyoUKdxZb+YL5eNDncqYzeZ6A2Rt8to7trZSknkKli7ISr/zjvn69D5nzrHk/SYZGW+edevU6puauS8RyEsIk5NDGhcQ0JjxB7YPR0SNaykPxDry8oGg7tJaCR057HF1se5Zjnt9ZrCW59lr2P90NiO3OR4MgI9lhrpROEiAeO6OXHWHAEmTIJcrelUjZQRbXxv94jYBtCRR8OAM6UXBNWoe/hj7avm6rnNYSp16RSVg59qkZeUV+O5QafLmNEHEbKMzuDDrb/DEbDtWbaxAy4Fyw7lm4X2r4qt0ct5LF1o27j1NaWzJINREPKtkdF2TkZ5BppOaRheAOspT+0qjcHYgzZ72pXBVbVRqsnblUcNReB5WabL8JG6RBjSHcs18FZ/sosPpu647GagvkxYG8G+FoZTZ0osSBSr2WCSJub8Pr2QcBOhkL3QUD6lsnGRhyGyGtLYgFCTFU2rzEyYldpjNwZtpwOt78ydqN6AldbfbdCu+JEtrril8Wv9840Sm7B1vLmgz8sWl2zh1YFqNYoPlDvlEGTSVI+bBMPW8bvPt+Yi1O+84Lv7qtZ516leuPOAs7ngSUvLlNXzzICQZ9UlgmcyDekQJptewOT54MbymMBsmswZrMn4roEW6uHYcXWRtp2qY7Md0jLvb77ZPZedvAIHa7ucHab9EqqUV6rxKk+aWDOBFVJodm0TZ+ZKBjQWNG7oQ5kZ12nD/C0RdE2/3Fw1/lu0Spd172GTgeixCK6TR1s6hSknMOLdjgft5lHEwaSXE9sZhHk2qiLnOSUNJEHSxPARLqYp2xy6F+4m3NwlLdUmtHbvElt7EiznJSDg2o2JDYPzRBAoZ7+r2FGdOoru0yXZ5BLwkhjCHjsjaHjlOIqUFqg2hnUsiu6F6OBzZS1DtgL9ShyGXLzxxqv88cMizPNaNIOTVRlNDXiGNlZSNtAXQrKxnNTxgOi92w1dOD9okVat1dstf6/t0BBay9gmoxryhDc6ckdRnidGX00V9a/fMvRv8y5XNSiDJN6ztV4565tbMsIcBT637m2y7JVXd1WYuVhmA4XxluS8rWm635YyfvPBisYSs0d6WvshQhiCQT2MebhcPuRVJ/UEoU9n7IVJKPLQxlg+PItMqjVUcJM+D+bh1Tnuq7VaqnM37RvH2qE2tiuj4A2wGyT3NnsarmyKDMr5u25I55U3rUjTHZlQKRFouSrl9Mhopjl3DPrVR3PGqlc5osp/q/raSlw6mOZKTIJOpmkaCDz/9fT0p8M8BKpnt3RlBs+rtZmmii1O5qTxnJ8sCAn14SlLEigvv9vS++MNhG0yTY7gS/8MXTRq0KU2kD0PdL32y4Bh+8gw9F+LgE8A1JqrOuTHak5FIxJBw8W1M+fRmPK2Orhhy80QMtB4ivfff5+/8MI+y1aSMePXKVrW/iI1qbRFCupTTlnMBF/QgRFxXLkXCUfb093xIYykZOyqacWmupQh3a4/IHlPG0oLNZcwTF+caXbU0pRSWWE1AqJPY8E26htqw4VY98A6/nVIfEbFZlbeKJW86CKpSw1d+bI+uLao9/NFwdsG3O3DD1PK8zAYCxGKGzduMK1DckysZGAUXuMl0TBzow+YwPTaiIh4mMqCxRgTNgV2VcV09oB9gF+WRu7J8W01cLeh9WMZsnwstKyDXmg8SxeHK120tvAK4bKUw4wNttVVCGihCwFV416txZZ6BBvEBqzVAZhCRrEUjKJAAP8Zoo3FtdtRborYJ+Oyt8NoSBTwLxjiFwmbTlPKnoUntZLWFNcGseainxB4IGoF+caLlG9OqtyHN73lwfDwnmHq/PZn+x65GN94zpm7dDivsbxiR5k51gC9tLjn3jZ8lBefS6dn5TcRRZFATafOJp6QZlMXqJxK6drgQD6lI3gpgLdiSyM200Ea5h9MpKR4f6i+v4LNRJXz1ba8ncnccAce9hrERk/rLqxjPe3zjDHX7nSVK3+gKOTqfavvTx4lL3oOhHVjI58Rpbk8aeySFupnPFwEiGvkVVBtQ71lEuIKfWjKNlOG9axkBnlRhCfAgyMwjRo36QYxDiyieDB9yETM6+pZ29WBMt9VbdHmjdckA9YdKdvXEYOAjA1DQvrKNxu+YT3LHq5BsIbJawC0srxDYaPNsG+eOy+sBa2OiOmpKHJqIl2Hpo5tdbveOtZs4M3vwG54GwjUIYBFLJQKC8p8HM+AdZyzar8rm2vp0vmAfN3gkxIScpZgZic2ITb3ov54lyhuPIMPHJ7c27QxiEppq+ilZmtwdUGmLWFT0i8WB1kcS52zQrURO/10zPnlYJ8BRECW4u4OiAhyIscMT5S8J9aJaC7ZbWrzbvdLU0Prq5ZQt5avnaKYlzFgNyprrlO/QR0coPW8BPDcws4BrvmDX0lXeYtHizT+puc3WpjT3JnFIyF0JrNHJHqx9+HivnEa1eS37WROfoUvR/uTJmTOSBSwp0lMg54aFhV3Cm/B1+W+cvUN4dPaNIPrVRe85RpjAzhOVmPx1mDGRTWhV4tClwfDuJyLUr+aRye1uX6W3KgLyuo2VSxijoY/MepHDyM560RR4ddt8+CKyUTkWVbrby1gksTVK3DgdafG5gLVOL8gZQzZjYgqcm3GiHUu0e5c+gOW3+Bx+HW1KaGbxfvbrxQwpgYxpAfDKaDXVt2hwNNcO02LmiBS74PSfS1LWT+zBiEXpm5VrsHS5mftxp4dsPJI8dRuPcP00jrYsciq755pzPab1yygLglt1F9vXNvnbJ9BMAPRXWv3pTlOQZo0m/Rd6XWMBKxiKCpkw8YjjgmqR8UoYLl4661/oV588Y8WRNnQa0yIhsTOY73wLxsU61t/ePy0opctE1yCaNwHthQM/aSosQl82PC2+IAybEC5ywGzSNdwFBVLyQZqxYfb/BogOyyaDnPRmKSSgjVVOG0R74SA7kCE1aXaanmzUxegfpvoEeon9rYB9T3SLKoApRiG6ik8SU+khkDVnhcmlMxwk6nSeV1AyaLE88//NIxuWSqTybuc6dB491WIaNrRnYst1f6pLS365BQrZaoT+gqdGyNOrVdNrDNH1aKINVhBlht2HnYl7pzSXnagZXX3LPhWOW0A9WsO0VnN6zSh7jh6i8rua9xSKA2i3KLPL9dsCueV/y6mkLu4AsdXcJoju409OgL8iCjnkfV91v7PEeZCmkbUcQzLQzPcanVWqETm4Re/+EU08+Voy7POqVaTancufSKqi3xqfU+V82FsY39c1XlB6QBFzAwFLKlOTDqnQ1zoZJg08UI42uEiPp4XW6Kyry25UU86y6m+8rX+ly7NGw+raqmZPXo9yMEj6mr76kH1rKM2mQ91E/aIaMvQoHJFZ4TQOhUkGmdnqyLNC4WR7AXQARWGYaFDkHXVWvGiK8A8LrHLdspGNzyoaKZi9eWgWp7tfV3dq8jw14oUNXhm9gJPUEoWJRIiee9Getn6tdlMGwL2/mTnXxxqwNpVa7DLK9le9NKj4FUVhEBwdQjou4oNnIjLgLYheeKZCT6nGNgKVzAPUhTbuFi9XosiL1KgHvR4HgZZAQC1BRzIJVFBdKJWVQTubLZzNSpe4tIQQ0RnDKTLzvUxD+SlA5SQOG86my6Gaq3ne+Wxw9ewbm7T7VdMf3lLieaXDUFt5hGzgSaUuT2qsaGXAecd8dXB1fXINUhUzWmCgGwnrkWc2bgMNmClMR/+5lEgpTAXs5hPlRSJTh8Iig5i3xy2czqdlAGaVwbokhb7WKd/+VG1FgHrU2t/ExsF5N3Khzq8f2qOcsKDP5iptb4AqxrbELARN931btdoSVqVGgOgPvNaEzocAdvraCpK2p+qzUapqbQVGc5G8ZoCZk3dFxfFNoDNG2uynsr5t3ZHWoudGXvMqyzWxHKCvgGIGhI6GTCLfFkWcl6UC4/YOT/pC1I+8o6WQ0+l3Ry617JsIGDzR/NpSpckhSFUC/R1YxhsIdSUPGv04Yb6KQrMjwUbvlsOeJEOxd6sFkP9GFtrEzy387hbCTNzXKOClVKGsb5MbwjcofhubhR+SVM5BMr0fOLijam1kbmqIkTWlEI3krJYRNEEgj7EIANOoUgkVwkD855GPrBjoMI0b7SRKmJBcQJRcIy9qq8IrmAntJwtKU5RCYUO5DAS2pBExZ7GRHmF/5z9YoFfcWc3hAH4/YGC1lAOmKdLnMrzn0irQQ30L5PlX1VSOzdSnzhGModZtlOy+RI4skDmgIUa+fKcJ5znOYlCQpNPVIsmJusSVjKb2XP6uGHArh7OtbNvUFxvXKCogXGioLxAgXnBzFnmcYsNrr/yy8WBhpQ2rHgf8PM9NrR53titntIdoQf6EQ/vyeYlpjlFkgKSSgmEoXrRZFr6cqKpDBWCKknyII5ToQuNknwB2Gj8z6iyFD862Sf6ox0cHBDvainupQVMsp5X5L1MyxIy/4mBO+Y6xMD0bsb/hKmFooRR2qsmIuMpNwGba+thXcxZP+vJWMcwBvleDkShC0fND9heNtyBGja/1uc7mPOSwhjNQMc6aNoHh5JZY4iRPsqR1jJhlS804aQui55FVuQjM0M8Ldn5NJVg41sVCZDAcT5K6OrR0Srb3eJqNMLoBhaQMRAUFnNzsB9CbNLHc7p2Wful6TksCk/B1zY3HS91HfJKLpkYvFNYBzA9qwm6ES1MZ4x8aCki90TNtYIZuzA16FkvjZq580tt0G6PS9ogvczAZlyop51QZj24Q/A7wBrWHx2N0D5OIeqKILe+/sFY80llNnOfdqmgMooWsD9Lkmtor9Qn+1aNogITlS0BKFuKySShjNXXrl3LwOgn8YarFkUSKR3r68HePrs6cIdYke7Bj1r7ZG9B+yKq+mVvcZtxC9jvdEEGUkoiRZ+kckCvLdohfegaRu9z/QWcmp1VZpkZpA4DiJY382Zc0vls9m76y3Xne6nS7bEGorWVd+Ut5b1f5vh+WnmsqkO2fOr9WD9WZRonM0NabQJT9HqJrE+pDlhAdAIrgzw5OUkJ+UajURqCrS/mEXmnkpFcJnS6SkrJcnWn9g5uOuPdEEEGgeys0juHfd06VPVazcuRa8rW5l+1FE3QPQ2QMFmklMkNkRFZVGLRrziF+4UX/QavrKvYWk8YtfbCQNCdrVIOVkjVFnXTtSKkd2uzvsjGc5I1kNg4UqdSU8LUOFWjiEZKSmEPl9V1jMcil8FI3rp1S1O+b37zm8lqtcgymRVUQgga3HK5oBSBthMvfvJFzXaxtmHIlm/ng4F7Tfm9vj+pwZUZ6ueVke2bYKMyzd9raphqaghzhV42eIhoSufay+Zj7Rfc1vvnT+f76CxYyiDuBeXeUJshYMuGosUb5X9amvErYi31rNtFLweafImPQD41rD3buQ4qrgAdUmhTdigunr++t79XHS5rwt+DIMi3tqbLX/zFX5SEfK+++ircCxOjTzAiivZDq44GY6R0ocNTOo0355tJK2M1qBDrnpS+2oZcOj+o1o0HF5Lrc5pgHptFSgcjkhp6wz6sRcKeCtev+5b57m2qBQFZd/9U65V21u6JHX4i2/rUNgm6j5ZNZG2PactweYE4K6TGSVUeTQykIyHzgWY79Sm1Ui0WcgVFitCULUYjvsQ8SuTjaU0KgNGLxUlZIapOZ1ihqGmnGp3fHLy9RLlXWRWDtW6xyFqFnS3VkJqv61nzWtdro3sGCRfmbDY0rBIlVPUOrseAPomkl/92tnPF2lobhnnVq+juhe6oaj7nNljnLrxfzqGb63edHpDnuFN1zq4JXyZUXrHGKPECWhkM+2kRcDab0pELupQ0bCeOsVBCpIh8zCIf4FtxBjiYVgdZwQ6utILBnsU+m83YDpDSoQotRw9SdZaxDtFI9f5suy7bbnRxem1L10HqQe+7i5/t7JN+KYs01YoaYEvn80VJDStkHIaItv7GuDdcrB4CtmNme3lvUda/MdZDZ1nLym0FQsSBY9qUK7JHl8me9ec6bquuJWkDZongJbQVY5WLRJU61J39fVIoceMPqdPEJywMczmdckIoR9e6vZyOQPQrVrngMejGFlQxyTGwcKbTHbY326cPhkiQStW01AxClGxdlq91MZ9l8TUF3Jb6nrHlqF0sWde0eQ+b0jhp9RBBr5z7o+pJY/TS0krzssxRF5QXB+wXkTkvWduD7Cvu3+L8Nuxirew16+avaqVWsuPBvl7ZtVx3Q3OfsQjIretZLcK8WWcfAuo6LuLF0rZEK7CpBVs2WOyWsooX86GfwFamc907MC/s7R2QwqVyuUtYnub5cp5l7z1akaNYSfm+853vpBmoNnkYSnwY/8MOkDJhvjRj5uzg5gET07jxEpSqb6AVm9KlbLLhPqqkVqo5Qd4+vW47VLW/LbfKumssLWNNxcu6ZlgbVaielm0XZBXmtFBaPkRqiJtculyQIbZKY9e/tbeyofVf5RyuoUpumZ5mS262JVaLhreWYtXbOA+PqdhFwfa1pITOPNk0tW4kvrJynefPWc0b+W0u9D087BO5RHvSF1UPVBEUmhLI28o+HTr9yeNoawkGwCqjC2H2wtj7tFfnnZs3qeLmHqhYr9rIKbZ2UnoeUqVM2N6Wu+DUOjaqLc1BHQEN1VJtbLHyamPtCoWuHjTrW5jg4BRZ0yWaL9YjoVxb9zAWrvH8BdZ3I31EDa/VpSFgdyfb373qfE6W/7hl7VdZXpH1uiUrD6y1j6O8N51OGy1nYEsPWXKGCk68ViLfl7/8ZZVn2SIPg0R33gSqwmI4OjokfhXh5p3bUPFMK11aUla0j1zWluW6N9uOgtXT0v3Rr3lT9V6Uj3W3ft6F5y2mLrnIf6CxHJAa0ryjhxHIiMcnZPJR1p+prb9sANTZKK8XF4CuaGWPagxp8zwI2A8ba8rrsoKtp6WodaZOSHbXm6atYh9NDDaAVlmzBtaXpUoEWJBMeiXygf2hUHG8KAq+DIuw0NpObVB++PCorBxlv9vP3zT2Pt47cFXrbvlvSTEcsu3qHtxReyxpB7/nNaSa7JZyn6lNqlT1CpvQxTeXzdf6VX7WIKBhQ+1HtdVtWdPjOTueHwEiHhE30ja70v2ygQ1tQ4+w2sOiIbyL8p8KyhQlyrvCLoL6lj1sprGoFlPlhVRvR7XWV94tVZ92ASqjODGv1rybNLEBtOZBCkLYKZ/RzhcYQrTKk2SVjMenpe3OZTuBwh1leQ4leaF4pP0tcYKSBJUuy7JDdz7xSfJbay78lvGpnntrLnuEZMA7kuvqYe1UzV0QzXKy/FOxTE22qtMNqYaA62h670AVI1sRUsWlMeZb53e3Db8+Fy6EZucHqSrDPGOtbmOmIBsG1meOlSaKygvGvk9/toeieF1mdbfm0p+zNBsoMqwvFlXGB0wZcQCiGR0+REmTMEJIsdPTVXF2NE/fe2+8tHV7yPcTP/ETaZSr5ViMM3KkjjVfiWQVWU+r1URj+97+ddDWTdcMZY1nXH0NO6yRSwjLCVDVjkQKadVR0RqQ5r/qghqAgLJ8MxYJ66NTPS22saKypZhyZMxORDesaWJsiISIyzmzaT86EVxuwnaqYdPaoXhhDrK510t7nn1cVazZcFi3q/dvYB0/nD5ZhJblb0sAyq+ktdYmIzxgKDWc4cHBHulEUHONoloKGtDDw0OQ9M7SYkSR6OWxzh7yff7zn5dsLJZge09jOlCCSB+dv0cVJFrum+3P2M2bz9NfZD/j+jG93sBUY1/2lmIvAsnWyao8DzolPf2vwy62eStI5qbwUYP0RZ3qPGXqYG1ynHuhZaE2O8b8R5sIaHEjsTKicfpOFydaWaN0FjfpIKNGim4ErH8GI2DfEGS7jvqc1bbUctGaahuofUctG4odiTLeLHrfSYn1xDtIqm4i1cPQu0T7Rh8dHoHIcMhWq+UqP+MLULaUQesNS0eajhacU3TfLkY4oAoVNZ14Jjum50OKiDztzdu32YN336VO4CKemurQMJ8klWXfrmgKv+XDcoa4CCBscqXaI1iEm7LlQaCe3U9f6MwOz1gVdcOqSHc7uTZvv1RVuSrkSTpGJlWryG/AuVtrrKqxdUbcd28SyzYSytbHoUzOG5AJhaxcoCiPSGR+48Bs4tpBdjJ8f9xrx23aAm+ZaLmmXj/Mx/52XsRgQErFe+x+FmkcI6gD9RTydh69wkbYw4BYlOEoO579a5xQ0ER3sHez3BS1h9MS1CwgzMn09NqdyYnbbljrJYYXJUWRL8MwkJQGzaxw6yplQ4yQ9ZzuzOi7sEI31/FuyO/GJsW7PrD+4rKGWnulbZeuU8BLhIvUuelmXSqdhtenqZ40m2FC0SmK2CCtNdUuXWwgXA6dGj5pbYyzbPl0w8aaTodTa8u0bY/Q03UbqgeECZVh1qUM7XrTnVjnG0L5nGJfJcsLsBmN8sWjR34WlgbynZ6eSiHCRRjmCTdGQp3mGpBvPqcGEW6Svc9PJ0imeQqliPXHJBGdmrQMOgmS/QyZCAuy5/3Lnudq19SaW06YlGt8t9xNgxGRnfi+HkoW1JcDO8Hw6C0WR6+P7tdysTDtJE+hT4l2F9Qa09TIYO3c9MZj69rllHVULgdStqdUxyBYVXYo0q7fTNoLWAVQGZupXG2p/ls+jmy+UbRI0KYspE40JkyGP3KmjrhGVopqT1keUHz68h/9o3/kjbaBfJjBGtjMRZ4z7X9mqB96uhyC0mVhsHlnZ0r2jGg26xifznIdx1MyOs6g/A4i4lRTRcHLKE/maq9cOc2rrvzRsgKU/71VxrDaSlXvrvSrkS0VOqu6XX5pl8lKRGbNZeWXq3bz9QhoW1Tt9a5BEJIRcdGgxnR5QgoBREQtXqgGMnryXw9UQ5at99oHUtstGOswHXTBediPDgSkf6SzuVWUkE4lUhb3JDk/4N9ForkJvI6r9+DgeeL0LMKiCWIlsyLL8uXWVrx48803vcbbSFAhxO7ZYnE8D0N2jXP0PNTqbJT78IPaHHQavXn7Dnv+/gP2LrpFSXcZ1NlMcwYEZu+1Q1LWPiJLMt43XX6KiVLiY1quclILGhnFzztbK6+YlwbCTTVhS+o+MiOnOneovCOtSfOccJNKOTIg/sOda23gTRsiYNVz0TYZ5c26ZMLrIqc/oLKs9rHUpkBZyqBWu81NWkVp0heSx6lOMtkcY8tQeM/LtIhFoqfd6AR33X5ZRXHq4Ld5sXMb6qDz99joA9u+1JoWfR1dyMy6pU+qk0vj1OBBQi+++AlTlwnHg/J5lsswzE4nk7SRczNs6QX5eRaFOguNt4swhGkO1O/o5Jj8EBFQrUqJlToDbLt3Szr3jA6W2DHuOPokJBN1XykXVMeEKX9HbntZsvVCS3nll3ZNHq1kRbFWG3bnaGtUkPWW8/tSl26anIBfQVt325kF1SiHThUov1Aw8HJesaasooZDZKkBRVhb6o1Bz10ZmJhM5YplyupZmHa11E4nyHImlFYEg2gZ7QI7e/uEC7qopHuInBzEtzAsFt/5zklWb7EV+UAdmobh0TzL0rMQ08jb/PNKaz3xJFk09k6n+2wPGtxxWM/aOq6u9ULMJgYRkWdG+bD32DiHaxn+whrYxnzXs+rf9tJdVUq3ggHM2RrwEHAAW9WCgJcBWAsqaVz50DFRDYMW75fu1lorYHWx5GrB2XAd1rtk8623DG5HDqKSYf35mxpFKNQopbWFPtFZoU6Pj4tT68/pQufMTCY/tjg7u/cwD/i1CFhPsomByQHtfdPZXTYxzqOI7djw4cPDyuO7PiBgcZpZ62SjeR1ZA0aLyH++PC3XqZ87bKBOGGlV1X5MjduKMkJb6ym7hp1kzLCg/oNO/03FbWMxf1TJBFb/VqygS3O8El5f/PAm+2+HaWITs4TTtNeTklWX3thRPa8XnFGn4194UajZEyIqK+NtEVqq+Y7d9ssxlKKEc6PR6X7kq7u0bYqq1TkKul2jWyEKbSn+ItFEJ6Ug84QyFeBSQjHs9s3b1F1EOBu7CWXVKs1OOX+EXi1Fvc2wqzNHR0cyPw3PxiJeoCkB7XtS6R1gMT80zr6KGr5+/TabTtZ4u6hz3KYNT8sgkTkiGvNocsGbi6unNjmgjH9JNst09L+bQWTdXVP+j+Es13DtqNqQAtrystFUC3tofBZxoSF7JY3Gr64s0eOS7bRLtTQjWTU/GxLwATPf/7yjs7ByHtaalK5rC816Mn3GXpKmWtECa3EfnU1AbKLA6UVKtj1STLLsbFyouRC3WhO9dyLfL/zCL0h5dnYGVooTysbkpBQ8PpqzE5D9UAuE2sznn38eKOBN1g0Vm7dW5lEtM487MgctaYSfKR1EiHKmjZfyXq27sJ2quhCwzd+2RL06+9xB2D1w8MOilupC9PLTgoS9i3CNdqqswv2vVlXPWIYsZHqXJrFymtqws9TITU0ktFC+qQY7qu+olmsNRQvroGze2IeDS/XK/rt2JKPqtIiobXuJVrTAWtzf26c0gdKypMCOYnJcpbLHmVCniEtt7XYiH0Y5fOIPTVdS5o9EzDM8C52RBkyHURxTqMuSJmEG5oMyuVLn0KvX3zUxqv6lpSC2Rwb8eGIQcmo+rkG/X0ZQUtVcz9o6YmW59Rgne375z/QsCVX+0yylWAsyVuxou2KptYH2elugOaZ+lLRpEshkkSxNavRUn5GoVHPjbbhvmfQRbrdU7w60ps8DnjFVV/lVWPnutcnP9h2ULKm2/6HCBdOCJEZlvgNUbwYmN+z7wqSURORELSeX+eObc75EXGprPuzr25/6U18CmTs8ArPCEg0OFKNktrX5/CGQ1iM6z2EKrCcqXugYsbL/asAW2nypqnemXLxQRPIj/KCWlLxqjGeNtSNaHOza0XsQ0OJcNRZDnZRreK0K+cP1pHXmlu6gQ42SHVY8v7IWple2XSg/PiVs1qc8JKcxec/L8uPVpKrdEhcqJouyERcaGWFBSo2IqYuILUOT9TjA2o7cs6WytaBYRZWVM9OOrFe2Kc1mYHQNqXn31s6NVG+COg+kevBXOfmOcIx5oE7HweTxn/rSlzq1VL3IZzB2AdTvELNZYxQDnn+OXTw5wSBbjC/TZoc7d26zT774qcpGxhrrYzB4+7+HOHa6/LJ2QrXChpvTYeADCgFMWopIKUSdGprl3YeATquNPrprzumMbwqQnUSjORLWuX56WdcGhq2hUw1ErFVXR3rVjseNbtgJUbV+u8iojHq+RETr+VKjgrJj01kL/jMuomlk87dATe00Ukkbjq5s4JAq2VHKySm1ZwsZ1tG/E6keKB2vg7iF+gdSwJis5nj4pRCj99jOSSfVQ+hFPoR79+5BX7LDAuwVzGqOpeZrj48fAhKSVge0ozN2B4yM07rHy2VA27pbg9TS+Jqa3ESUpCimgwpRQ9fNljblOgftHUTt7VzjeTl8E1L+18ZG01O+o+VOpLEXrfdPRQ1YO2VUg7rdvYkYFq5kT1FRY9nS1EdCTWBVb33eIHp61fV4GTZkZXSDf7KMO9TuYdRH6B9RNfRoUdq8gL7NMYhc2n1PadseVBLmeRIE4+M2254La5EPQyBms3wObO4xXQA5Sx8KkQDinZDsh9EO6FGOJPj2nRcdWboNa/onxC/ml6qm2NTRlivEBTyF1vlMwYIfw1+cOH1iKCtPH2pFRuW2bJCwhoA+tWAepWD13rfcaGUEOxd6RS87kaP0TezsRZv+kpWR9C6lUL7KRrnY6WYfaotzVC4mK+Yr0iokTEq2VBn50KGGhgpVS8EZdYPFMuNzXORYrVdtvLmOfzTtsmqr1RsFaC6pj4qQELk9u35RxCIHE1hA0mwgOJ4sK4osUyegDznF1CysBwbFbty9y7KtLfVeUUQ3wjAKBU8DHB3ywfP5MSCf5ntR4fLJT36Svf3222wp5+XQm3YsfbWyncmerpgaWiuy9xlzLH/msmxq1CzCmfK6mN7uJGNsnZeMsP2U5QW9SD0bIGM2BKd5uKxV4gi3Umckfge46pBweH0D4z22Qln7bXvSnG9zPlPTPsnrfeTOM1WNdYe+xg7iIRCnUJ4yfMcYrJWKS806iQqoVYyFaZXbR2vttC2N5oLxRQJElipo1mo6K8RLSHFCecOUNi9o84p2okYN5x5we2ieTCiIWfdf8CLNA/H+ve+9u+pjORHWUj4EVJXeufPDB0Kkp2GYF0g1aCDQswWwnceHOsESTto+8MAo//VSP+dW39ZQIUNVqr5z97Kf63hTrhU1uGnoSAxBHy/uoo14935zfqmqzz44o+gmUkx1zU5tt3foTf1y+9+y4ZZusZYh97yksutrproJqoMxSkwEeEIUcWEM2lIaDWRnZzbh65VBFmddaXbOMTsgJTYzKxdapkPEY9qojoEC6O+6UPo8PuvcIVl4kmXhIVC9Yl1PBiEfYvDnP//qCiulLQPtbiZyEX3c5stjYj210V1Tv+lkViFgn7q+hbVrFLM7ZtdalFVFTa2ldOx29Z3Y/Y07MRjwwZY4nYENcarTaJRBUDUXCg/tDIulVMf41BAmsMnG6ccbKOU3oZoXvMuq4xnLonYs2oaKp61S55pGwA1kW1YjhC2drI7VSo3xelHFJhpEqcpWTOOaFonK6nrdUCc7c9Ick6AzUZN4NQfkA8Ui2vEoIS6YF5DTI/aW/Dt1dEMOLCfs5/eh3rVUD2EQ8llYrfL7RZYvUfNZdhcGcHJ0wg7vH1IeC6R+N28/D7Lfbf9huXZKhkHHqnKJXC/7KDsrdH5y0uqSQR/js2KTIqOekatNhlPM0YQqv95eJKxf6pClukhxAzk2mdXulzOolnUU9ZIAFzsmpl0sdEhUYty91JBOOgsAj9BLkvbNkpDSKmHQvmdOobLrC43q6INMca4mR8t8fsLOTlcF4+mS863DLqN6HTjbAP6D/yBOTxcvTQH1poDYAg+SzqGzRQ4dD/AkzjF0bJuFoWB8JNgP3/4hA/GTqRwd20K4Xq/RXCj0kS2he80vYb5U5XMqX3jlixxaCfU13B7K9oqcPjlcCOCZAh4Oc/2oLufXk9M10xv4K2A89IlHbASfAAcbKKpf5bZ623ZVV0HjKkw/zXXzNTdjwG7YT+tOmOd2sHboOILyv/ocuD+Llv8a5cuvOb4hv0O57iiOoXzS9D80DyrbpDse6DN+Qqff7VDoevxpI6QI7dwVdu3oAjn8ymG9BcgWZgoUHBlpGXGuNbGBdkNlpi6AT6E/2ABuijJjGSBsYVUryuxxhHSwVpMVEBl9TonK6BhnUCo+JqqH9uObB9fYrTu3yMOKohtWCVthKpU8VeNw9MNX/uxfuDuE6nlTPwS++MXXwX4xfS8MgyWeZiR0tDwNg4JtDx+WyXUPSPb7BLFyQ2DYLtC2o2+6yzvgqJjrdUjVJRMBVYzj0rNGG/i1IqdU2bt9Ui5h8ng+Vv/ZzQR2s3N+e8q92FOedbVS/l3PwLU4AqiWGntZUUeB4movB4DLmOPHplTUDs/tbCjpNUmrW0M8OxoTIqRxUVFWMkqdYkjkbLbH9m9i9EKs2d4kNVyOYqORSG5Ey7eHIh7CRsgHUIA8dyRU8R6TQNKYOcpe6TQTSH7v379LfDR6w/yhP/T7iDfmJhCzGfWgWr75r758tar9ufOBo9w3zXUhoKyr7a0B2AiDsYnWR79TUt60ube14Jt/w//pnpRVzURdJqzu+jjc2lBt9F0//OXazar3gPKfl2Xfe4p7OKzaq1NrGnPYxgRscslCs4vapmg/+hBLXY452k0tsyWpNHbHhMwHxNoudTQHUj08p8SmTklteUpGhefthQ8+98pfOWMbwKbIh+kFVT7K3pMsn4Pop8pYEhJe8VCVI3OgpgTFxT57kZQv2ufT1Xw3oG3X7LvdQSlcOcyXv/TNeq0uEtpdrK0n5SJifqNlDSJmOtep9jO1H+1xwxp2KeV9OqiIQxE7O9VCWVqR0EPGmm2xvNec0QoB9a7gPcea8+Ahk9dVqZNvybae1kevfDw0NjjPXcWMzZevq6dT652SaGqIh9EcHenkz+h/6ZsVdDmyNarK1IBlXQ3n/kzLeoR4iVbIiFGQjybxfD5PHmxC9RAG2flqUPzIjzw+/e53bxwB7z0F1nOid2odOo+DxJi/mzfvULzXiy9+kh0+eADaooR2iWYyPTvDAxjPgUVxUjpDjhABjeak07KomB+fVu/ymlbdeEH8Ti8Jf0jmHC/VX1edcvppMVrALmrh18KYGmC3M30tDZZ+Zd6vFkQva6830fK+KElGWaFoqakOxrKISAbvjaue0pL543cmGeXC1GT39txuCXml4crwR0KISTlukOVk+pRZFKM4/NWIl5Z1F+EoiQr56N69eydsQ9iY8iGA2QHaXr4/GrHTPMeTbO0gFFE963SNF/dgt0AEnE66Uk30wTB+p0tZfn5Q6y8NZcW4MWEwndkN5UVhqGEdwc/fY8naGFWnatZgb7vAo1odVJA1iFtnNR4Fq9ezATurzAN97cryH+eaMQcwk4cIw+AQgUg+RBPCQnto6YTDxpRBf5elhQxdJu35C9YVDgGooAK792K6NznE7A9sQzgP5UMo9vdfPDo9/OF7YixiKUcz0G8FtnNAgoHaPTTyUMxe/MSLlG7+7bffgd0kWVt5F6FpXHcuSKasBKpvSaQ6VQGPmhnvl2qjNFTL2eKVecBtT5d3ttcGtemhudyhPxzkYMNCKbNiZGOVqsbgKSx1EAWUTiHh1OZQwZZJdlvkLgLyqp4WAls9q4yfUVu9yqO/rVHzfq1mLlXVoSFJdeluKR1ULKSeQGs3ZFoGTLRSBSPTE3McmzJpAe06xWx7aDrTzjZpSSXzAm16+Wkch/fi+MbGVM+di43h9ddfL/7df+//Df0MRsDrTnkBqznUqnmlUH0MnQ91GNIIyHUQjthqsWJnZ6dkGwwbdgdQZxeo1q4bHMJaKaPutuYBT2vuq9F1VdU1r0m0D4Sho+IvSvV5WUVR+P0szRe1vof+D++nZ/Nwi4U0P6HAzwhMGWgGCUm772YcUKw2F6T9x5cfWksAa9Xol+aCblNFWDhqfteOYIwSoTNubU+p6gnLxgtrmymL1iw3zG+5MlmU5pZcf5qmiZqJIzRrBMaPH21SEOV06oe1WQE/FeLhRBZsBWYJ+F9vrAq/W8RLDEVcAVVDmTADfWJBNR/cOGC3nj+AZzU7moH5AesecZ6GongfiN/dP/kn/70VOwecG/kQ/q1/66fya9d2AinDSRgUE5bLIAOliwgAAdkIJihlW1s7MDEBm4DSZYWeA4B8mVwCAhYtCMjKl+hY3Vir7c/+0zBZOXa23EeWJr7rAiWu2QXn1ll7SP+s9ckz1FUWtWrxFv6nVic37SBbGgIvH4BNMRT4vLLrqexh9cPBGouIYZfNMK+Q0LnZsAEWoWdYLdrqabwfe8tBzFr3fDte7S05jeRko2tuysxDwOqO/l1HPg0W8fAvISwa19MCkEfLdZRTE2x4WmMJyFqgQihjBXzPCo3S6GBx69YdQMSckDbHZwvCYxbw8GQ6Hd/903/6Lz5i54SQXQCAz5WHh4s5dOwoDwLpCtA66mEBBsojw/IJ8vnEA1bQS8CUalbaqonoEQ42EJTWe0K0afL833Jwe2pw1zz5iNmYRJAT4xmLhY6hpLNIzaezBke1u4E41d4ZR1JULfebEmZ1saaTrD72H8tys5p2VPV3qhEt0VXaQbzSRJNYRYtOBCbpsFFp2MxUlzcpJCh7acx1ftqYl2wqAYanRVEqRPgoSTgqNjbScLpwIcqH8E//6T+VP/+n/7SEjW+c5/nWSMQByjcqmQNqj2h3GY0wlfYYWFDtIZKuMtB+nrICd5I26kesRd0jxmUQayyl+VOVcBg1utjBelIV2vPF50gdT5mwScs0p4W7dB8F1P2r+beU4+tkR+uAfSPWNNafQBB7io/m2v2jCUWTGpqe60+H50nY8JRxuIjyExIVcSlU5RRjRttNgpscbujPkXCoaxu4bDPNjUf5kNXMgHWET6ERDxEnS8H0AJQrI8P4ChQtp2yxAu1npg85QRaWKCQ0LbFaWL/buzN28NwB9UgjnqDrUSSkEOL+apXf+wt/4S/M2QXgQpTPQMH290+zpXwAC+OUrpChUxsvkU/WYUf2/LIDcrye2aDbdgUdW0vS1MByQ+pTst1eaB+rUQMLmgq2dN4bk/J64FMRxZrGyH4gqogZ3NCmKGKTdr+HeDiUyuugF4/HDMVqs//V6Vc/TW2a/dvBf31D32EP4BSSr6XylLWWUJLyBbOtLXR6d7LppVYeVBTRJA3VQ4+lvT19xp49jptzbRmJogBP8XowmUwwvvXcVA/hwpQPAZUvP/lH/ki6vQNscZJeDwQPU+BFA/TvA9kFXX9wIBifNRqNSAFTqIDNT+dsBVtSRcl80H6R9oav4fLlhaJUBvj7dFjpCmhD1RS1lfAgBTQf16/T6w8141NJSwXzMNcyi+scWTmXVh9ZNOrwG+j/hObZkKgfrghQ1owEGwGXUcpMRYPWMtaggi7U+1tTufhkW7deTmqrhFm14ylmQtYgruUX3WdV6NFZJYz7CT2/U/gdYC8DGG4Oz2XGDQyf1xELqxQVJFrOw2PuFsCFaSULXEflCuywJA9KPWXUZ87p4NftnZmuFwhIyEPKlAdrN4Hl++7e3gv3v/CFL/RGqQ+B85oa2iDNH6pHbCt4L8+z52F/DrT/G+wcsJMcHx8S8lkkPLh5HajhbfbWW+/AZCQNAylBl82h51Z9X+4bYMOYPgg6zAnKaZ+3GKTFgDoGtd4EbkwQsT2YVOloE2m+uyVttzZ+8aVAOvB6ZyU9L7SsR/rXzHW/30JbjCik2wFp6JwTKEtO04mOUNAHWTquhUxPEdXNMSlSTBnJNNWTRv5Gz6VxDjr7Q9gBHn7uc//7xja9NrgUyofw5ptvFj/3yiu5KhJ863sF5p3mehcOQNuJow1QloLZQxkQU/9hOgfkzecnx0zlqqnp4qxSNbf4//sKror6WRA1aSv01HCGRraIXlYG1LJfm9BiZcEOvr1o0Yrarpd9bo0xWA8tZNuOiGt6aChiSDGXAihiIPR4yiNRlW8hkLanNVmtprN1GqvPiw3tCFtFYO/N1aigwxMYDsjhTtx7ZtjKfJjhNIJaaAh6EGWU7Ihp2S9LKfIB3c1WmOgWqCCsUSZB5kOxEOu0SB2BRv769T22s7tLkRAFaD/5KCYPl3gcn05n07dPTvKjP/AHfunc+iwXAna5EPzqr/5qVBSPXwyC+JPAH8d4nB+eV2b9Hum4sNke/cUdB9Nq/+63f5fdffcdY8t19gPrs2Q2TH+n0HugT7n8QsKvSH8TLdfqW5DjfsZ7rdq8pV/VrbZEDW1fa4kbhkML2e6qw0pClQbQ0dzyli7hr74+1tr2EksMHIhoaZi31N0GvMMLw554pQ8F1Q7TCBT1gOcTmtR+LPEdBqJZBKqLA7Y329cGdSP0T+kk5r1ksr33r+Dn/c997nPJpj6cnWNglwxf//rX8//tf3sjQy8q4NN3gF8OQqJ+mo9XSUE7HqrSUYAFlS0bx1vs8OgRUT8PrDAYtnW0olwVIfCpX00/qp+qyS62joYB3ov/M5+GrFYYzaz+1A3yTRt0CyUstbHNqLsWya02P0WDEtafU8ynihypIlBDlMUxRjEQAWbbauEr6nZBt4+hE7tYydblcx2yYB1K7WjduN8n94ZhY+hEvZDFhC9I9TKKywOKh6YEMIoXIPetgBRmqc65GaIG1KCPNSvsznbZ9nQL9t0R3eMk540A+cb5eFS8K4vRu7/5m7+ZfP7zn78UxGNrZ+ccYHaF0+Pj7G6ayjlonzRKmdMmUCjGE2519IPelWagWXrxzotE9i8F+hWbwwo2C7NhiYDbQboquLWVnEP716ItVa3fkd5oml76naLWlD6idq659P6s7QKraTFV7XuLArT0x3SmRfU90qYdNi5jlEUMQ4goLk9TPns0tqQTlR0tLjMEl2t7ng5902c9YkcE40beEydJMf3hN7/5zSVm8mOXCJdO+RBQ/rtx40Zy8+YBvMxii6ELWsgD3GVBRYWcOvHjxPMXIxggkMjtXZL/0mVGu1epxTW7XXOX8K9URMfX0FW7uUPp8iYF7PYCq9O6ojNCW1O/blqVe220UMHQb6lBbcwd1dXCGk8aXVtuJcPqPxTE0asG3k2IVDHQ1wqU1UPWar/0XdOaMqimurnWipoKlGm7Ts49uTAPfc1mWJ8Nt9mi1FbmFFOaaMqH7mKrhOzJiaF+Sq1MAKx+FqseAXKNQfzZBxkPHd5DM4ccxhKPo2K6vX0Wiul3f/Znf/b9y6R4Fq4E+RC+853vFP/Ov/PvJmB4j4Ii3wpGIW2qRWCYEzA1KBJo9dHTYHtn0WhMAvFytSJjadlD1cbyhf4gwvJbBc5LDmvPDEXANhc4YpY6bMF63Xe4zrE6AtY1Pay50CVzFDTGuMxaVSFdnWkgZFE3iTDHfMEs4hmOH+c9CMns4/anqG8KLQho/xbO77DFrFHrNNNbhKm5VWtTzY1OZYKInpHfJUYsFIlJ7aC0o3RRJJqCropSuYRrcbw9gU1/m8VbMbWJJgX0txWjqJhNp6tQjO6/9NKn3nnuuecuwRDZhCtDPoRvfOMb8s/8mc+kodiZADs6KUA1hVSjCBTZZSj/SaG1nyiHCDCijAELM5hNBRqqvNA2wE4NW0Pr2SIlmZ912Y9+5U1EqCNg7jlf+5UWYTffvg4BNfHsQR9XO9oqPg1EwGbHWjgJZ1Vz/Sc03iOEiHgJncDxelBRzMLQt8ohfX1vqv0uXCv05C3bhNaY6ookOkmjkzXLyICONmM0oqeZdRnL6FMYtSb+sYgXTSO2vbvFxtOx9qvF/0JOGvj9nVnK48nD1Sp/+4//8T++UXT6JnDZ2s5W+O/+u//2Jsh/Pz4axTNQNQsd8yFMclSgevD3OrGoEWmxMIL47be+RzlhtI8e1sI7lGCiVIpWUCvYUKq1aT9r19va4qKhweSif/9q1tMsX1WxofWtzLbdbGGt+c3pWJsWuVGhBWXrdl2AugqvA9H/hDsQpzVuXrgOC0opQFelKWU108d4WS2n413kmJIR8VDPgJpM9N0EXTytRdTIg+ynJtvTI7D4/as/8Sf+xEN2hXCZRvZOePfd4/dBqI3yfPniKOC76BMunIWT0LkPhyD47pP9D1Nx33nxRUK6oyMcvyxlbN6tS9+YjjdPLK4qaW3LRMF7UWfuabktiNjQg/Cmeb1S+UvPiOyUKP/17msreuMtOj2q26n9jjmuafW2uNsHd27RmG/u6eZtvKD063ah86VVzmhNEC03pFc95decn+gwWWspp4WiY/OskzdTLuLhacp7LI64sYrElIkMc7Rsjcf5dDI5u7lz861vf//7x+yK4UrZTguogPljf+yPpdvboHUpggmo72OS8R02BV2A0FFZszfAfo5jSkiUYS6NM+382i6XOSxUlywV1q/WzQ4uFP33Wxyxy1rz9ayUNsCHnfcqG7Q2Iuv/fA5UfyxD1temz4Y3Odd2xQwrn/Is7o15JDnRyIYkSxZGO2Nc3KzaLBzAjjahTdhj2nvHxPQloBtAFzJyoqbohMLYMTNi+1GssYhH/YVN4GB/n23vbJNoQ2w1mhTg7wRMDKPp1nIUT+59/Z+98fYv/dIvXapmsw2eCPIhAALKz372p0/H0yhPl3KSZHmMg0aFWunXh9lMQc4bRWB/AtlCG+Yn5NiHjtnliy7BeLQbOaWC2sv25L7qQtEp94f9dt4O5GvPTdpSrujx76wqa//UtISha49r1Zoy1rTFNTrUiYD6GR/r2ppAqUlEoT7P3ixqbupGZBliu2sFi8GFQToMB0KvFZDvKLuYTMkbJSN3shUsH2BD0V+YFAphSfHQn/jaNbDl7W9raRnlPErvEbHRBLOUb5+Nx5N3f/CDez/45V/+5Qv7bQ6BJyLzWYBFF/y1v/bXxru78c0tLj4Vb21voX3Fcjfc2FYQ6WZ7YHfh2u6HGqwHDx6w++/qtIQafF6Ln1Pmo18N9pP3I1+L7OeBOIffJmds8FO1Yu2sKmspZB+s+Eje3ZnalfWeK20SnHRYUJc1VQOjOJyKyGaXkp+myThm5Duqz2QUq/ohPFZzH2Q8lPXsPYwMwROrcP1Nd7ZPRmBIPz0N737hC19YXpYHyzp4IjKfBRwUbF6r//o/+08fjp+bjsHQ8MJqtRqLURCUqx0VLqC54nNOZyZwiqGK9XFM8N+D+w8oBus80OZQzM8zAy2y34UBRRWTsGQtEp5HxyGdBxsZzupVUGe8G4Sua+TqVgmu3Pg485HffjUhTO17KqucwRHx8MhlEwCLT1H4kA75wTQQCLF5oRQUy7X2cjabkAhTAm2OwpxmPFog4oHm4f4XvvDKE0M8hPMw4xcCQLNiOZ2eRbPr96IoeztJsmW6MAdXlNHHnNhMFKZTQjRFaShu3j5gt1+8Q7tVN9R8Q2uLZaiDytqN2cQAttYnlTn3XdUf6fddKR0wNqMK53O6abqbqN77NuivI1R9bR/9wnT2BZ3XZr1suFb7ut4ukpnsY5hRDM/xk2WCI0I8XC+4dgziCYpEMO+O67i8g4MJnUBVXxbYFBjTk6wI7s9md+5+7nOvnD1JxLP9eOKACpjJZCJv3JgkRRqpIs+mQc5GJAACdgoy6oZk60MhGucExQJ8YehvF48iSmiTK+3hgFA5lrRoBpjeUEPWVD10yXzd99xi4Vrq58p24QB9jBW09PkIxTBrXqmoaYsrbHnWu1xZQO1f7wkTFW91LpUJPGeNyPe+T6scau2JWJORFdHXFJZBhucrUJqHjK1WGKmAsp7OIK69VfDE2IyS3IJRHPQEI/K/ZYUWQcawQaMdLwbFnVYKVKNFz52QBWCHL+5Np8Hdn/mZ/+8TRzyEDwT5ENAD5qd+6v8jM3Q/EEEhBN+B2ePcZPHCF0CZzFRAGkYMSxqN0DYIyDcBPA1jELJTZvIV6kprC8p94f67vwTkM+xNx/JmbgPFujJt4O0h9RoUY121Nobe6i7jXO7SdNautBjFW1NkdEHXEOzH3C6MZgz2YHJDRPkuAwSk+ETjQoZ/M3SUxsNLkHIC4pFJMCu0mDLV5irKFRv6S5zaCMQqleo+WBbe/Rf/4p05ZmFnHwA8UYVLBwS/8iu/Mh4Vpz+RBcFNEABHoBIOBddHN9vcmaT5nHJiP61g8PDBETuaH7L5kT3MwhFKGkoWF7qM7LV7XVsTbwTf9IPoU24MBO6qSDqtd2svC+ff2sXWB3l7JzqaPJ8U3Fz5Nr8mHgmW6NR+eDY6sZoLneYP7qOuEvUCCHg4Cr4vTHCLihU0oNfXAnnjFKN0vBW8u1yO37l37x+evfrqm+d0lb84PA3IR/B3/s7f2V4cv/8jwHbc5GI0GY9HgYjtEcFm2cGij0FInqEHeqRfNJ4JPz86ZicgH+Ippi7+dS+F9R4uur22R3uj9NaDpzQ8BzrWcI9vGopfzk1Hr1viHRu/sE3VGmTZ8kx7O6oR5l+FNGgFjNJKloU+3ERZX02T5BYhiqf0HJZB+S6GjRlPjMUDTkvrugFg44tAhUk8Cu8f3N767he+8AvLD4LVdOGpQT6Ev/7X//ouV+olFuUHAhBwEgEFNAhoOcvSFDGbkhYUVc6Y3vtovtBIuKjcii5C9XRbbY8PUuwPAt7hHrZZJS5FHP4MwsWoYGdHWqDprdMAgyx0LqValEGxpXlBKqecbo7ChwDxOLqLAcWLp4KVR9KZBUPcbZEVUTheLVL13mx27a2//Jf/8oWyjl0WXPDNXy78s3/2z5L/35/5M2er1WMRhjCLqHvJ8yCgGBPcJ7RnA3rDYNrBQHOldBDn9vYEZARRpoHD0JSQtW1sWvDwI9oL715ZssPDpTNx7IZQHap5gZqsrTrcICmFKVbFMzjQEuTrKmW6xLaw6oguhIu/zLXR9FKpG9rJPRrTsJvQH2QtM5lTlIvM7WbKaa5GYMxPV2c6xwpwQvt7+2yMegAMkSnHqD1sAqiSB8EKKn7vpU/tfffP/tn//5U5Sm8KTxXyIXz9619Pf//v/3+doHoYzH/bMO+jYMRMjJf15sCswll52gwqYhDQBKG/5yQDtOvAw5ZUEpUetLzTNzNOqvm1Cpde0Ii/1ttlCIQ1b5R1YLAm72u7xJmCVdH2oasjcZuvKi4Kv5Ey9s94qbCaMhRZzCwjzSY+CuYnQ/kKLcuHGvFQB4CbzGoxp/eLXit4Zt5ka8KMY5szPmwHUDpgS/jcHW+tvvvv//v/8ZI9RfDUIR/CP//n/xzn/uRHf/yTgG5FrFQQhaEKmOP3iIiIPn15ltNLwrMOULEVx2Oggttsgn6hlJvfoof+8A6ZxoVBYlSVj/ACiKP1e7ih2Oq6Xd7W9YeZdb6hdrU0T4T9G4lHDbtd0do/VSQieZF76QQzOo45TQo6XpySHaGGM1dkSkJd1YjS6HN635gFAedn79o1tn+wQ6KH5mRziusr5wFYilTyE/j2e7/zO99957/8L/+bJ+Iytgk8lciH8P3vfz/f2ztY4CcM8UybYIJaUHumAPkwoy0Qo9+zlHJ0oM1PCHIWZTEoZKazMVECOmsbXqQv47Uvs41TCV4I+WoUwi7VvPqgs7YKN0EmTXmsnXBQ7xzW0P7XEkWny5aUkHhLxtaheg3ZUIlStoKHlaAJAYNcKf+KseWZeRERaDNHI6KcK/TnpOznEdvb3Wfbe9vMZqtmuWaB9CEzqK4JMxGx9xk7fetLX/ov7n3rW9/6QEwJ6+CJupdtCq+//nr28ssvHyoVgUknApu7fE6IcKRyFaABgg5aLI/AwnguUpXRibCUfEvEbO+Ak+r5+PC4PAZqkDmhDy5R6bIOtOaPU+ROa1eNwwlvy3lqny817ryvoXq1PpijucpmPO+d7rXtuvRVHm7mJFqlk9vS98R6wTDK64pmBJ1FjJWHUeJ7ne3MtIZXNhU3IWg0s4yngVD3Qbd59/332YWzSl8lPLWUz8Kbb76Z/+iP/qi8cSNeCrELokEyDfIMj/LRjExo9mtkQzHfPuZtxJwdBR5SHxjPGKCEkwlob0AoR9ZGVdLBxizeE0S8CuqsqTKUEa4JTVlCPz9F4/HKa8bJjKbYkIByDVTIUsX1TxCFU7rDNhM4fke0K5TOVCBBJEilziqN3izYKaR2eK49ZuFOQAbUztIFKdRmOzGLRqPOYQIlPAtGo3eWS3b38HB+ggf5sKcYnipTQx+88sor/LOf/ewYzAz7WXbygmDhtQDN8WSE9/cQsmkLgafJkFnC2sK0Fk37CSaOF3wnIKKZgzTLutnTDsbwMLijfJ257txQ0kM3ssFEJ+iYV59iRnhyL9c2v8TkX8GEtdHUhO/W2JTSFztQOci6DzmfvLt9vDp85Zd/efVB2/CGwIcG+QxQUt4kebQbBPEd2AFvRiEXoDAIeHmKbMljURo87cDLiQXlZpHhi18kJsWci4QXNaA/Mah7udhr5tt5Or1BAt4u0Ed4tVw3EeaJ4ZGVk60X+0qoheetk+1OhwrhDopyOxrPXaRzU+CT4TyIkjSVhxiZMB6fnfz8z385+TAgHsKHDfkIkAr+4T/8h/emo+JOIcIDMARNAMFCHnNvWWqkEyZoklF6OHqNNkwmUQb5FiaHfxOeRuTDUapLR77Gl5ZfCIp1oWUzRk//xr1NmVQgdpK5sNEFwgk0klQWj5yIY0GeKq3meZQVwXAOlG4BCph7aRrcPzg4OPniF7/4VCpWuuBDiXwGQqCC28vl41tBwA9AyzmDz4hYTOtaxG1wrg5BQipIL9MqL4yXlD5AQydaZdazgm2CeG2U6GrA9e9UrX3gl4p8/hXVUsZ4krRRPIt8C6NKcTj4mIvKNc5gpfVNmk3jThYTy4ZhkC7TYD4a8Yfb29kP/+Jf/E+eGsP5JvDUK1x6oPgn/+SfJJ/61I+f3N7ZOwsxY0BR4NmKPKCMrowMujanhwgEhcGgpwylLwwrWzBmFB3h2fFgS8KDRXBW0JyFSgwsgpMU1j4lX4OBmai0yG0qPecjyB7CuKlnU7C+N7xsk1Oad21RDllVK9c7RW58Tc5jLyy1MMZIbr1bVJUOv3C8aQrlX9NA6pTKqkenlaA5KNczEmrudjISTB/mYgYm0ByeU/oQTOUnTMdtjk1tv8MSXAKfeQrqm/eLIv3B4eHZ/f/oP/rPz3Ue+tMAH2bK58Frr70Wvfvd794ORHEzjINZtirGoyAPqu1Fpw64eXBAv5DNRDbVZZXcjTixMqE5YurCtE0OC5F1uqt/dZ15Ji1l4WvquExo2iO6xqRlM8mI19BCnaZ8br84L+Nny2G5QzIcTAHYzsNgBf/MweR09+BgdfjFL/61p8pb5TzwkUE+BFAtC9Bw7u7uTp5LF6ubUuVbjGsqSPIFY6Q5m0732f7+HosmMeWHoVNzVQ05zEk3BMSKJmU+EnUuLFTm6AefZWsg21CQleOw95y4XHZG1drr7ZLtgtOHKipFK2OInUSW04RZaTum1JkQbeo/8zAwMIWUeIxqsQxGwXtg472/s/PC4w+bbNcFHynkswCyIFgY1LXT0+STwLTsgQ2QW+STpAUVbG9vj+3v7AMC6uOpMU5sPl+YhDz67eNppvqmXiR40Of5EbAH+Qa4vDWgC/nYORUuZY9qPZTunZ7umL/YNKesDVGjjI1Qwbg/ZZ/CiHSblzSptVMAc8vFIXwDTeb+w7/0l/7Sh5bFbIOPJPIZCP7G3/gbU3V2dp2N2Ytgg98bYY4CboR9LIEc0XQGiAiUcHadFg2ZIRZz8iEkNYD0bYEV0ikTYyY7Vex1oIXtsGoXQZIGG3vBgF3VaY7uH5gdQxVXyJ0uaQoXY/yliQHUc8ooLo/m0NnFyOSDESkB2ujDE8kW7/6b/yaeiffhMR9sAh9l5LMAtsEvRY8f774Qx8HzeRbsoVmCtILOepmCRnT/4Hl2cHCdzWY7ZNydn8zZ0fExIOMJZc6Ssh4AiiBNFi2lE/ycjyfdCLTmsNbOBZBvc8TTGtW2QF5KPoAH30SYkq+KuSRzTnlUMw1AcxnOnK7AwJcHcq7OgnceJ8l9ECO0e8tHFD4OyEf5Qr/yla+AQnO1FbPx9VRlz7Og2AqDaBQANcQ1hIsmotz9SAkBEWf7pKDBqHlcK7h45vOlzqhWBne60df6i9aaa4roLt5Lx8mq6XNTUKv+b7nqgeYSDHK7hlLGjEcKKykchnUhwllbpFIayRJKcGvOSHe4hiKUBXAlEhScZ8ulujces4ecXzv9xV/8RSz4kUU8hI8F8llA4/zLL7+Ma2QHNtw9WAT7YDPawRQ8uKpIKRdjhjRtG5xRstUD0opSCguhlQe4PFFJkySAjIsjypzsgXK9PQx7SAmAzO/LQMTKS5mxjsNaap5xjef9bqjWsyZ4h/2PcuoAdSMFFmxSOq2Hr1zBtI/ozaIdGUyqP1Rc4RxQJogiCQQ/5ap4FIX5MZsujn/wA5Ze9iGUTyt8rJDPAmpFJ5PFREoxzfPwWhxH15jKZ6xwXNUoXwwHBNzXWY1nU0pdP6Pdfcd4Y6QUcb1YHBut6dwglnK4KVlRRpPkidQshm2Uqv20H1e2PCczaU3urfc0cI91FLwr3YMos3BjZAHOxwQ+wuTbxLnS82FlOEWpPRaYc9WkgtB+tQuG6epUrqTgwekyyw+FKI5u3947u3Hj06vPf/7zT7Uj9GXDxxL5LAAShjuPH8f5briV871dJYprMCUzWB5ToIgBedfHoswbE8FOvwMKGlp46PAbCTrWDAHvEXsFCwypojLJfsiRO01NRuVWNxDvS5MV1FYw2SmYKefAId5WsQF9TxhNkxuOVQebNQ4VU5ikCCkbJidCDiCmrHKsYiENlZewEaVpxVrixoSysu0GsP6FzBanYPk7gfk9USfJCX/8eH6yu5t8XChdHT7WyGcBZcK//bf/dpSmj2anp2xnNGI7oF3bjUI2DsJwBN9pnhARq0gJfayUlnFmYDecEasqpV6ECFatnuJiREoAbCqyYsim2oRAqo3y9bhqEUj3q1zHfdZA+OyldUjHcwviqNxkMEscUjS0y2m2Oy5zjNkxINuNjtAa+RJzjoL5i+zlCh1SyDqzHE3GJ2G4ePjwYX5261Z69nFiL7vgGfI5oBUzn+eTyWcn4/F0Pz1le4qzHV6wMcbBAzKJQOQBOWszRg7b8TQmpCNWjHKKAnVAE0Y0pcBPrWaPyUaIbJiljElSHfDhKnCUIxeWSp1OS4ZaZwlgpVaXzpbgJkpAGHYRz6bjFLyKENGGEhFbjdc19Zaaqhkqju0ltMEs9CmweDilZSvxCGbgK2WWqSBUaZarFaDwmQy3H43Hy8f7+586BQM5ItxHWpEyFJ4hXw+AnXDr7OxsfzuKtjO5nBVAHIKAx6NRwNO04Gg3xPM3SEuKC5lYNE4IGXGgHlGkKWOsHYVpwRvFRGmSUPr8gURVmkBKFgsURUpDWVRF+aSraKl9JeC8dB63iBcRBYvotB597JpBPBPIh8iHmaEXyVxnBMPNQmklCVJxKVOzSeCGgVQcy2KnNELKTMK+lakklbIIiwy0lytQWj1mLDyOHmfzX3r11VP2DBrwDPnWQwDsEb9xg43P3mfbYcT2Mqm2gpBPioIDXqlI5YLylaO2NDKUkMKZUGaaAnUUOskvMaGx1giivEjlGDPXrPeHBkcCrEGPQyW3Gse2Z7kJsWIOy6sI+RNCds1K6mS1TJ+FgMhlDrFJgI3U9kxtDM+yFYpxcEvKPA9WocoWsB/Np9PR4+PjDFjLWwmYC566pEVPEzxDvg3htdde4avVZ8fvvJNuh1k2U4Jd44XcQZ+1MZBEiWk4i5yOPAMjYlApKSJCDqQ6kUHM0g2L65hDITSl0maNSuYa7vfpayuRxbVsLNVgwq10ThTjmSOZUf0vKB2flSFTQ4GR8mb5qkClUb7Mi0Co/CyReKhGlmXF2XQaHKdp/BhYaaBury5efZV9rOW4TeAZ8l0AUEb82te+JpLk3uTxY3m9SBd7YT7aKkbBGFZwFIgJj80hjERhUCsJuLazs1Oq+LUiQyOY1qoKQk48J5yRukZTytIHdKjVwbjJqfIMCy2jarMAI2RDLndBbKXRyC70uYfILqOXiqV2PAzBJi6Ts7PTtEjVmZhE700m7OTRI4a+lvLjrjg5Lzz9KUmeYjD+hpn5nDDNoo5Wq9XWeBxMeJFvFamcnWTLbZDyxmkOhsSEo6t+kOVBQMwm55VTMilCTAS+dQW3p9wa1b+n0pT1ry6rWbm90S8pfaO/k44dEXQ0GhUrIGVhHhZqHAIruViFLJ9ngTgLlvmZ2NmZ37v3wwS0wgl7BpcCzyjfFQLaEe/evcu3trbE7m4Ro0QIavxtUaTTlSq2ikKIKZA5TNoFyIGYF4aIlMJqKE2yPlFFsGsTvevq5YPn+C19UwRRPF0gB/onoSUJiiMFolsWTUcLkN1OJ5PobH9/eZplL6Xf/OY3FVB2fOAZZbsCeIZ8VwzImtrvoGYPX3755eDToAb84c4OaEzT6PHjx6C0iUdCZKMIGNUiYZEMRRyCfVEUTCj4OwoUB3sjz4McOMAwUCrkmDjds+uBDURhLDudFgqklTKwcwVmNsl5DsrKMAniIM0xUy0UGI9HyXvvnUpoOwM2OHnhhRP1ne+USJZ/+ctfJnPARzGa4GmB/wf3E2XcNbzmDwAAAABJRU5ErkJggg=="
      />
    </defs>
  </svg>
);

type Props = {
  name?: Icon;
  height?: number;
};

function TokenIcon(props: Props) {
  const size = props.height || 32;
  const { classes } = useStyles({ size });

  const [icon, setIcon] = useState(noIcon);

  useEffect(() => {
    if (props.name) {
      setIcon(getIcon(props.name!)!);
    } else {
      setIcon(noIcon);
    }
  }, [props.name]);

  return <div className={classes.container}>{icon}</div>;
}

export default TokenIcon;
