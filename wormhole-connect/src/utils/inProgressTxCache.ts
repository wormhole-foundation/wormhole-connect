import { TransactionLocal } from 'config/types';

const LOCAL_STORAGE_KEY = 'wormhole-connect:transactions:inprogress';
const LOCAL_STORAGE_MAX = 3;

// Retrieves all in-progress transactions from localStorage
export const getTxsFromLocalStorage = ():
  | Array<TransactionLocal>
  | undefined => {
  const ls = window.localStorage;

  // Find the in-progress transactions list in localStorage
  for (let i = 0; i < ls.length; i++) {
    const itemKey = ls.key(i);
    if (itemKey?.toLowerCase() === LOCAL_STORAGE_KEY) {
      const item = ls.getItem(itemKey);
      if (item) {
        try {
          return JSON.parse(item);
        } catch (e: any) {
          console.log(
            `Error while parsing localStorage item ${LOCAL_STORAGE_KEY}: ${e}`,
          );
          return;
        }
      }
    }
  }
};

// Adds a TransactionLocal object to localStorage
export const addTxToLocalStorage = (
  data: TransactionLocal, // Item data
) => {
  const ls = window.localStorage;
  const items = getTxsFromLocalStorage();
  let newList: Array<TransactionLocal>;

  if (!items) {
    // First item in the list
    newList = [data];
  } else if (items.length < LOCAL_STORAGE_MAX) {
    // Haven't reached to the max number of items allowed
    // Concat the new item to the end
    newList = items.concat([data]);
  } else {
    // Reached the max number of items allowed
    // Remove the first element and concat the new one to the end
    items.splice(0, 1);
    newList = items.concat([data]);
  }

  // Update the list
  ls.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
};

// Removes a transaction from localStorage
export const removeTxFromLocalStorage = (txHash: string) => {
  const ls = window.localStorage;
  const items = getTxsFromLocalStorage();

  if (items && items.length > 0) {
    // Find the item to remove
    const removeIndex = items.findIndex((tx) => tx.txHash === txHash);
    if (removeIndex > -1) {
      // remove the item and update localStorage
      items.splice(removeIndex, 1);
      ls.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }
};