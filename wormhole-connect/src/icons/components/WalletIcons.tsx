import React from 'react';
import { WalletType } from '../../store/wallet';

type Props = {
  type: WalletType;
  height?: number;
};

// TODO: images weren't rendering on build, find better solution?
function WalletIcon(props: Props) {
  const size = props.height || 32;
  switch (props.type) {
    case WalletType.METAMASK: {
      return (
        <div style={{ height: `${size}px`, width: `${size}px` }}>
          <svg
            version="1.1"
            id="Layer_1"
            xmlns="http://www.w3.org/2000/svg"
            x="0"
            y="0"
            viewBox="0 0 318.6 318.6"
            enableBackground="0 0 318.6 318.6"
            xmlSpace="preserve"
          >
            <path
              fill="#e2761b"
              stroke="#e2761b"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m274.1 35.5-99.5 73.9L193 65.8z"
            />
            <path
              fill="#e4761b"
              stroke="#e4761b"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m44.4 35.5 98.7 74.6-17.5-44.3zM238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3zM33.9 207.7 50.1 263l56.7-15.6-26.5-40.6z"
            />
            <path
              fill="#e4761b"
              stroke="#e4761b"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zM214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zM177.9 230.9l33.9 16.5-4.7-39.3z"
            />
            <path
              fill="#d7c1b3"
              stroke="#d7c1b3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zM106.8 247.4l31.5 14.9-.2-9.3 2.5-22.1z"
            />
            <path
              fill="#233447"
              stroke="#233447"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m138.8 193.5-28.2-8.3 19.9-9.1zM179.7 193.5l8.3-17.4 20 9.1z"
            />
            <path
              fill="#cd6116"
              stroke="#cd6116"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zM230.8 162.1l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zM110.6 185.2l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"
            />
            <path
              fill="#e4751f"
              stroke="#e4751f"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m87.8 162.1 23.6 46-.8-22.9zM208.1 185.2l-1 22.9 23.7-46zM144.1 164.6l-5.3 28.9 6.6 34.1 1.5-44.9zM174.6 164.6l-2.7 18 1.2 45 6.7-34.1z"
            />
            <path
              fill="#f6851b"
              stroke="#f6851b"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zM110.6 185.2l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"
            />
            <path
              fill="#c0ad9e"
              stroke="#c0ad9e"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"
            />
            <path
              fill="#161616"
              stroke="#161616"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"
            />
            <path
              fill="#763d16"
              stroke="#763d16"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"
            />
            <path
              fill="#f6851b"
              stroke="#f6851b"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zM103.6 138.2l-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zM174.6 164.6l3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"
            />
          </svg>
        </div>
      );
    }
    case WalletType.WALLET_CONNECT: {
      return (
        <div style={{ height: `${size}px`, width: `${size}px` }}>
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            fillRule="evenodd"
            clipRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit="2"
          >
            <g transform="translate(1.682 1.682) scale(1.7897)">
              <clipPath id="a">
                <path d="M0 0h16v16H0z" />
              </clipPath>
              <g clipPath="url(#a)">
                <path
                  d="M12.725 4.927c-2.594-2.588-6.856-2.588-9.45 0l-.344.345a.334.334 0 0 0 0 .471l1.074 1.073a.167.167 0 0 0 .236 0l.463-.462c1.809-1.806 4.783-1.806 6.592 0l.432.431a.167.167 0 0 0 .236 0l1.075-1.072a.33.33 0 0 0 0-.472l-.314-.314ZM15.902 8.1l-.956-.955a.336.336 0 0 0-.472 0l-3.06 3.055a.085.085 0 0 1-.118 0l-3.06-3.055a.336.336 0 0 0-.472 0L4.704 10.2a.085.085 0 0 1-.118 0l-3.06-3.055a.336.336 0 0 0-.472 0L.098 8.1a.33.33 0 0 0 0 .472l4.31 4.304c.131.13.343.13.473 0l3.06-3.055a.085.085 0 0 1 .118 0l3.06 3.055c.13.13.342.13.472 0l4.311-4.304a.33.33 0 0 0 0-.472Z"
                  fill="#3b99fc"
                  fillRule="nonzero"
                />
              </g>
            </g>
          </svg>
        </div>
      );
    }
    case WalletType.PHANTOM: {
      return (
        <div style={{ height: `${size}px`, width: `${size}px` }}>
          <svg
            viewBox="0 0 173 173"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M86.1 172.2C133.652 172.2 172.2 133.652 172.2 86.1C172.2 38.5483 133.652 0 86.1 0C38.5483 0 0 38.5483 0 86.1C0 133.652 38.5483 172.2 86.1 172.2Z"
              fill="url(#paint0_linear_101_6779)"
            />
            <path
              d="M147.8 87.1999H132.6C132.6 56.0999 107.5 30.8999 76.4999 30.8999C45.7999 30.8999 20.7999 55.3999 20.1999 86.0999C19.5999 117.5 49.1999 144.8 80.6999 144.8H84.6999C112.5 144.8 149.8 123.1 155.6 96.6999C156.5 92.3999 153.7 88.2999 149.4 87.3999C148.9 87.1999 148.4 87.1999 147.8 87.1999ZM53.7999 88.5999C53.7999 92.7999 50.3999 96.0999 46.1999 96.0999C41.9999 96.0999 38.6999 92.6999 38.6999 88.5999V76.3999C38.6999 72.1999 42.0999 68.8999 46.2999 68.8999C50.4999 68.8999 53.7999 72.2999 53.7999 76.3999V88.5999ZM79.9999 88.5999C79.9999 92.7999 76.5999 96.0999 72.3999 96.0999C68.1999 96.0999 64.8999 92.6999 64.8999 88.5999V76.3999C64.8999 72.1999 68.2999 68.8999 72.4999 68.8999C76.6999 68.8999 79.9999 72.2999 79.9999 76.3999V88.5999Z"
              fill="url(#paint1_linear_101_6779)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_101_6779"
                x1="86.14"
                y1="0"
                x2="86.14"
                y2="172.28"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#534BB1" />
                <stop offset="1" stopColor="#551BF9" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_101_6779"
                x1="87.9737"
                y1="31.1599"
                x2="87.9737"
                y2="144.79"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" />
                <stop offset="1" stopColor="white" stopOpacity="0.82" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );
    }
    case WalletType.SOLFLARE: {
      return (
        <div style={{ height: `${size}px`, width: `${size}px` }}>
          <svg
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M25.1708 47.9104C25.6958 47.9104 26.1215 48.3314 26.1215 48.8507C26.1215 49.37 25.6958 49.7909 25.1708 49.7909C24.6458 49.7909 24.2201 49.37 24.2201 48.8507C24.2201 48.3314 24.6458 47.9104 25.1708 47.9104ZM24.138 2.99475C24.6026 3.03311 24.9778 3.38515 25.0407 3.84156L26.1714 12.0573C26.5512 14.7716 29.8249 15.9477 31.8457 14.1032L43.1748 3.79162C43.4481 3.54289 43.8737 3.56013 44.1255 3.83013C44.3564 4.07785 44.3634 4.4571 44.1416 4.7129L34.2625 16.1087C32.4438 18.2029 33.7857 21.473 36.5581 21.7065L45.2749 22.5468C45.709 22.5886 46.0266 22.9702 45.9842 23.3992C45.9493 23.7529 45.6768 24.0387 45.3214 24.0941L36.162 25.5243C33.5027 25.8868 32.2984 29.036 34.0281 31.0819L37.2481 34.878C37.5075 35.1838 37.4669 35.6395 37.1573 35.8958C36.8951 36.113 36.5154 36.1214 36.2435 35.9161L32.2741 32.9183C30.132 31.3074 27.0444 32.6766 26.818 35.3426L25.9433 45.7402C25.9071 46.1697 25.5255 46.4889 25.0908 46.4532C24.7218 46.4229 24.4237 46.1435 24.3737 45.7811L22.9866 35.7374C22.6149 33.023 19.3412 31.847 17.3123 33.6915L5.26035 44.6655C5.01088 44.8926 4.62226 44.8769 4.39235 44.6305C4.18141 44.4043 4.175 44.0581 4.37742 43.8245L14.8956 31.686C16.7143 29.5918 15.3805 26.3216 12.608 26.0882L3.88928 25.2477C3.45515 25.2059 3.13756 24.8242 3.17992 24.3953C3.21485 24.0416 3.48731 23.7559 3.84262 23.7003L12.996 22.2704C15.6554 21.9079 16.8678 18.7587 15.1381 16.7128L12.9461 14.1287C12.6244 13.7495 12.6748 13.1844 13.0587 12.8666C13.384 12.5972 13.855 12.5869 14.1921 12.8417L16.8839 14.8764C19.026 16.4873 22.1136 15.1181 22.34 12.4521L23.0641 3.89212C23.1098 3.35132 23.5906 2.94955 24.138 2.99475ZM0.95067 23.4344C1.47571 23.4344 1.90134 23.8554 1.90134 24.3747C1.90134 24.894 1.47571 25.315 0.95067 25.315C0.425629 25.315 0 24.894 0 24.3747C0 23.8554 0.425629 23.4344 0.95067 23.4344ZM48.6304 22.4797C49.1554 22.4797 49.5811 22.9007 49.5811 23.42C49.5811 23.9393 49.1554 24.3602 48.6304 24.3602C48.1054 24.3602 47.6797 23.9393 47.6797 23.42C47.6797 22.9007 48.1054 22.4797 48.6304 22.4797ZM24.0008 0C24.5258 0 24.9514 0.420973 24.9514 0.94027C24.9514 1.45957 24.5258 1.88054 24.0008 1.88054C23.4757 1.88054 23.0501 1.45957 23.0501 0.94027C23.0501 0.420973 23.4757 0 24.0008 0Z"
              fill="url(#paint0_linear)"
            />
            <path
              d="M24.571 32.7792C29.5306 32.7792 33.5512 28.8027 33.5512 23.8973C33.5512 18.992 29.5306 15.0154 24.571 15.0154C19.6114 15.0154 15.5908 18.992 15.5908 23.8973C15.5908 28.8027 19.6114 32.7792 24.571 32.7792Z"
              fill="url(#paint1_radial)"
            />
            <defs>
              <linearGradient
                id="paint0_linear"
                x1="6.47835"
                y1="7.92"
                x2="34.9107"
                y2="33.6593"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFC10B" />
                <stop offset="1" stopColor="#FB3F2E" />
              </linearGradient>
              <radialGradient
                id="paint1_radial"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(22.5202 20.6183) rotate(67.5196) scale(13.056 13.1829)"
              >
                <stop stopColor="#FFC10B" />
                <stop offset="1" stopColor="#FB3F2E" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      );
    }
    default: {
      return <div style={{ height: `${size}px`, width: `${size}px` }}></div>;
    }
  }
}

export default WalletIcon;
