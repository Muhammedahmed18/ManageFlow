// Field mapping between display names and field keys
export const FIELD_MAPPING = {
  'Sent By': 'sent_by',
  'Return Date': 'return_date',
  'Order Date': 'order_date',
  'Customer': 'customer',
  'Quantity': 'quantity',
  'Special Instructions': 'special_instructions',
  'Product': 'product',
  'Order ID': 'order_id',
  'Order Number': 'order_number',
  'Order No': 'order_no',
  // Add more mappings as needed
};

// Translation functions
export const translateDisplayToKey = (displayName) => {
  return FIELD_MAPPING[displayName] || displayName;
};

export const translateKeyToDisplay = (key) => {
  return Object.keys(FIELD_MAPPING).find(k => FIELD_MAPPING[k] === key) || key;
};

 