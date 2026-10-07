// lib/i18n.ts — full bilingual dictionary (English / Urdu)

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    menu: 'Menu',
    deals: 'Deals',
    inventory: 'Inventory',
    clients: 'Clients',
    cashbook: 'Cashbook',
    employees: 'Employees',
    payroll: 'Payroll',
    settings: 'Settings',
    roles: 'Roles & Permissions',
    logout: 'Logout',

    // Actions
    addDish: 'Add Dish',
    addEmployee: 'Add Employee',
    addNotice: 'Add Notice',
    addRole: 'Add Role',
    addBooking: 'New Booking',
    refresh: 'Refresh',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    markPaid: 'Mark Paid',
    managePermissions: 'Manage Permissions',

    // Booking
    grandTotal: 'Grand Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    transportFee: 'Transport Fee',
    tax: 'Tax',
    advance: 'Advance',
    balance: 'Balance',
    eventDate: 'Event Date',
    eventTime: 'Event Time',
    venue: 'Venue',
    guestCount: 'Guest Count',
    status: 'Status',
    paymentStatus: 'Payment Status',
    clientName: 'Client Name',
    clientPhone: 'Client Phone',
    notes: 'Notes',

    // Payroll
    monthlySalary: 'Monthly Salary',
    joiningDate: 'Joining Date',
    salaryHistory: 'Salary History',
    salaryNotices: 'Salary Notices',
    payMonth: 'Pay Month',
    amount: 'Amount',
    paid: 'Paid',
    pending: 'Pending',
    bonus: 'Bonus',
    deduction: 'Deduction',
    notice: 'Notice',

    // Fields
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    active: 'Active',
    inactive: 'Inactive',
    description: 'Description',
    category: 'Category',
    unit: 'Unit',
    price: 'Price',
    quantity: 'Quantity',

    // Misc
    loading: 'Loading...',
    noData: 'No records found',
    search: 'Search',
    filter: 'Filter',
    total: 'Total',
    today: 'Today',
    thisMonth: 'This Month',
    close: 'Close',
    confirm: 'Confirm',
    switchToUrdu: 'اردو',
    switchToEnglish: 'English',
  },
  ur: {
    // Navigation
    dashboard: 'ڈیش بورڈ',
    bookings: 'بکنگ',
    menu: 'مینو',
    deals: 'ڈیلز',
    inventory: 'اسٹاک',
    clients: 'کلائنٹس',
    cashbook: 'کیش بک',
    employees: 'ملازمین',
    payroll: 'تنخواہ',
    settings: 'ترتیبات',
    roles: 'کردار اور اجازتیں',
    logout: 'لاگ آؤٹ',

    // Actions
    addDish: 'ڈش شامل کریں',
    addEmployee: 'ملازم شامل کریں',
    addNotice: 'اطلاع شامل کریں',
    addRole: 'کردار شامل کریں',
    addBooking: 'نئی بکنگ',
    refresh: 'ریفریش',
    save: 'محفوظ کریں',
    cancel: 'منسوخ',
    edit: 'ترمیم',
    delete: 'حذف کریں',
    view: 'دیکھیں',
    markPaid: 'ادا شدہ نشان',
    managePermissions: 'اجازتیں منظم کریں',

    // Booking
    grandTotal: 'کل رقم',
    subtotal: 'ذیلی رقم',
    discount: 'چھوٹ',
    transportFee: 'ٹرانسپورٹ فیس',
    tax: 'ٹیکس',
    advance: 'پیشگی',
    balance: 'بقایا',
    eventDate: 'تقریب کی تاریخ',
    eventTime: 'تقریب کا وقت',
    venue: 'مقام',
    guestCount: 'مہمان',
    status: 'حالت',
    paymentStatus: 'ادائیگی کی حالت',
    clientName: 'نام',
    clientPhone: 'فون',
    notes: 'نوٹس',

    // Payroll
    monthlySalary: 'ماہانہ تنخواہ',
    joiningDate: 'شمولیت کی تاریخ',
    salaryHistory: 'تنخواہ کی تاریخ',
    salaryNotices: 'تنخواہ اطلاعات',
    payMonth: 'تنخواہ مہینہ',
    amount: 'رقم',
    paid: 'ادا شدہ',
    pending: 'زیر التواء',
    bonus: 'بونس',
    deduction: 'کٹوتی',
    notice: 'اطلاع',

    // Fields
    name: 'نام',
    email: 'ای میل',
    phone: 'فون',
    role: 'کردار',
    active: 'فعال',
    inactive: 'غیر فعال',
    description: 'تفصیل',
    category: 'زمرہ',
    unit: 'اکائی',
    price: 'قیمت',
    quantity: 'مقدار',

    // Misc
    loading: 'لوڈ ہو رہا ہے...',
    noData: 'کوئی ریکارڈ نہیں ملا',
    search: 'تلاش',
    filter: 'فلٹر',
    total: 'کل',
    today: 'آج',
    thisMonth: 'اس مہینے',
    close: 'بند کریں',
    confirm: 'تصدیق',
    switchToUrdu: 'اردو',
    switchToEnglish: 'English',
  },
};

export type Language = 'en' | 'ur';
export type TranslationKey = keyof typeof translations['en'];

let currentLang: Language = 'en';

export const setLanguage = (lang: Language) => {
  currentLang = lang;
};

export const t = (key: TranslationKey): string => {
  return translations[currentLang][key] || translations['en'][key] || key;
};
