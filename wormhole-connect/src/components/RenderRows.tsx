import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Down from 'icons/Down';
import { Collapse } from '@mui/material';
import { joinClass } from 'utils/style';
import { NestedRow } from 'routes/types';

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '4px 0 8px',
    gap: '10px',
  },
  rowTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      flex: 1,
    },
  },
  rowTitle: {
    fontSize: '14px',
    opacity: '70%',
  },
  rowTitleMinContent: {
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'min-content',
    },
  },
  rowText: {
    [theme.breakpoints.down('sm')]: {
      textAlign: 'right',
      flex: 1,
    },
  },
  arrow: {
    height: '24px',
    marginLeft: '8px',
    transition: 'transform 0.4s',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  subrow: {
    marginLeft: '16px',
  },
  subrowText: {
    fontSize: '14px',
  },
}));

interface RenderRowsProps {
  rows: NestedRow[];
  small?: boolean;
}

export function RenderRows(props: RenderRowsProps) {
  const { classes } = useStyles();
  const [collapsed, setCollapsed] = React.useState(true);
  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  return (
    <div>
      {props.rows.map((row, i) => (
        <div key={i}>
          <div
            className={classes.row}
            style={{ cursor: row.rows ? 'pointer' : 'default' }}
            onClick={() => row.rows && toggleCollapsed()}
          >
            <div className={classes.rowTitleContainer}>
              <span
                className={`${classes.rowTitle} ${
                  row.rows ? classes.rowTitleMinContent : ''
                }`}
              >
                {row.title}
              </span>
              {row.rows && (
                <Down
                  className={joinClass([
                    classes.arrow,
                    !collapsed && classes.invert,
                  ])}
                />
              )}
            </div>
            <div
              className={`${classes.rowText} ${
                props.small ? classes.subrowText : ''
              }`}
            >
              {row.value}
            </div>
          </div>
          <div>
            {row.rows && (
              <Collapse in={!collapsed}>
                <div className={classes.subrow}>
                  <RenderRows rows={row.rows} small />
                </div>
              </Collapse>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
