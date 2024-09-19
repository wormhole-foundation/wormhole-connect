import { TransactionLocal } from 'config/types';

// Adds an object to localStorage
export const addItemToLocalStorage = (
  id: string, // Key for the item
  data: object, // Item data
  prefix: string, // Prefix to use for the item key
  max?: number, // Max number of items allowed with the same prefix
) => {
  const ls = window.localStorage;
  const items: Array<string> = [];

  // Get all current items with the prefix
  for (let i = 0; i < ls.length; i++) {
    const itemKey = ls.key(i);
    if (itemKey?.toLowerCase().startsWith(prefix)) {
      items.push(itemKey);
    }
  }

  // Remove the oldest items that puts the length at or over the limit
  if (max && items.length >= max) {
    for (let i = 0; i < items.length - max + 1; i++) {
      ls.removeItem(items[i]);
    }
  }

  // Add the new item
  const lsItemId = `${prefix}${id}`;
  ls.setItem(lsItemId, JSON.stringify(data));
};

// Retrieves all items with a key prefix from localStorage
export const getItemsFromLocalStorage = (
  prefix: string, // Prefix to use for the item key
): Array<TransactionLocal> => {
  const ls = window.localStorage;
  const items: Array<TransactionLocal> = [];

  // Iterate all items in localStorage and collect those with the specified key prefix
  for (let i = 0; i < ls.length; i++) {
    const itemKey = ls.key(i);
    if (itemKey?.toLowerCase().startsWith(prefix)) {
      const item = ls.getItem(itemKey);
      if (item) {
        try {
          items.push(JSON.parse(item));
        } catch (e: any) {
          console.log(`Error parsing transaction from localStorage: ${e}`);
        }
      }
    }
  }

  return items;
};
