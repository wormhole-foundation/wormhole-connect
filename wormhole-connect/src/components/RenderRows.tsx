import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Down from 'icons/Down';
import { Collapse } from '@mui/material';
import { joinClass } from 'utils/style';
import { NestedRow } from 'routes/types';
import Price from './Price';

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '4px 0',
  },
  rowTitle: {
    fontSize: '14px',
    opacity: '70%',
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
            <div className={classes.row}>
              <span className={classes.rowTitle}>{row.title}</span>
              {row.rows && (
                <Down
                  className={joinClass([
                    classes.arrow,
                    !collapsed && classes.invert,
                  ])}
                />
              )}
            </div>
            <div>
              <div className={`${props.small && classes.subrowText}`}>
                {row.value}
              </div>
              <Price textAlign="right">{row.valueUSD}</Price>
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
