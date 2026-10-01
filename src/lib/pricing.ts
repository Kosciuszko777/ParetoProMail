/**
 * Pareto Pro Mail — Pricing Architecture
 *
 * Philosophy: WE CHARGE FOR INFRASTRUCTURE — NOT OWNERSHIP.
 *
 * Plans are NOT primarily scaled by subscriber count. Three axes are separated:
 *   FEATURES (plan tier) · USAGE (email / audience boosts) · INFRASTRUCTURE (relays, IP, vault).
 *
 * All CHF prices live here so they can be adjusted in one place (or wired to a
 * backend later). Prices marked `configurable` are placeholders.
 */

export const CURRENCY = 'CHF';

/** Annual billing discount applied to base software plans only. */
export const ANNUAL_DISCOUNT = 0.2; // 20%

// ─── Primary plan tiers ──────────────────────────────────────────────────────

export type PlanId = 'free' | 'creator' | 'pro' | 'business' | 'sovereign';

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in CHF. null = custom. */
  priceMonthly: number | null;
  /** Prefix like "from" for ranged pricing. */
  pricePrefix?: string;
  tagline: string;
  designedFor: string[];
  /** Feature groups. `inheritsFrom` shows "Everything in X, plus:". */
  inheritsFrom?: string;
  features: string[];
  cta: string;
  supporting: string;
  badge?: string;
}

export const PLANS: Record<'free' | 'creator' | 'pro', Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    tagline: 'Start sovereign.',
    designedFor: ['New writers', 'Independent creators', 'Nostr users', 'Small communities', 'New publications'],
    features: [
      'Up to 5,000 contacts',
      '1 publication',
      '1 user',
      'Nostr keypair identity',
      'No phone required',
      'No mandatory email identity',
      'Pseudonymous publishing possible',
      'Encrypted Audience Vault',
      'Subscriber import',
      'Full subscriber export',
      'Basic email campaigns',
      'Nostr publishing',
      'Public web publication',
      'RSS',
      'Basic newsletter editor',
      'Basic templates',
      'Signup forms',
      'Basic segmentation',
      'Basic analytics',
      'Fiat payment integration',
      'Bitcoin / Lightning payment integration',
      'Referral program',
      'Basic relay distribution',
      'Pareto branding',
    ],
    cta: 'Start Free',
    supporting: 'No credit card required.',
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    priceMonthly: 9,
    tagline: 'Build your audience.',
    designedFor: ['Writers', 'Creators', 'Researchers', 'Consultants', 'Small publications', 'Independent professionals'],
    inheritsFrom: 'Free',
    features: [
      'Higher email sending allowance',
      'Custom domain',
      'Remove Pareto branding',
      'Full template library',
      'Brand Kit',
      'Reusable Smart Blocks',
      'Advanced forms',
      'Audience segmentation',
      'Scheduled publishing',
      'Basic automation',
      'Multiple Nostr relays',
      'Paid newsletters',
      'Paid articles',
      'Memberships',
      'Fiat subscriptions',
      'Bitcoin / Lightning subscriptions',
      'Tips',
      'Zaps',
      'Referral analytics',
      'Revenue dashboard',
    ],
    cta: 'Go Creator',
    supporting: 'Everything you need to build an independent publication.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 15,
    tagline: 'Run your publication.',
    badge: 'Most Popular',
    designedFor: ['Professional newsletters', 'Independent media', 'Analysts', 'Professional writers', 'Research publications', 'Bitcoin/Nostr projects', 'Small organizations'],
    inheritsFrom: 'Creator',
    features: [
      'Advanced segmentation',
      'Advanced automation',
      'A/B testing',
      'Advanced analytics',
      'Revenue analytics',
      'Subscriber attribution',
      'Advanced referral system',
      'API',
      'Webhooks',
      'Custom SMTP',
      'Advanced relay management',
      'Multiple publications',
      '3 users',
      'Team permissions',
      'Advanced migration tools',
      'Advanced payment integrations',
      'Priority sending',
      'Priority support',
      'Nostr-native subscriber tools',
      'Future Nostr-native mail delivery',
    ],
    cta: 'Go Pro',
    supporting: 'The complete sovereign publishing stack.',
  },
};

export const BUSINESS_PLAN: Plan = {
  id: 'business',
  name: 'Business',
  priceMonthly: 450,
  pricePrefix: 'from',
  tagline: 'Shielded communications infrastructure.',
  designedFor: [],
  inheritsFrom: 'Pro',
  features: [
    'Large audience capacity',
    'High-volume email distribution',
    '10 users',
    'Advanced roles and permissions',
    'Multiple publications',
    'Multiple domains',
    'Advanced Audience Vault',
    'Enhanced encryption controls',
    'Advanced access management',
    'Audit logs',
    'Advanced automation',
    'Advanced API',
    'Advanced webhooks',
    'Advanced backup',
    'Advanced export',
    'White-label publishing',
    'Advanced payment infrastructure',
    'Advanced referral management',
    'Ambassador management',
    'Migration concierge',
    'Priority technical support',
    'Infrastructure monitoring',
    'Security dashboard',
    'Optional dedicated IP',
    'Optional private Nostr relay',
    'Optional dedicated relay cluster',
    'Optional dedicated sending infrastructure',
    'Optional data residency',
    'Optional dedicated storage',
  ],
  cta: 'Explore Business',
  supporting: 'For organizations that cannot afford to lose control of their audience.',
};

export const SOVEREIGN_PLAN: Plan = {
  id: 'sovereign',
  name: 'Sovereign',
  priceMonthly: null,
  tagline: 'Own the infrastructure.',
  designedFor: [],
  features: [
    'Dedicated deployment',
    'Dedicated database',
    'Dedicated Audience Vault',
    'Dedicated encryption architecture',
    'Customer-controlled encryption keys',
    'Dedicated SMTP infrastructure',
    'Dedicated IP pool',
    'Dedicated Nostr relay',
    'Private relay cluster',
    'Customer-controlled relay',
    'Geographically distributed relays',
    'Customer-controlled domains',
    'Custom authentication',
    'SSO',
    'Custom access controls',
    'Custom API',
    'Custom webhooks',
    'Custom backup architecture',
    'Custom data residency',
    'Custom retention policies',
    'Custom payment architecture',
    'Custom fiat integrations',
    'Custom Bitcoin / Lightning infrastructure',
    'Large teams',
    'Sub-organizations',
    'Custom migration engineering',
    'SLA',
    'Dedicated technical contact',
    'Dedicated account management',
    'Custom monitoring',
    'Potential self-hosting',
    'Potential on-premise deployment',
  ],
  cta: 'Build Your Infrastructure',
  supporting: 'Your identity. Your audience. Your infrastructure.',
};

// ─── Business use-case cards ───────────────────────────────────────────────────

export const BUSINESS_USE_CASES: string[] = [
  'Family Offices',
  'Law Firms',
  'Fiduciaries',
  'Accountants',
  'Asset Managers',
  'Investment Research',
  'Independent Media',
  'Private Membership Networks',
  'Research Organizations',
  'Bitcoin & Nostr Companies',
];

// ─── Add-on marketplace ────────────────────────────────────────────────────────

export interface AddOn {
  id: string;
  icon: string; // lucide icon name (resolved in component)
  name: string;
  copy: string;
  badge?: string;
  /** Package options shown as pills. */
  packages?: string[];
  /** Feature bullets. */
  features?: string[];
  /** "from" price in CHF (configurable placeholder). */
  fromPrice?: number;
  cta: string;
  positioning?: string;
}

export const ADD_ONS: AddOn[] = [
  {
    id: 'email-boost',
    icon: 'Mail',
    name: 'Email Boost',
    copy: 'Increase monthly email distribution without changing your plan.',
    packages: ['+10,000 emails', '+50,000 emails', '+100,000 emails', '+500,000 emails', '+1,000,000 emails'],
    fromPrice: 6,
    cta: 'Add Email Boost',
  },
  {
    id: 'audience-boost',
    icon: 'Users',
    name: 'Audience Boost',
    copy: 'Increase encrypted audience capacity without upgrading your entire account.',
    packages: ['+5,000 contacts', '+10,000 contacts', '+50,000 contacts', '+100,000 contacts', '+500,000 contacts'],
    fromPrice: 5,
    cta: 'Add Audience Boost',
  },
  {
    id: 'private-relay',
    icon: 'RadioTower',
    name: 'Private Relay',
    badge: 'Pareto Special',
    copy: 'Add a dedicated Nostr relay to your publication infrastructure.',
    features: [
      'Dedicated relay endpoint',
      'Controlled access',
      'Publisher-controlled policies',
      'Encrypted/private event capability where supported',
      'Relay health monitoring',
      'Automatic backup',
      'Public/private routing controls',
      'Relay statistics',
      'Export capability',
      'Optional custom domain (relay.yourdomain.com)',
    ],
    fromPrice: 29,
    cta: 'Add Private Relay',
    positioning: 'Your publication. Your relay.',
  },
  {
    id: 'relay-redundancy',
    icon: 'Network',
    name: 'Relay Redundancy',
    copy: 'Automatically distribute signed publications across multiple independent Nostr relays.',
    packages: ['3 relay redundancy', '5 relay redundancy', '10 relay redundancy', 'Custom relay network'],
    features: ['Relay health score', 'Uptime', 'Latency', 'Last sync', 'Geographic distribution'],
    fromPrice: 12,
    cta: 'Increase Redundancy',
  },
  {
    id: 'dedicated-ip',
    icon: 'Server',
    name: 'Dedicated Sending IP',
    copy: 'Take greater control over your email sending reputation.',
    features: [
      'Dedicated IP',
      'Domain authentication',
      'IP reputation monitoring',
      'Warm-up assistance',
      'Deliverability dashboard',
      'SPF/DKIM/DMARC guidance',
    ],
    fromPrice: 49,
    cta: 'Add Dedicated IP',
    positioning: 'Available primarily for high-volume professional senders.',
  },
  {
    id: 'vault-plus',
    icon: 'ShieldCheck',
    name: 'Vault+',
    badge: 'Pareto Special',
    copy: 'Enhanced protection for high-confidence subscriber databases.',
    features: [
      'Enhanced encryption controls',
      'Separate encryption domains',
      'Customer-controlled keys',
      'Advanced backup',
      'Encrypted exports',
      'Access logs',
      'Role-based vault access',
      'Data retention controls',
      'Optional geographic storage selection',
    ],
    fromPrice: 39,
    cta: 'Upgrade Your Vault',
    positioning: 'For family offices, law firms, investment firms, research organizations & private communities.',
  },
  {
    id: 'extra-publication',
    icon: 'BookOpen',
    name: 'Additional Publication',
    copy: 'Run another independent publication from the same Pareto account.',
    features: [
      'Own identity',
      'Own branding',
      'Own domain',
      'Own subscriber segments',
      'Own analytics',
      'Own payment settings',
      'Own relay configuration',
    ],
    fromPrice: 8,
    cta: 'Add Publication',
  },
  {
    id: 'team-seat',
    icon: 'UserPlus',
    name: 'Team Member',
    copy: 'Add additional users without changing plans where permitted.',
    features: ['Owner', 'Administrator', 'Editor', 'Author', 'Analyst', 'Billing', 'Developer', 'Audience Manager'],
    fromPrice: 7,
    cta: 'Add Team Member',
  },
  {
    id: 'automation-plus',
    icon: 'Workflow',
    name: 'Automation+',
    copy: 'Add advanced automation capacity.',
    features: [
      'More workflows',
      'More automation events',
      'Advanced conditions',
      'Payment triggers',
      'Nostr triggers',
      'Webhook triggers',
      'Custom workflow templates',
    ],
    fromPrice: 14,
    cta: 'Add Automation+',
  },
  {
    id: 'analytics-plus',
    icon: 'BarChart3',
    name: 'Analytics+',
    copy: 'Professional insights without building an advertising profile of your readers.',
    features: [
      'Advanced aggregate analytics',
      'Campaign comparison',
      'Subscriber cohort analysis',
      'Revenue attribution',
      'Referral attribution',
      'Growth analysis',
      'Deliverability analytics',
      'Nostr engagement',
      'Custom reports',
      'Exportable reports',
    ],
    fromPrice: 12,
    cta: 'Add Analytics+',
    positioning: 'Privacy-first by default.',
  },
  {
    id: 'payment-plus',
    icon: 'CreditCard',
    name: 'Payment+',
    badge: 'Fiat + Bitcoin',
    copy: 'Turn your publication into a paid membership business.',
    features: [
      'Fiat subscriptions',
      'Credit/debit cards',
      'Bitcoin Lightning',
      'One-time payments',
      'Paid articles',
      'Membership tiers',
      'Donations',
      'Tips',
      'Zaps',
      'Payment-triggered access',
      'Revenue analytics',
    ],
    fromPrice: 9,
    cta: 'Enable Payment+',
    positioning: 'Your money doesn’t sit with us — funds flow directly through your connected payment infrastructure.',
  },
  {
    id: 'lightning-plus',
    icon: 'Zap',
    name: 'Lightning+',
    badge: 'Non-Custodial',
    copy: 'Professional Bitcoin-native monetization.',
    features: [
      'Lightning Address',
      'LNURL',
      'NWC',
      'Zaps',
      'Recurring payment authorization where supported',
      'Payment verification',
      'Membership access',
      'Referral payouts',
      'Publisher wallet connection',
    ],
    fromPrice: 9,
    cta: 'Enable Lightning+',
  },
  {
    id: 'migration-concierge',
    icon: 'MoveRight',
    name: 'Migration Concierge',
    copy: 'Move without losing your audience. Professional migration from Substack, Brevo, Mailchimp, Beehiiv, Ghost, generic CSV & more.',
    features: [
      'Audience import',
      'Tag mapping',
      'Template migration',
      'Domain setup',
      'Publication import',
      'Payment migration assistance where possible',
      'Redirect guidance',
      'Deliverability setup',
      'Nostr identity setup',
    ],
    cta: 'Request Migration',
  },
  {
    id: 'shielded-backup',
    icon: 'DatabaseBackup',
    name: 'Shielded Backup',
    copy: 'Create independent encrypted backups of your critical publication assets.',
    features: [
      'Subscriber vault',
      'Content',
      'Templates',
      'Configuration',
      'Payment records',
      'Relay configuration',
      'Analytics exports',
      'Manual & scheduled backup',
      'Encrypted download',
      'External storage target where supported',
    ],
    fromPrice: 11,
    cta: 'Add Shielded Backup',
  },
  {
    id: 'custom-relay-domain',
    icon: 'Globe',
    name: 'Custom Relay Domain',
    copy: 'Your relay. Your domain. Connect your organization’s domain to its dedicated/private Nostr relay infrastructure (e.g. relay.publisher.com).',
    cta: 'Connect Domain',
  },
];

// ─── Configurator add-on modules (checkbox infrastructure) ────────────────────

export interface ConfigModule {
  id: string;
  label: string;
  priceMonthly: number; // CHF
}

export const CONFIG_MODULES: ConfigModule[] = [
  { id: 'private-relay', label: 'Private Relay', priceMonthly: 29 },
  { id: 'relay-redundancy', label: 'Relay Redundancy', priceMonthly: 12 },
  { id: 'dedicated-ip', label: 'Dedicated Email IP', priceMonthly: 49 },
  { id: 'vault-plus', label: 'Vault+', priceMonthly: 39 },
  { id: 'shielded-backup', label: 'Shielded Backup', priceMonthly: 11 },
  { id: 'extra-publication', label: 'Additional Publication', priceMonthly: 8 },
  { id: 'team-seat', label: 'Additional Team Member', priceMonthly: 7 },
  { id: 'payment-plus', label: 'Payment+', priceMonthly: 9 },
  { id: 'lightning-plus', label: 'Lightning+', priceMonthly: 9 },
  { id: 'analytics-plus', label: 'Analytics+', priceMonthly: 12 },
];

/** Configurator base plan options. */
export const CONFIG_BASE_PLANS: Array<{ id: PlanId; label: string; priceMonthly: number }> = [
  { id: 'free', label: 'Free', priceMonthly: 0 },
  { id: 'creator', label: 'Creator', priceMonthly: 9 },
  { id: 'pro', label: 'Pro', priceMonthly: 15 },
  { id: 'business', label: 'Business', priceMonthly: 450 },
];

/** Audience size tiers → monthly usage cost in CHF (configurable). */
export const CONFIG_AUDIENCE: Array<{ label: string; priceMonthly: number }> = [
  { label: '5K', priceMonthly: 0 },
  { label: '10K', priceMonthly: 5 },
  { label: '25K', priceMonthly: 12 },
  { label: '50K', priceMonthly: 22 },
  { label: '100K', priceMonthly: 40 },
  { label: '250K', priceMonthly: 90 },
  { label: '500K', priceMonthly: 160 },
  { label: '1M+', priceMonthly: 300 },
];

/** Monthly email volume → monthly usage cost in CHF (configurable). */
export const CONFIG_EMAIL: Array<{ label: string; priceMonthly: number }> = [
  { label: '10K', priceMonthly: 0 },
  { label: '25K', priceMonthly: 6 },
  { label: '50K', priceMonthly: 12 },
  { label: '100K', priceMonthly: 22 },
  { label: '250K', priceMonthly: 48 },
  { label: '500K', priceMonthly: 85 },
  { label: '1M', priceMonthly: 150 },
];

// ─── Bundles ───────────────────────────────────────────────────────────────────

export interface Bundle {
  id: string;
  name: string;
  components: string[];
  tagline: string;
  accent?: boolean;
}

export const BUNDLES: Bundle[] = [
  {
    id: 'creator-stack',
    name: 'Creator Stack',
    components: ['Creator plan', 'Payment+', 'Advanced templates', 'Referral tools'],
    tagline: 'Turn your audience into an independent publishing business.',
  },
  {
    id: 'shielded-stack',
    name: 'Shielded Stack',
    components: ['Pro plan', 'Vault+', 'Private Relay', 'Shielded Backup'],
    tagline: 'For sensitive audiences and high-confidence communications.',
    accent: true,
  },
  {
    id: 'media-stack',
    name: 'Media Stack',
    components: ['Pro or Business', 'Email Boost', 'Audience Boost', 'Payment+', 'Analytics+', 'Relay Redundancy'],
    tagline: 'Scale reach without surrendering ownership.',
  },
  {
    id: 'bitcoin-stack',
    name: 'Bitcoin Stack',
    components: ['Pro', 'Lightning+', 'Private Relay', 'Relay Redundancy'],
    tagline: 'Nostr-native publishing and Bitcoin-native monetization.',
    accent: true,
  },
  {
    id: 'business-shield',
    name: 'Business Shield',
    components: ['Business', 'Dedicated IP', 'Private Relay', 'Vault+', 'Shielded Backup', 'Migration Concierge'],
    tagline: 'Professional communications infrastructure with fewer external dependencies.',
  },
];

// ─── Special solutions ─────────────────────────────────────────────────────────

export interface SpecialSolution {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  points: string[];
  cta: string;
  disclaimer?: string;
}

export const SPECIAL_SOLUTIONS: SpecialSolution[] = [
  {
    id: 'family-office',
    icon: 'Shield',
    name: 'Pareto for Family Offices',
    tagline: 'Your network should not become somebody else’s dataset.',
    points: [
      'Shielded distribution',
      'Encrypted audience',
      'Private relay',
      'Dedicated IP',
      'Private publication',
      'Role-based access',
      'Audit logs',
      'Direct payment infrastructure',
      'Controlled analytics',
      'Custom domains',
      'No advertising profiles',
      'Full export',
      'Optional dedicated infrastructure',
    ],
    cta: 'Build Private Communications',
  },
  {
    id: 'legal',
    icon: 'Scale',
    name: 'Pareto for Professional Advisers',
    tagline: 'Professional communication without surveillance marketing.',
    points: [
      'Controlled subscriber database',
      'Minimal data collection',
      'Encrypted audience storage',
      'Team permissions',
      'Private publications',
      'Private relay option',
      'Dedicated sending infrastructure',
      'Audit logs',
      'Data export',
      'Client-controlled infrastructure options',
    ],
    cta: 'Talk to Us',
    disclaimer: 'We make no claim of attorney-client privilege or specific legal/regulatory compliance.',
  },
  {
    id: 'media',
    icon: 'Newspaper',
    name: 'Pareto for Independent Media',
    tagline: 'Build an audience no platform can take away.',
    points: [
      'Large subscriber lists',
      'Email distribution',
      'Nostr publishing',
      'Multi-relay redundancy',
      'Paid subscriptions',
      'Bitcoin / Lightning',
      'Fiat payments',
      'Referral engine',
      'Ambassador system',
      'Multiple authors',
      'Multiple publications',
      'Web publishing',
      'Full export',
      'Censorship-resistant public distribution',
    ],
    cta: 'Start Publishing',
  },
  {
    id: 'research',
    icon: 'LineChart',
    name: 'Pareto for Research',
    tagline: 'Control who receives your intelligence — and how it travels.',
    points: [
      'Paid research',
      'Private subscriber groups',
      'Segmented distribution',
      'Research archive',
      'Private publications',
      'Payment-gated access',
      'Fiat subscriptions',
      'Lightning subscriptions',
      'Private relay',
      'Advanced analytics',
      'Team permissions',
      'API',
    ],
    cta: 'Talk to Us',
  },
  {
    id: 'open-network',
    icon: 'Bitcoin',
    name: 'Pareto for the Open Network',
    tagline: 'Email reach. Nostr sovereignty. Bitcoin payments.',
    points: [
      'npub identity',
      'NIP-05 identity',
      'Nostr-native signup',
      'Relay distribution',
      'Private relays',
      'Lightning',
      'NWC architecture',
      'Zaps',
      'Fiat fallback',
      'Email bridge',
      'Future Nostr-native mail',
    ],
    cta: 'Start Free',
  },
];

// ─── Referral economics ────────────────────────────────────────────────────────

export const REFERRAL_TIERS = [
  { year: 'Year 1', rate: '25%', note: 'recurring' },
  { year: 'Year 2', rate: '10%', note: 'recurring' },
  { year: 'Year 3+', rate: '5%', note: 'recurring' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function formatCHF(amount: number): string {
  return `${CURRENCY} ${amount.toLocaleString('de-CH')}`;
}

export function annualMonthly(monthly: number): number {
  return Math.round(monthly * (1 - ANNUAL_DISCOUNT));
}
