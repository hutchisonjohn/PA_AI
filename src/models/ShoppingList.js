/**
 * Shopping List Model (v7 Schema)
 * 
 * v7 Changes:
 * - Added: isDefault field (supports multiple lists in V2)
 */

export const createShoppingList = (listData) => {
  return {
    // Identity
    listId: listData.listId,
    userId: listData.userId, // List owner
    groupId: listData.groupId || null, // Shared with group

    // v7: Multiple lists support
    isDefault: listData.isDefault !== undefined ? listData.isDefault : true, // First list = default

    // Basic info
    name: listData.name || 'Shopping List',
    description: listData.description || '',
    icon: listData.icon || '🛒',

    // Items
    items: listData.items || [],

    // Store associations
    preferredStore: listData.preferredStore || null,
    storeLocations: listData.storeLocations || [],

    // Metadata
    createdAt: listData.createdAt || new Date().toISOString(),
    updatedAt: listData.updatedAt || new Date().toISOString(),
    itemCount: listData.items?.length || 0,
    purchasedCount: listData.items?.filter(item => item.purchased).length || 0,
    lastShoppingDate: listData.lastShoppingDate || null,
  };
};

export const addItemToList = (list, item) => {
  const newItem = {
    itemId: `item_${Date.now()}`,
    name: item.name,
    quantity: item.quantity || '1',
    category: item.category || 'other',
    purchased: false,
    addedBy: item.addedBy,
    addedAt: new Date().toISOString(),
    purchasedBy: null,
    purchasedAt: null,
    notes: item.notes || '',
  };

  const updatedItems = [...list.items, newItem];

  return {
    ...list,
    items: updatedItems,
    itemCount: updatedItems.length,
    updatedAt: new Date().toISOString(),
  };
};

export const updateItemInList = (list, itemId, updates) => {
  const updatedItems = list.items.map(item => {
    if (item.itemId === itemId) {
      const updatedItem = {
        ...item,
        ...updates,
        purchasedAt: updates.purchased && !item.purchased ? new Date().toISOString() : item.purchasedAt,
      };
      return updatedItem;
    }
    return item;
  });

  return {
    ...list,
    items: updatedItems,
    purchasedCount: updatedItems.filter(item => item.purchased).length,
    lastShoppingDate: updates.purchased ? new Date().toISOString() : list.lastShoppingDate,
    updatedAt: new Date().toISOString(),
  };
};

