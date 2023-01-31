import React from 'react';

type Props = {
  name: string;
  height?: number;
};

// TODO: images weren't rendering on build, find better solution?
// TODO: fill in svgs for mainnet networks/tokens
function TokenIcon(props: Props) {
  const size = props.height || 32;
  switch (props.name) {
    case 'metamask': {
      return (
        // <style>.st1,.st2,.st3,.st4,.st5,.st6,.st9{fill:#e4761b;stroke:#e4761b;stroke-linecap:round;stroke-linejoin:round}.st2,.st3,.st4,.st5,.st6,.st9{fill:#d7c1b3;stroke:#d7c1b3}.st3,.st4,.st5,.st6,.st9{fill:#233447;stroke:#233447}.st4,.st5,.st6,.st9{fill:#cd6116;stroke:#cd6116}.st5,.st6,.st9{fill:#e4751f;stroke:#e4751f}.st6,.st9{fill:#f6851b;stroke:#f6851b}.st9{fill:#763d16;stroke:#763d16}</style>
        <div style={{ height: `${size}px`, width: `${size}px` }}>
          <svg
            version="1.1"
            id="Layer_1"
            xmlns="http://www.w3.org/2000/svg"
            x="0"
            y="0"
            viewBox="0 0 318.6 318.6"
            enable-background="0 0 318.6 318.6"
            xmlSpace="preserve"
          >
            <path
              fill="#e2761b"
              stroke="#e2761b"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m274.1 35.5-99.5 73.9L193 65.8z"
            />
            <path
              fill="#e4761b"
              stroke="#e4761b"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m44.4 35.5 98.7 74.6-17.5-44.3zM238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3zM33.9 207.7 50.1 263l56.7-15.6-26.5-40.6z"
            />
            <path
              fill="#e4761b"
              stroke="#e4761b"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zM214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zM177.9 230.9l33.9 16.5-4.7-39.3z"
            />
            <path
              fill="#d7c1b3"
              stroke="#d7c1b3"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zM106.8 247.4l31.5 14.9-.2-9.3 2.5-22.1z"
            />
            <path
              fill="#233447"
              stroke="#233447"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m138.8 193.5-28.2-8.3 19.9-9.1zM179.7 193.5l8.3-17.4 20 9.1z"
            />
            <path
              fill="#cd6116"
              stroke="#cd6116"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zM230.8 162.1l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zM110.6 185.2l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"
            />
            <path
              fill="#e4751f"
              stroke="#e4751f"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m87.8 162.1 23.6 46-.8-22.9zM208.1 185.2l-1 22.9 23.7-46zM144.1 164.6l-5.3 28.9 6.6 34.1 1.5-44.9zM174.6 164.6l-2.7 18 1.2 45 6.7-34.1z"
            />
            <path
              fill="#f6851b"
              stroke="#f6851b"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zM110.6 185.2l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"
            />
            <path
              fill="#c0ad9e"
              stroke="#c0ad9e"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"
            />
            <path
              fill="#161616"
              stroke="#161616"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"
            />
            <path
              fill="#763d16"
              stroke="#763d16"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"
            />
            <path
              fill="#f6851b"
              stroke="#f6851b"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zM103.6 138.2l-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zM174.6 164.6l3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"
            />
          </svg>
        </div>
      );
    }
    case 'walletConnect': {
      return (
        <div style={{ height: `${size}px`, width: `${size}px` }}>
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            fill-rule="evenodd"
            clip-rule="evenodd"
            stroke-linejoin="round"
            stroke-miterlimit="2"
          >
            <g transform="translate(1.682 1.682) scale(1.7897)">
              <clipPath id="a">
                <path d="M0 0h16v16H0z" />
              </clipPath>
              <g clip-path="url(#a)">
                <path
                  d="M12.725 4.927c-2.594-2.588-6.856-2.588-9.45 0l-.344.345a.334.334 0 0 0 0 .471l1.074 1.073a.167.167 0 0 0 .236 0l.463-.462c1.809-1.806 4.783-1.806 6.592 0l.432.431a.167.167 0 0 0 .236 0l1.075-1.072a.33.33 0 0 0 0-.472l-.314-.314ZM15.902 8.1l-.956-.955a.336.336 0 0 0-.472 0l-3.06 3.055a.085.085 0 0 1-.118 0l-3.06-3.055a.336.336 0 0 0-.472 0L4.704 10.2a.085.085 0 0 1-.118 0l-3.06-3.055a.336.336 0 0 0-.472 0L.098 8.1a.33.33 0 0 0 0 .472l4.31 4.304c.131.13.343.13.473 0l3.06-3.055a.085.085 0 0 1 .118 0l3.06 3.055c.13.13.342.13.472 0l4.311-4.304a.33.33 0 0 0 0-.472Z"
                  fill="#3b99fc"
                  fill-rule="nonzero"
                />
              </g>
            </g>
          </svg>
        </div>
      );
    }
    default: {
      return <div style={{ height: `${size}px`, width: `${size}px` }}></div>;
    }
  }
}

export default TokenIcon;
