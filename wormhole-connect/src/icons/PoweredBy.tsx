import React from 'react';
import config from 'config';
import Box from '@mui/material/Box';
import { makeStyles } from 'tss-react/mui';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: '100%',
    flexWrap: 'wrap',
    gap: '20px 4px',
  },
  partnerLogo: {
    maxHeight: theme.spacing(3),
  },
  separator: {
    display: 'flex',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

function SeparatorSymbol(props: { color: string }) {
  const { classes } = useStyles();
  return (
    <Box className={classes.separator}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 27 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill={props.color}
          d="M24.536 37.864C22.376 37.72 20.6 37.288 18.728 35.416C17.432 36.328 15.416 37.432 12.008 37.432H11.624C5.096 37.432 0.632 33.832 0.632 27.64V26.824C0.632 22.024 3.608 19.528 6.68 17.464C4.808 14.392 3.176 11.848 3.176 8.632V8.056C3.176 3.832 5.72 0.951998 11.336 0.951998H12.104C18.008 0.951998 20.024 4.072 20.024 8.056V8.248C20.024 12.136 17.864 14.92 13.64 17.992L19.016 26.728C19.448 23.992 19.688 20.872 19.688 16.6H25.448C25.4 21.784 24.536 26.872 22.616 31.24C24.2 32.392 25.592 32.392 26.888 32.536L24.536 37.864ZM9.224 8.392C9.224 10.168 9.848 11.8 11.432 14.44C13.496 11.992 14.072 10.696 14.072 8.632V8.44C14.072 6.184 13.208 5.464 11.672 5.464C10.088 5.464 9.224 6.232 9.224 8.296V8.392ZM12.632 32.536C14.024 32.536 15.032 32.248 15.848 31.72L9.032 21.16C7.928 22.456 6.824 23.896 6.824 26.344V26.584C6.824 30.04 9.032 32.536 12.632 32.536Z"
        />
      </svg>
    </Box>
  );
}

function WormholeLogo(props: { color: string }) {
  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      gap="4px"
    >
      <Typography fontSize="12px" sx={{ opacity: 0.6 }}>
        Powered by
      </Typography>
      <Link
        href="https://wormhole.com/products/connect"
        paddingBottom="2px"
        target="_blank"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="78"
          height="8"
          viewBox="0 0 78 8"
          fill="none"
        >
          <g clipPath="url(#clip0_2_9880)">
            <path
              d="M58.9654 0.5H55.3552C53.9676 0.5 52.8438 1.59108 52.8438 2.93817V5.06183C52.8438 6.40892 53.9676 7.5 55.3552 7.5H59.0508V7.49634C60.3982 7.45246 61.4769 6.38088 61.4769 5.06183V2.93817C61.4769 1.59108 60.353 0.5 58.9654 0.5ZM58.5762 6.33699H55.7445V1.66301H58.5762V6.33699Z"
              fill={props.color}
            />
            <path
              d="M18.8612 0.5H15.251C13.8634 0.5 12.7395 1.59108 12.7395 2.93817V5.06183C12.7395 6.40892 13.8634 7.5 15.251 7.5H18.9466V7.49634C20.294 7.45246 21.3726 6.38088 21.3726 5.06183V2.93817C21.3726 1.59108 20.2488 0.5 18.8612 0.5ZM18.4719 6.33699H15.6402V1.66301H18.4719V6.33699Z"
              fill={props.color}
            />
            <path
              d="M39.0683 1.71909L36.9713 5.24469V0.5H35.5184C34.6206 0.5 33.7918 0.964472 33.3435 1.71909L30.3046 6.82828L28.9673 4.58029C29.9279 4.56931 30.7039 3.80982 30.7039 2.87478V2.20672C30.7039 1.26437 29.9166 0.5 28.9459 0.5H22.0708V7.5H24.9715V4.5815H25.6195L27.3549 7.5H31.2452L34.0705 2.748V7.5H36.9713V7.49756L39.7841 2.7675V7.5H42.6848V0.5H41.242C40.3442 0.5 39.5154 0.964472 39.0671 1.71909H39.0683ZM27.8032 3.4185H24.9715V1.66301H27.8032V3.4185Z"
              fill={props.color}
            />
            <path
              d="M49.2273 3.4185H46.3956V0.5H43.4949V7.5H46.3956V4.5815H49.2273V7.5H52.128V0.5H49.2273V3.4185Z"
              fill={props.color}
            />
            <path
              d="M65.0934 0.5H62.1926V5.06183C62.1926 6.40892 63.3165 7.5 64.7041 7.5H68.8379V6.33699H65.0934V0.5Z"
              fill={props.color}
            />
            <path
              d="M77.5001 1.66301V0.5H72.4847H69.584V1.66301V3.4185V4.5815V6.33699V7.5H72.4847H77.5001V6.33699H72.4847V4.5815H76.4541V3.4185H72.4847V1.66301H77.5001Z"
              fill={props.color}
            />
            <path
              d="M11.9409 0.5L9.11555 5.252V0.5H6.21482V0.502438L3.40199 5.2325V0.5H0.5V7.5H1.94283C2.84068 7.5 3.66946 7.03553 4.11775 6.28091L6.21482 2.75531V7.5H7.6677C8.56554 7.5 9.39432 7.03553 9.84262 6.28091L13.2808 0.5H11.9409Z"
              fill={props.color}
            />
          </g>
          <defs>
            <clipPath id="clip0_2_9880">
              <rect
                width="77"
                height="7"
                fill={props.color}
                transform="translate(0.5 0.5)"
              />
            </clipPath>
          </defs>
        </svg>
      </Link>
    </Stack>
  );
}

function PartnerLogo(props: { src: string }) {
  const { classes } = useStyles();
  return <img src={props.src} alt="partner" className={classes.partnerLogo} />;
}

function PoweredByIcon(props: { color: string }) {
  const { classes } = useStyles();
  return config.ui.partnerLogo ? (
    <Box className={classes.container}>
      <WormholeLogo color={props.color} />
      <SeparatorSymbol color={props.color} />
      <PartnerLogo src={config.ui.partnerLogo} />
    </Box>
  ) : (
    <WormholeLogo color={props.color} />
  );
}

export default PoweredByIcon;
