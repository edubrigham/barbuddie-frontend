// API Endpoints for BARBUDDIE POS

export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    pin: '/auth/pin',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },

  // Users
  users: {
    list: '/users',
    byId: (id: string) => `/users/${id}`,
  },

  // Organizations
  organizations: {
    current: '/organizations/current',
    gksConfig: '/organizations/current/gks-config',
  },

  // Products
  products: {
    list: '/products',
    grouped: '/products/grouped',
    byId: (id: string) => `/products/${id}`,
  },

  // Departments
  departments: {
    list: '/departments',
    byId: (id: string) => `/departments/${id}`,
    products: (id: string) => `/departments/${id}/products`,
  },

  // Orders
  orders: {
    list: '/orders',
    create: '/orders',
    byId: (id: string) => `/orders/${id}`,
    byCostCenter: (costCenterId: string) => `/orders/cost-center/${costCenterId}`,
  },

  // Sales
  sales: {
    list: '/sales',
    create: '/sales',
    byId: (id: string) => `/sales/${id}`,
    byTicket: (ticketNo: number) => `/sales/ticket/${ticketNo}`,
  },

  // Cost Centers / Tables
  costCenters: {
    list: '/cost-centers',
    tables: '/cost-centers/tables',
    tablesWithOrders: '/cost-centers/tables/with-orders',
    byId: (id: string) => `/cost-centers/${id}`,
    checkTableNumber: '/cost-centers/check-table-number',
    generateTableNumber: '/cost-centers/generate-table-number',
    syncFloorPlan: '/cost-centers/sync-floor-plan',
    floorPlans: '/cost-centers/floor-plans/all',
    floorPlanByArea: (areaName: string) => `/cost-centers/floor-plan/${encodeURIComponent(areaName)}`,
  },

  // Reports
  reports: {
    turnoverX: '/reports/turnover/x',
    turnoverZ: '/reports/turnover/z',
    userX: '/reports/user/x',
    userZ: '/reports/user/z',
  },

  // FDM
  fdm: {
    status: '/fdm/status',
  },

  // Terminals
  terminals: {
    list: '/terminals',
    byId: (id: string) => `/terminals/${id}`,
  },
} as const
