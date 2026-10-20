/* Generated from the backend's OpenAPI schema (javon FastAPI). Money is in tiyin. */

export type Page<T> = { items: T[]; total: number; page: number; size: number; pages: number };

export type AccessState = "trial" | "active" | "grace" | "expired" | "suspended";
export type AuthorOut = {
  id: number;
  name: string;
};
export type BookCard = {
  id: number;
  title: string;
  subtitle: string | null;
  authors: Array<AuthorOut>;
  publisher: PublisherOut | null;
  language: BookLanguage;
  script: BookScript;
  cover: Record<string, string> | null;
};
export type BookCreate = {
  isbn?: string | null;
  title: string;
  subtitle?: string | null;
  authors: Array<string>;
  publisher?: string | null;
  language?: BookLanguage;
  script?: BookScript | null;
  published_year?: number | null;
  pages?: number | null;
  description?: string | null;
  mxik_code?: string | null;
  package_code?: string | null;
};
export type BookLanguage = "uz" | "ru" | "en" | "other";
export type BookOut = {
  id: number;
  isbn13: string | null;
  title: string;
  subtitle: string | null;
  authors: Array<AuthorOut>;
  publisher: PublisherOut | null;
  language: BookLanguage;
  script: BookScript;
  published_year: number | null;
  pages: number | null;
  description: string | null;
  mxik_code: string | null;
  package_code: string | null;
  status: BookStatus;
  review_note: string | null;
  created_at: string;
  cover: Record<string, string> | null;
};
export type BookPage = {
  id: number;
  title: string;
  subtitle: string | null;
  authors: Array<AuthorOut>;
  publisher: PublisherOut | null;
  language: BookLanguage;
  script: BookScript;
  isbn13: string | null;
  published_year: number | null;
  pages: number | null;
  description: string | null;
  cover: Record<string, string> | null;
};
export type BookScript = "latn" | "cyrl" | "other";
export type BookStatus = "pending" | "approved" | "rejected";
export type BookUpdate = {
  isbn?: string | null;
  title?: string | null;
  subtitle?: string | null;
  authors?: Array<string> | null;
  publisher?: string | null;
  language?: BookLanguage | null;
  script?: BookScript | null;
  published_year?: number | null;
  pages?: number | null;
  description?: string | null;
  mxik_code?: string | null;
  package_code?: string | null;
};
export type BotConnectIn = {
  token: string;
};
export type BotOut = {
  username: string;
  status: BotStatus;
  last_error: string | null;
  bot_url: string;
  group_linked: boolean;
  group_title: string | null;
  group_link_url: string;
  mini_app_url: string;
};
export type BotStatus = "active" | "broken";
export type CardTransferOut = {
  card_number: string;
  card_holder: string;
  amount: number;
  hold_hours: number;
};
export type DayHours = {
  open: string;
  close: string;
};
export type DayStatsOut = {
  day: string;
  orders: number;
  sales: number;
};
export type DeliveryType = "pickup" | "delivery";
export type DevLoginIn = {
  telegram_id: number;
  first_name: string;
};
export type FacetEntity = {
  id: number;
  name: string;
  count: number;
};
export type FacetValue = {
  value: string;
  count: number;
};
export type FacetsOut = {
  total: number;
  languages: Array<FacetValue>;
  scripts: Array<FacetValue>;
  authors: Array<FacetEntity>;
  publishers: Array<FacetEntity>;
  price_min: number | null;
  price_max: number | null;
};
export type ImportStatus = "queued" | "running" | "done" | "failed";
export type InventoryImportOut = {
  id: number;
  status: ImportStatus;
  file_name: string;
  total_rows: number;
  processed_rows: number;
  report: Record<string, unknown> | null;
  quantity_mode: QuantityMode;
  created_at: string;
  finished_at: string | null;
};
/** Excel import: "add" the file's quantity to the shelf (a new delivery), or "set" it (a stock count). */
export type QuantityMode = "add" | "set";
export type InventoryItemCreate = {
  book_id: number;
  price: number;
  quantity?: number;
  is_visible?: boolean;
};
export type InventoryItemOut = {
  id: number;
  book: BookOut;
  price: number;
  quantity: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};
export type InventoryItemUpdate = {
  price?: number | null;
  quantity?: number | null;
  is_visible?: boolean | null;
};
export type InventorySort = "updated" | "title" | "quantity";
export type InventoryStatsOut = {
  items: number;
  visible: number;
  out_of_stock: number;
};
export type InviteCreatedOut = {
  id: number;
  url: string;
  expires_at: string;
};
export type InviteOut = {
  id: number;
  created_at: string;
  expires_at: string;
};
export type InvitePreviewOut = {
  store_name: string;
  store_slug: string;
  expires_at: string;
};
export type JobAdminOut = {
  id: number;
  kind: string;
  tenant_id: number | null;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
  finished_at: string | null;
};
export type JobKind = "inventory_import" | "order_created" | "order_status_changed" | "payment_proof_received" | "payment_reviewed" | "owner_notice";
export type JobStatus = "queued" | "running" | "done" | "failed";
export type JoinedStoreOut = {
  tenant_id: number;
  slug: string;
  name: string;
  role: MemberRole;
};
export type Lang = "uz" | "ru" | "en";
export type MeOut = {
  user: UserOut;
  stores: Array<MyStoreOut>;
};
export type MemberOut = {
  user_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  role: MemberRole;
  joined_at: string;
};
export type MemberRole = "owner" | "staff";
export type MyStoreOut = {
  tenant_id: number;
  slug: string;
  name: string;
  status: TenantStatus;
  role: MemberRole;
  launched_at: string | null;
  paused_at: string | null;
  access: AccessState;
};
export type OrderChannel = "web" | "telegram";
export type OrderCreate = {
  idempotency_key: string;
  customer_name: string;
  phone: string;
  delivery_type: DeliveryType;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  comment?: string | null;
  payment_method?: PaymentMethod;
  items: Array<OrderLineIn>;
};
export type OrderCreatedOut = {
  id: number;
  number: number;
  status: OrderStatus;
  customer_name: string;
  delivery_type: DeliveryType;
  address: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_note: string | null;
  cancel_reason: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  items: Array<OrderItemOut>;
  tracking_token: string;
  card_transfer?: CardTransferOut | null;
  telegram_link?: string | null;
  phone_masked: string;
};
export type OrderItemOut = {
  book_id: number;
  title: string;
  isbn13: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};
export type OrderLineIn = {
  book_id: number;
  quantity: number;
};
export type OrderListOut = {
  id: number;
  number: number;
  status: OrderStatus;
  channel: OrderChannel;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  total: number;
  payment_status: PaymentStatus;
  created_at: string;
};
export type OrderOut = {
  id: number;
  number: number;
  status: OrderStatus;
  channel: OrderChannel;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  total: number;
  payment_status: PaymentStatus;
  created_at: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  comment: string | null;
  subtotal: number;
  delivery_fee: number;
  payment_method: PaymentMethod;
  payment_note: string | null;
  paid_at: string | null;
  cancel_reason: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  items: Array<OrderItemOut>;
  has_payment_proof: boolean;
};
export type OrderStatsOut = {
  by_status: Record<string, number>;
};
export type OrderStatus = "new" | "accepted" | "shipping" | "completed" | "cancelled";
export type OrderStatusIn = {
  status: OrderStatus;
  reason?: string | null;
};
export type OrderTrackOut = {
  id: number;
  number: number;
  status: OrderStatus;
  customer_name: string;
  delivery_type: DeliveryType;
  address: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_note: string | null;
  cancel_reason: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  items: Array<OrderItemOut>;
  phone_masked: string;
};
export type OwnerOut = {
  user_id: number;
  telegram_id: number;
  first_name: string;
  username: string | null;
  phone: string | null;
};
export type PaymentMethod = "cash" | "card_transfer";
export type PaymentReviewIn = {
  approve: boolean;
  note?: string | null;
};
export type PaymentStatus = "unpaid" | "under_review" | "paid";

/** POST /storefront/{slug}/orders/statuses: the orders this browser remembers. */
export type OrderStatusOut = { id: number; number: number; status: OrderStatus; payment_status: PaymentStatus };
export type Plan = "start" | "standard" | "pro";
export type PlanOut = {
  plan: Plan;
  monthly_price: number;
  yearly_price: number;
  item_limit: number | null;
  staff_limit: number;
  excel_import: boolean;
};
export type PlansOut = {
  trial_days: number;
  plans: Array<PlanOut>;
};
export type PlatformMetricsOut = {
  stores: number;
  by_access: Record<string, number>;
  launched: number;
  new_stores_7d: number;
  new_stores_30d: number;
  active_stores_7d: number;
  orders_7d: number;
  orders_30d: number;
  sales_30d: number;
  paying_stores: number;
  revenue_30d: number;
  books_pending: number;
  jobs_failed: number;
  jobs_queued: number;
};
export type PlatformPaymentOut = {
  card_number: string | null;
  card_holder: string | null;
  support_telegram: string | null;
};
export type PublisherOut = {
  id: number;
  name: string;
};
export type RejectIn = {
  reason: string;
};
export type SitemapEntry = {
  book_id: number;
  updated_at: string;
};
export type SlugCheckOut = {
  slug: string;
  available: boolean;
  reason?: "invalid" | "reserved" | "taken" | null;
  suggestions?: Array<string>;
};
export type StockAdjustIn = {
  delta: number;
};
export type StoreStatsOut = {
  days: number;
  since: string;
  orders: number;
  by_status: Record<string, number>;
  by_channel: Record<string, number>;
  sales: number;
  completed_sales: number;
  average_order: number;
  customers: number;
  returning_customers: number;
  by_day: Array<DayStatsOut>;
  top_books: Array<TopBookOut>;
  inventory: InventoryStatsOut;
};
export type StorefrontItemOut = {
  book: BookCard;
  price: number;
  in_stock: boolean;
};
export type StorefrontItemPageOut = {
  book: BookPage;
  price: number;
  similar?: Array<StorefrontItemOut>;
  in_stock: boolean;
};
export type StorefrontOut = {
  slug: string;
  name: string;
  theme: string;
  accent_color: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: Record<string, DayHours | null> | null;
  telegram_username: string | null;
  instagram_username: string | null;
  languages: Array<Lang>;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_fee: number;
  free_delivery_from: number | null;
  delivery_area: string | null;
  cash_enabled: boolean;
  card_transfer_enabled: boolean;
  logo: Record<string, string> | null;
};
export type StorefrontSort = "relevance" | "new" | "price_asc" | "price_desc" | "title";
export type SubscriptionOut = {
  plan: Plan;
  status: TenantStatus;
  state: AccessState;
  trial_ends_at: string | null;
  paid_until: string | null;
  access_until: string | null;
  closes_at: string | null;
  suspended_reason: string | null;
  items_used: number;
  item_limit: number | null;
  staff_used: number;
  staff_limit: number;
  plans: Array<PlanOut>;
  pay_to: PlatformPaymentOut;
  payments: Array<SubscriptionPaymentOut>;
};
export type SubscriptionPaymentIn = {
  plan: Plan;
  months: number;
  amount?: number | null;
  note?: string | null;
};
export type SubscriptionPaymentOut = {
  id: number;
  plan: Plan;
  months: number;
  amount: number;
  period_start: string;
  period_end: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
};
export type SubscriptionUpdate = {
  plan?: Plan | null;
  trial_ends_at?: string | null;
  paid_until?: string | null;
};
export type SuspendIn = {
  reason: string;
};
export type TelegramLoginIn = {
  id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  auth_date: number;
  hash: string;
};
export type TenantAdminDetailOut = {
  id: number;
  slug: string;
  name: string;
  status: TenantStatus;
  access: AccessState;
  plan: Plan;
  trial_ends_at: string | null;
  paid_until: string | null;
  suspended_reason: string | null;
  launched_at: string | null;
  created_at: string;
  owner: OwnerOut | null;
  orders_30d: number;
  sales_30d: number;
  last_order_at: string | null;
  items: number;
  staff: number;
  bot_username: string | null;
  bot_group_linked: boolean;
  payments: Array<SubscriptionPaymentOut>;
};
export type TenantAdminOut = {
  id: number;
  slug: string;
  name: string;
  status: TenantStatus;
  access: AccessState;
  plan: Plan;
  trial_ends_at: string | null;
  paid_until: string | null;
  suspended_reason: string | null;
  launched_at: string | null;
  created_at: string;
  owner: OwnerOut | null;
  orders_30d: number;
  sales_30d: number;
  last_order_at: string | null;
};
export type TenantCreate = {
  name: string;
  slug: string;
};
export type TenantOut = {
  slug: string;
  name: string;
  theme: string;
  accent_color: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: Record<string, DayHours | null> | null;
  telegram_username: string | null;
  instagram_username: string | null;
  languages: Array<Lang>;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_fee: number;
  free_delivery_from: number | null;
  delivery_area: string | null;
  cash_enabled: boolean;
  card_transfer_enabled: boolean;
  id: number;
  card_number: string | null;
  card_holder: string | null;
  status: TenantStatus;
  plan: Plan;
  trial_ends_at: string | null;
  launched_at: string | null;
  paused_at: string | null;
  created_at: string;
  updated_at: string;
  logo: Record<string, string> | null;
};
export type TenantStatus = "trial" | "active" | "suspended";
export type TenantUpdate = {
  name?: string | null;
  theme?: string | null;
  accent_color?: string | null;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  working_hours?: Record<string, DayHours | null> | null;
  telegram_username?: string | null;
  instagram_username?: string | null;
  languages?: Array<Lang> | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  delivery_fee?: number | null;
  free_delivery_from?: number | null;
  delivery_area?: string | null;
  cash_enabled?: boolean | null;
  card_transfer_enabled?: boolean | null;
  card_number?: string | null;
  card_holder?: string | null;
};
export type TopBookOut = {
  book_id: number;
  title: string;
  quantity: number;
  sales: number;
};
export type UserAdminOut = {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  language: string;
  is_platform_admin: boolean;
  telegram_id: number;
  max_stores: number;
  is_active: boolean;
  created_at: string;
};
export type UserAdminUpdate = {
  max_stores: number;
};
export type UserOut = {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  language: string;
  is_platform_admin: boolean;
};
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
