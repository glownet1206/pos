import { FaUtensils, FaStore, FaCapsules } from 'react-icons/fa';
import { GiCarWheel, GiTyre } from 'react-icons/gi';
import { MdTableRestaurant, MdMedication, MdInventory2 } from 'react-icons/md';

export const BUSINESS_CONFIG = {
  tyre_shop: {
    label: 'Tyre Shop',
    icon: GiCarWheel,
    color: '#f97316',
    inventoryLabel: 'Inventory',
    inventoryIcon: GiTyre,
    itemLabel: 'Tyre',
    itemsLabel: 'Tyres',
    salesLabel: 'Sales / POS',
    suppliersLabel: 'Suppliers',
    showTables: false,
    itemFields: [
      { key: 'brand',               label: 'Brand',            type: 'text',   required: true,  placeholder: 'e.g. Michelin' },
      { key: 'model',               label: 'Model',            type: 'text',   required: true,  placeholder: 'e.g. Primacy 4' },
      { key: 'size',                label: 'Size',             type: 'text',   required: true,  placeholder: '225/50 R17' },
      { key: 'type',                label: 'Type',             type: 'select', required: false,
        options: ['Passenger','Car','SUV','Truck','Motorcycle','Van','Bus','Tractor','Other'] },
      { key: 'car_type',            label: 'Car Type (Optional)', type: 'datalist', required: false, fullWidth: true,
        placeholder: 'Type or select car model...',
        suggestions: [
          'Toyota Corolla','Toyota Yaris','Toyota Camry','Toyota Fortuner','Toyota Hilux',
          'Toyota Land Cruiser','Toyota Prado','Toyota Vitz','Toyota Aqua','Toyota Prius',
          'Honda Civic','Honda City','Honda BR-V','Honda HR-V','Honda CR-V','Honda Accord','Honda Vezel',
          'Suzuki Alto','Suzuki Cultus','Suzuki Swift','Suzuki Wagon R','Suzuki Jimny','Suzuki Vitara','Suzuki Bolan',
          'Hyundai Tucson','Hyundai Elantra','Hyundai Sonata','Hyundai Santa Fe',
          'KIA Sportage','KIA Stonic','KIA Picanto','KIA Sorento',
          'Nissan Sunny','Nissan Patrol','Nissan Navara',
          'Mitsubishi Pajero','Mitsubishi L200',
          'Changan Alsvin','Changan Oshan X7','Changan CS35',
          'MG HS','MG ZS','MG 5',
          'Proton Saga','Proton X70',
          'BMW 3 Series','BMW 5 Series','BMW X5',
          'Mercedes C-Class','Mercedes E-Class',
          'Audi A3','Audi A4','Audi Q5',
          'Universal / All Cars',
        ],
      },
      { key: 'price',               label: 'Sale Price',       type: 'number', required: true,  isCurrency: true },
      { key: 'cost_price',          label: 'Cost Price',       type: 'number', required: false, isCurrency: true },
      { key: 'stock',               label: 'Stock Qty',        type: 'number', required: false },
      { key: 'low_stock_threshold', label: 'Low Stock Alert',  type: 'number', required: false },
      { key: 'barcode',             label: 'Barcode',          type: 'text',   required: false, placeholder: 'Optional' },
    ],
    itemName: (item) => `${item.brand} ${item.model} ${item.size}`,
    itemSubtitle: (item) => item.car_type ? `${item.type} · ${item.car_type}` : item.type,
    filterOptions: ['All', 'Passenger', 'Car', 'SUV', 'Truck', 'Motorcycle', 'Van', 'Bus', 'Other'],
    filterKey: 'type',
    emptyDefaults: { brand:'', model:'', size:'', type:'Passenger', car_type:'', price:'', cost_price:'', stock:'', low_stock_threshold:10, barcode:'' },
  },

  restaurant: {
    label: 'Restaurant',
    icon: FaUtensils,
    color: '#f97316',
    inventoryLabel: 'Menu',
    inventoryIcon: MdTableRestaurant,
    itemLabel: 'Menu Item',
    itemsLabel: 'Menu Items',
    salesLabel: 'Orders / POS',
    suppliersLabel: 'Suppliers',
    showTables: true,
    itemFields: [
      { key: 'name',     label: 'Item Name',    type: 'text',   required: true,  placeholder: 'e.g. Zinger Burger', fullWidth: true },
      { key: 'category', label: 'Category',     type: 'select', required: false,
        options: [
          'Burger','Pizza','BBQ & Grill','Fried Chicken','Shawarma & Wraps',
          'Biryani & Rice','Karahi & Curry','Pasta & Noodles',
          'Sandwich & Sub','Roll & Paratha',
          'Hot Coffee','Cold Coffee','Tea','Juices & Drinks','Milkshake','Smoothie',
          'Starters & Snacks','Soup','Salad',
          'Desserts & Ice Cream','Cake & Pastry',
          'Breakfast','Kids Meal','Family Deal','Other',
        ],
      },
      { key: 'size',      label: 'Size',         type: 'select', required: false,
        options: ['Regular','Small','Medium','Large','Extra Large','Full','Half','Single','Double','Triple'],
      },
      { key: 'price',     label: 'Sale Price',   type: 'number', required: true,  isCurrency: true },
      { key: 'cost',      label: 'Cost Price',   type: 'number', required: false, isCurrency: true },
      { key: 'available', label: 'Available',    type: 'select', required: false,
        options: ['1','0'], optionLabels: ['Yes — Available','No — Unavailable'],
      },
    ],
    itemName: (item) => item.name,
    itemSubtitle: (item) => [item.category, item.size].filter(Boolean).join(' · '),
    filterOptions: ['All', 'Burger', 'Pizza', 'BBQ & Grill', 'Fried Chicken', 'Hot Coffee', 'Cold Coffee', 'Juices & Drinks', 'Desserts & Ice Cream', 'Other'],
    filterKey: 'category',
    emptyDefaults: { name:'', category:'Burger', size:'Regular', price:'', cost:'', available:'1' },
  },

  general_store: {
    label: 'General Store',
    icon: FaStore,
    color: '#f97316',
    inventoryLabel: 'Products',
    inventoryIcon: MdInventory2,
    itemLabel: 'Product',
    itemsLabel: 'Products',
    salesLabel: 'Sales / POS',
    suppliersLabel: 'Suppliers',
    showTables: false,
    itemFields: [
      { key: 'name',                label: 'Product Name',     type: 'text',   required: true,  placeholder: 'e.g. Surf Excel 1kg' },
      { key: 'brand',               label: 'Brand',            type: 'text',   required: false, placeholder: 'e.g. Unilever' },
      { key: 'category',            label: 'Category',         type: 'select', required: false, 
        options: ['Grocery','Beverages','Dairy','Snacks','Cleaning','Personal Care','Other'],
        allowCustom: true },
      { key: 'barcode',             label: 'Barcode',          type: 'text',   required: false, placeholder: 'Optional' },
      { key: 'price',               label: 'Sale Price',       type: 'number', required: true,  isCurrency: true },
      { key: 'cost',                label: 'Cost Price',       type: 'number', required: false, isCurrency: true },
      { key: 'stock',               label: 'Stock Qty',        type: 'number', required: false },
      { key: 'low_stock_threshold', label: 'Low Stock Alert',  type: 'number', required: false },
    ],
    itemName: (item) => item.name,
    itemSubtitle: (item) => item.brand || item.category,
    filterOptions: ['All', 'Grocery', 'Beverages', 'Dairy', 'Snacks', 'Cleaning', 'Personal Care'],
    filterKey: 'category',
    emptyDefaults: { name:'', brand:'', category:'Grocery', barcode:'', price:'', cost:'', stock:'', low_stock_threshold:5 },
  },

  pharmacy: {
    label: 'Pharmacy',
    icon: FaCapsules,
    color: '#f97316',
    inventoryLabel: 'Medicines',
    inventoryIcon: MdMedication,
    itemLabel: 'Medicine',
    itemsLabel: 'Medicines',
    salesLabel: 'Sales / POS',
    suppliersLabel: 'Suppliers',
    showTables: false,
    itemFields: [
      { key: 'name',                label: 'Medicine Name',    type: 'text',   required: true,  placeholder: 'e.g. Panadol 500mg' },
      { key: 'generic_name',        label: 'Generic Name',     type: 'text',   required: false, placeholder: 'e.g. Paracetamol' },
      { key: 'company',             label: 'Company',          type: 'text',   required: false, placeholder: 'e.g. GSK' },
      { key: 'category',            label: 'Category',         type: 'select', required: false, options: ['Tablet','Syrup','Injection','Capsule','Cream','Drops','Other'], allowCustom: true },
      { key: 'barcode',             label: 'Barcode',          type: 'text',   required: false, placeholder: 'Optional' },
      { key: 'price',               label: 'Sale Price',       type: 'number', required: true,  isCurrency: true },
      { key: 'cost',                label: 'Cost Price',       type: 'number', required: false, isCurrency: true },
      { key: 'stock',               label: 'Stock Qty',        type: 'number', required: false },
      { key: 'low_stock_threshold', label: 'Low Stock Alert',  type: 'number', required: false },
      { key: 'expiry_date',         label: 'Expiry Date',      type: 'date',   required: false },
    ],
    itemName: (item) => item.name,
    itemSubtitle: (item) => item.generic_name || item.company,
    filterOptions: ['All', 'Tablet', 'Syrup', 'Injection', 'Capsule', 'Cream', 'Drops'],
    filterKey: 'category',
    emptyDefaults: { name:'', generic_name:'', company:'', category:'Tablet', barcode:'', price:'', cost:'', stock:'', low_stock_threshold:10, expiry_date:'' },
  },
};

// Custom categories management
const CUSTOM_CATEGORIES_KEY = 'custom_categories';

export const getCustomCategories = (businessType) => {
  try {
    const stored = localStorage.getItem(`${CUSTOM_CATEGORIES_KEY}_${businessType}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addCustomCategory = (businessType, category) => {
  try {
    const existing = getCustomCategories(businessType);
    if (!existing.includes(category)) {
      const updated = [...existing, category];
      localStorage.setItem(`${CUSTOM_CATEGORIES_KEY}_${businessType}`, JSON.stringify(updated));
      return updated;
    }
    return existing;
  } catch {
    return [];
  }
};

export const getConfig = (businessType) => {
  const config = BUSINESS_CONFIG[businessType] || BUSINESS_CONFIG.general_store;
  
  // Add custom categories to general store and pharmacy configs
  if (businessType === 'general_store' || businessType === 'pharmacy') {
    const customCategories = getCustomCategories(businessType);
    if (customCategories.length > 0) {
      const updatedConfig = { ...config };
      updatedConfig.itemFields = config.itemFields.map(field => {
        if (field.key === 'category') {
          return {
            ...field,
            options: [...field.options, ...customCategories.filter(cat => !field.options.includes(cat))]
          };
        }
        return field;
      });
      updatedConfig.filterOptions = [
        'All',
        ...config.filterOptions.slice(1),
        ...customCategories.filter(cat => !config.filterOptions.includes(cat))
      ];
      return updatedConfig;
    }
  }
  
  return config;
};


