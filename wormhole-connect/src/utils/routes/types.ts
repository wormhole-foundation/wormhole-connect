export type Row = {
  title: string;
  value: string;
};

export interface NestedRow extends Row {
  rows?: Row[];
}

export type TransferDisplayData = NestedRow[];
