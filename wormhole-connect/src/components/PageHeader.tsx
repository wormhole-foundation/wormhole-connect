import React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { setRoute } from 'store/router';

import Header, { Alignment } from './Header';
import MenuFull from './MenuFull';
import DownIcon from 'icons/Down';

const useStyles = makeStyles<{
  showHamburgerMenu: boolean;
  align: Alignment;
}>()((theme, { showHamburgerMenu, align }) => ({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: showHamburgerMenu ? '40px' : '0px',
    [theme.breakpoints.down('sm')]: {
      marginBottom: '20px',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  left: {
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    textAlign: align,
  },
  arrowBack: {
    transform: 'rotate(90deg)',
    marginRight: '16px',
    cursor: 'pointer',
  },
  description: {
    fontWeight: '300',
    fontSize: '14px',
    opacity: '0.6',
    marginBottom: showHamburgerMenu ? '0px' : '40px',
  },
}));

type PageHeaderProps = {
  title: string;
  align?: Alignment;
  description?: string;
  back?: boolean;
  showHamburgerMenu?: boolean;
};

function PageHeader({
  back,
  title,
  align = 'left',
  description,
  showHamburgerMenu = true,
}: PageHeaderProps) {
  const { classes } = useStyles({ showHamburgerMenu, align });
  const dispatch = useDispatch();
  function goBack() {
    dispatch(setRoute('bridge'));
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.left}>
          {back && (
            <DownIcon
              className={classes.arrowBack}
              fontSize="large"
              onClick={goBack}
            />
          )}
          <Header text={title} align={align} />
        </div>
        {showHamburgerMenu ? <MenuFull /> : null}
      </div>
      {description && <div className={classes.description}>{description}</div>}
    </div>
  );
}

export default PageHeader;
