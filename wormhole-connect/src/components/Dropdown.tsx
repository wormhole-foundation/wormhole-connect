import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Collapse from '@mui/material/Collapse';
import Down from 'icons/Down';
import { joinClass } from 'utils/style';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    borderRadius: '8px',
    boxShadow: theme.palette.card.elevation,
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    backgroundColor: theme.palette.card.background,
    backgroundOpacity: '80%',
    borderRadius: '8px',
    transition: 'border-radius 0.4s',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  arrow: {
    width: '32px',
    height: '32px',
    transition: 'transform 0.4s',
  },
  content: {
    padding: '16px',
    backgroundColor: theme.palette.card.background,
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    fontWeight: '300',
  },
  open: {
    borderBottomLeftRadius: '0 !important',
    borderBottomRightRadius: '0 !important',
  },
}));

type Props = {
  title: string;
  children: React.ReactNode;
  open: boolean;
  id?: any;
  onToggle?: (id: any) => any;
};

function Dropdown(props: Props) {
  const { classes } = useStyles();

  const click = () => {
    if (props.onToggle) {
      props.onToggle(props.id);
    }
  };

  return (
    <div className={classes.container}>
      <div
        className={joinClass([classes.header, !!props.open && classes.open])}
        onClick={click}
      >
        <div>
          <div className={classes.title}>{props.title}</div>
        </div>
        <Down
          className={joinClass([classes.arrow, !!props.open && classes.invert])}
        />
      </div>
      <Collapse in={props.open}>
        <div className={classes.content}>{props.children}</div>
      </Collapse>
    </div>
  );
}

export default Dropdown;
