// API Response Types for BARBUDDIE POS

// ==================== Auth ====================

export interface LoginRequest {
  email: string
  password: string
}

export interface PinLoginRequest {
  organizationId: string
  employeeId: string
  pin: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthenticatedUser {
  id: string
  email: string
  employeeId: string
  firstName: string
  lastName: string
  role: UserRole
  language: Language
  organizationId: string
}

// ==================== Users ====================

export type UserRole = 'OWNER' | 'MANAGER' | 'BARTENDER' | 'WAITER' | 'CASHIER'
export type Language = 'NL' | 'FR' | 'EN' | 'DE'

export interface User {
  id: string
  organizationId: string
  employeeId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  language: Language
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ==================== Products & Departments ====================

export type VatLabel = 'A' | 'B' | 'C' | 'D' | 'X'
export type QuantityType = 'PIECE' | 'KG' | 'LITER' | 'METER'

export interface Department {
  id: string
  organizationId: string
  departmentId: string
  name: string
  nameNl?: string
  nameFr?: string
  nameEn?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  products?: Product[]
}

export interface Product {
  id: string
  organizationId: string
  productId: string
  departmentId: string
  name: string
  nameNl?: string
  nameFr?: string
  nameEn?: string
  description?: string
  unitPrice: number
  quantityType: QuantityType
  vatLabel: VatLabel
  isOpenPrice: boolean
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ==================== Cost Centers ====================

export type CostCenterType = 'TABLE' | 'CHAIR' | 'ROOM' | 'CUSTOMER' | 'ON_HOLD' | 'KIOSK' | 'PLATFORM' | 'WEBSHOP'

export interface CostCenter {
  id: string
  organizationId: string
  costCenterId: string
  type: CostCenterType
  name: string
  capacity?: number
  area?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CostCenterWithOrders extends CostCenter {
  hasOpenOrders: boolean
  totalAmount: number
  orders: Order[]
}

// ==================== Orders ====================

export type OrderStatus = 'OPEN' | 'PREBILL_PRINTED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'
export type OrderLineStatus = 'ORDERED' | 'IN_PREPARATION' | 'PREPARED' | 'SERVED' | 'CANCELLED'
export type NegQuantityReason = 'REFUND' | 'COST_CENTER_CHANGE' | 'CORRECTION' | 'WASTE' | 'TRANSFER'

export interface OrderLine {
  id: string
  orderId: string
  productId: string
  organizationId: string
  quantity: number
  unitPrice: number
  lineTotal: number
  vatLabel: VatLabel
  vatPrice: number
  notes?: string
  status: OrderLineStatus
  negReason?: NegQuantityReason
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  organizationId: string
  orderReference: string
  costCenterId?: string
  userId: string
  terminalId: string
  bookingPeriodId: string
  status: OrderStatus
  notes?: string
  createdAt: string
  updatedAt: string
  orderLines: OrderLine[]
  costCenter?: CostCenter
  user?: User
}

export interface CreateOrderInput {
  costCenterId: string
  terminalId: string
  items: {
    productId: string
    quantity: number
    notes?: string
  }[]
}

// ==================== Sales ====================

export type TicketMedium = 'PAPER' | 'DIGITAL' | 'NONE'
export type PaymentType = 'CASH' | 'CARD_DEBIT' | 'CARD_CREDIT' | 'VOUCHER_MPV' | 'VOUCHER_SPV' | 'MEAL_VOUCHER' | 'ECO_VOUCHER' | 'MOBILE_PAYMENT' | 'OTHER'
export type InputMethod = 'MANUAL' | 'AUTOMATIC' | 'SCANNED'
export type AmountType = 'PAYMENT' | 'TIP' | 'ROUNDING' | 'MONEY_IN_OUT'

export interface Payment {
  id: string
  saleId: string
  paymentId: string
  name: string
  type: PaymentType
  inputMethod: InputMethod
  amount: number
  amountType: AmountType
  drawerId?: string
  drawerName?: string
  foreignAmount?: number
  foreignCurrency?: string
  createdAt: string
}

export interface SaleLine {
  id: string
  saleId: string
  productId: string
  organizationId: string
  productName: string
  departmentId: string
  departmentName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  vatLabel: VatLabel
  vatPrice: number
  negReason?: NegQuantityReason
  createdAt: string
}

export interface Sale {
  id: string
  organizationId: string
  posFiscalTicketNo: number
  orderId?: string
  userId: string
  terminalId: string
  bookingPeriodId: string
  ticketMedium: TicketMedium
  transactionTotal: number
  customerVatNo?: string
  invoiceNo?: string
  isRefund: boolean
  isTraining: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  saleLines: SaleLine[]
  payments: Payment[]
  user?: User
}

export interface CreateSaleInput {
  terminalId: string
  orderId?: string
  items: {
    productId: string
    quantity: number
  }[]
  payments: {
    id: string
    name: string
    type: PaymentType
    amount: number
    drawerId?: string
    drawerName?: string
  }[]
}

// ==================== Reports ====================

export interface ReportInput {
  terminalId: string
}

export interface GksSignResult {
  posId: string
  posFiscalTicketNo: number
  posDateTime: string
  terminalId: string
  deviceId: string
  fdmSwVersion: string
  eventOperation: string
  digitalSignature: string
  shortSignature: string
  verificationUrl?: string
  bufferCapacityUsed: number
  fdmRef: {
    fdmId: string
    fdmDateTime: string
    eventLabel: string
    eventCounter: number
    totalCounter: number
  }
  vatCalc?: {
    label: VatLabel
    rate: number
    taxableAmount: number
    vatAmount: number
    totalAmount: number
    outOfScope: boolean
  }[]
  warnings: { code: string; message: string }[]
  informations: { code: string; message: string }[]
  footer: string[]
}

// ==================== FDM ====================

export interface FdmStatus {
  initialized: boolean
  device: {
    bufferCapacityUsed: number
    fdmDateTime: string
    fdmId: string
    fdmSwVersion: string
  }
  errors: { code: string; message: string }[]
  warnings: { code: string; message: string }[]
  informations: { code: string; message: string }[]
}

// ==================== Terminals ====================

export type TerminalType = 'COMPUTER' | 'TABLET' | 'HANDHELD' | 'KIOSK'

export interface Terminal {
  id: string
  organizationId: string
  terminalId: string
  deviceId: string
  name: string
  type: TerminalType
  posId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
