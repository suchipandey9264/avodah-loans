// Loan products, employment types and the lender catalogue used by the search flow.
// NOTE: rates, limits and features below are indicative SAMPLE data for the UI.
// Replace with live lender data from the backend before launch.

const L = 1e5;
const CR = 1e7;

export const LOAN_TYPES = [
  { id: "home", label: "Home Loan", short: "Home", icon: "House", from: 7.35, tagline: "Buy, build or renovate your home", amounts: [10 * L, 25 * L, 35 * L, 50 * L, 75 * L, 1 * CR, 2 * CR], defaultAmount: 35 * L, tenures: [5, 10, 15, 20, 25, 30], defaultTenure: 20, min: 5 * L, max: 10 * CR },
  { id: "lap", label: "Loan Against Property", short: "Against Property", icon: "Building2", from: 9.2, tagline: "Unlock the value of property you own", amounts: [10 * L, 25 * L, 50 * L, 1 * CR, 2 * CR], defaultAmount: 25 * L, tenures: [5, 10, 15], defaultTenure: 10, min: 5 * L, max: 10 * CR },
  { id: "personal", label: "Personal Loan", short: "Personal", icon: "User", from: 10.15, tagline: "Instant funds, no collateral", amounts: [1 * L, 3 * L, 5 * L, 10 * L, 25 * L], defaultAmount: 5 * L, tenures: [1, 2, 3, 4, 5], defaultTenure: 3, min: 50_000, max: 40 * L },
  { id: "education", label: "Education Loan", short: "Education", icon: "GraduationCap", from: 8.15, tagline: "Study in India or abroad", amounts: [5 * L, 10 * L, 20 * L, 40 * L, 75 * L], defaultAmount: 20 * L, tenures: [5, 7, 10, 15], defaultTenure: 10, min: 1 * L, max: 1.5 * CR },
  { id: "gold", label: "Gold Loan", short: "Gold", icon: "Coins", from: 8.75, tagline: "Funds against your gold in minutes", amounts: [50_000, 1 * L, 3 * L, 5 * L, 10 * L], defaultAmount: 1 * L, tenures: [1, 2, 3], defaultTenure: 1, min: 10_000, max: 1 * CR },
  { id: "business", label: "Business Loan", short: "Business", icon: "Briefcase", from: 10.4, tagline: "Working capital & expansion", amounts: [5 * L, 10 * L, 25 * L, 50 * L, 1 * CR], defaultAmount: 10 * L, tenures: [1, 2, 3, 4, 5], defaultTenure: 3, min: 1 * L, max: 5 * CR },
  { id: "car", label: "Car Loan", short: "Car", icon: "Car", from: 8.7, tagline: "New or used — drive home sooner", amounts: [3 * L, 5 * L, 8 * L, 12 * L, 20 * L], defaultAmount: 8 * L, tenures: [1, 3, 5, 7], defaultTenure: 5, min: 1 * L, max: 1 * CR },
];

export const loanById = (id) => LOAN_TYPES.find((t) => t.id === id) ?? LOAN_TYPES[0];

// `group` maps each profile to the eligibility / document checklist lenders use.
export const EMPLOYMENT = [
  { id: "salaried", group: "salaried", label: "Salaried", desc: "Fixed monthly salary from a private company or MNC", icon: "Briefcase", incomeLabel: "Net annual income (take-home)", docs: ["Last 3 months’ salary slips", "Form 16", "6 months’ bank statement"] },
  { id: "govt", group: "salaried", label: "Government / PSU employee", desc: "Central, state, defence, PSU or public bank job", icon: "Landmark", incomeLabel: "Net annual income (take-home)", docs: ["Salary slips", "Employee ID card", "6 months’ bank statement"] },
  { id: "business", group: "self", label: "Self-employed business", desc: "I run my own business, shop or trading firm", icon: "Store", incomeLabel: "Annual income (as per latest ITR)", docs: ["2 years’ ITR", "GST returns", "12 months’ bank statement"] },
  { id: "professional", group: "self", label: "Self-employed professional", desc: "Doctor, CA, architect, lawyer, consultant…", icon: "Stethoscope", incomeLabel: "Annual professional income (as per ITR)", docs: ["2 years’ ITR", "Degree / registration certificate", "12 months’ bank statement"] },
  { id: "freelancer", group: "self", label: "Freelancer / gig worker", desc: "Contract, freelance or platform-based income", icon: "Laptop", incomeLabel: "Annual income (as per latest ITR)", docs: ["2 years’ ITR", "Contracts or invoices", "12 months’ bank statement"] },
  { id: "retired", group: "salaried", label: "Retired / pensioner", desc: "Regular pension from a former employer", icon: "Wallet", incomeLabel: "Annual pension income", docs: ["Pension slips / PPO", "6 months’ bank statement", "Age proof"] },
];
export const empById = (id) => EMPLOYMENT.find((e) => e.id === id);

const FEATURES = {
  home: ["Door step service", "Overdraft facility", "Balance transfer", "Top-up loan", "Pre-EMI option", "Women borrower concession"],
  lap: ["Residential & commercial property", "Overdraft facility", "Balance transfer", "Top-up loan"],
  personal: ["Instant disbursal", "No collateral", "Minimal documents", "Part-prepayment allowed"],
  education: ["Covers study abroad", "Moratorium period", "Tax benefit u/s 80E", "Co-applicant option"],
  gold: ["Disbursal in 30 minutes", "Bullet repayment", "Secure vault storage", "Part release of gold"],
  business: ["Collateral-free", "Overdraft facility", "Quick disbursal", "GST-based assessment"],
  car: ["Up to 100% on-road funding", "New & used cars", "Quick approval", "Flexible tenure"],
};

// Sample max loan amount by lender tier (1 = largest).
const LIMITS = {
  home: [10 * CR, 5 * CR, 2 * CR], lap: [10 * CR, 5 * CR, 2 * CR], personal: [40 * L, 25 * L, 10 * L],
  education: [1.5 * CR, 75 * L, 40 * L], gold: [1 * CR, 50 * L, 25 * L], business: [5 * CR, 1 * CR, 50 * L], car: [1 * CR, 50 * L, 25 * L],
};

export const LENDER_KINDS = [
  { id: "PVT Bank", long: "Private sector bank" },
  { id: "PSU Bank", long: "Public sector bank" },
  { id: "HFC", long: "Housing finance company" },
  { id: "NBFC", long: "Non-banking financial company" },
];
export const kindLabel = (k) => LENDER_KINDS.find((x) => x.id === k)?.long ?? k;

const FEES = { "PSU Bank": "0.35% – 0.50%", "PVT Bank": "0.50% – 1%", NBFC: "Up to 2%", HFC: "0.50% – 1%" };
const ABOUT = {
  "PSU Bank": "A public sector bank with a wide branch network, transparent pricing and some of the most competitive rates for salaried and self-employed borrowers.",
  "PVT Bank": "A private sector bank known for quick digital processing, flexible repayment options and doorstep service in most cities.",
  HFC: "A housing finance company focused on home and property loans, with specialist underwriting for first-time buyers and self-employed borrowers.",
  NBFC: "A non-banking financial company offering fast approvals and flexible eligibility, often for profiles that banks find harder to serve.",
};

// [id, name, logo file, kind, tier, rates [home, lap, personal, education, gold, business, car]] — SAMPLE data
const RAW = [
  ["sbi", "State Bank of India", "sbi", "PSU Bank", 1, [7.5, 9.2, 10.3, 8.15, 8.75, 10.5, 8.85]],
  ["boi", "Bank of India", "bankofindia", "PSU Bank", 1, [7.35, 9.35, 10.75, 8.25, 8.8, 10.6, 8.85]],
  ["canara", "Canara Bank", "canara", "PSU Bank", 1, [7.4, 9.45, 10.95, 8.95, 8.95, 10.75, 8.7]],
  ["union", "Union Bank of India", "union-bank", "PSU Bank", 1, [7.35, 9.5, 11.35, 8.6, 8.95, 10.9, 8.7]],
  ["pnb", "Punjab National Bank", "pnb", "PSU Bank", 1, [7.45, 9.25, 10.4, 8.55, 8.9, 10.4, 8.75]],
  ["bob", "Bank of Baroda", "Baroda-bank", "PSU Bank", 1, [7.45, 9.85, 10.9, 8.4, 9.15, 10.8, 8.75]],
  ["idbi", "IDBI Bank", "idbi", "PSU Bank", 1, [7.55, 9.4, 10.75, 8.9, 9.1, 10.9, 8.8]],
  ["indian", "Indian Bank", "Indian_Bank", "PSU Bank", 1, [7.4, 9.3, 10.65, 8.6, 8.95, 10.7, 8.75]],
  ["central", "Central Bank of India", "central", "PSU Bank", 2, [7.5, 9.55, 10.9, 8.75, 9, 10.95, 8.8]],
  ["uco", "UCO Bank", "uco", "PSU Bank", 2, [7.45, 9.6, 11.05, 8.85, 9.1, 11.1, 8.85]],
  ["hdfc", "HDFC Bank", "hdfs", "PVT Bank", 1, [7.9, 9.5, 10.85, 9.55, 9.3, 11.25, 9.2]],
  ["icici", "ICICI Bank", "icic", "PVT Bank", 1, [8, 9.75, 10.85, 9.75, 9.25, 11.5, 9.1]],
  ["axis", "Axis Bank", "axis", "PVT Bank", 1, [8.35, 9.75, 11.25, 13.7, 9.5, 11.75, 9.2]],
  ["kotak", "Kotak Mahindra Bank", "Kotak Mahindra", "PVT Bank", 1, [7.99, 9.5, 10.99, null, 9.75, 12, 8.99]],
  ["federal", "Federal Bank", "federal", "PVT Bank", 2, [7.4, 9.6, 11.49, 9.5, 9.25, 11, 9]],
  ["idfc", "IDFC First Bank", "idfcfirst", "PVT Bank", 2, [8.85, 9.8, 10.99, null, 9.95, 12.5, 9.5]],
  ["indusind", "IndusInd Bank", "indusind", "PVT Bank", 2, [8.75, 10, 10.49, null, 9.75, 13, 9.6]],
  ["yes", "Yes Bank", "yes", "PVT Bank", 2, [9.15, 10.25, 10.99, null, null, 12.25, 9.25]],
  ["bandhan", "Bandhan Bank", "bandhan", "PVT Bank", 2, [8.6, 10.25, 11.55, null, 9.8, 12.5, null]],
  ["rbl", "RBL Bank", "rbl", "PVT Bank", 2, [8.9, 10.5, 14, null, null, 12.75, 9.75]],
  ["hsbc", "HSBC India", "hsbc", "PVT Bank", 1, [8.5, 9.75, 10.15, null, null, 12, null]],
  ["stanchart", "Standard Chartered", "standardchartered", "PVT Bank", 1, [8.45, 9.9, 11.49, null, null, 12.5, null]],
  ["southindian", "South Indian Bank", "south_indian", "PVT Bank", 3, [8.85, 10.25, 11.25, null, 9.6, 12, 9.4]],
  ["kvb", "Karur Vysya Bank", "karur vysya", "PVT Bank", 3, [8.75, 10, 11, null, 9.5, 11.75, 9.25]],
  ["au", "AU Small Finance Bank", "AU-Small", "PVT Bank", 3, [9.25, 10.75, null, null, 9.75, 13, 9.25]],
  ["ujjivan", "Ujjivan Small Finance Bank", "ujjivan1", "PVT Bank", 3, [9.5, 11, 12.5, null, 10.25, 14, null]],
  ["lichfl", "LIC Housing Finance", "lichfl", "HFC", 1, [7.5, 9.5, null, null, null, null, null]],
  ["pnbhfl", "PNB Housing Finance", "pnb-housing", "HFC", 2, [8.5, 9.8, null, null, null, null, null]],
  ["bajaj", "Bajaj Finance", "bajaj", "NBFC", 1, [8.25, 9.75, 11, null, 9.5, 14, null]],
  ["tata", "Tata Capital", "tatacapital", "NBFC", 1, [8.75, 10.15, 10.99, 10.5, null, 12, 10.25]],
  ["abc", "Aditya Birla Capital", "adityabirla", "NBFC", 2, [8.6, 10, 11, null, null, 12.75, null]],
  ["iifl", "IIFL Finance", "IIFL", "NBFC", 2, [8.75, 9.8, 12.75, null, 9.24, 12.75, null]],
  ["piramal", "Piramal Finance", "Piramal", "NBFC", 3, [9.5, 10.75, null, null, null, null, null]],
  ["hdb", "HDB Financial Services", "hdb", "NBFC", 2, [null, 10.5, 12.5, null, 9.75, 14.5, 10.5]],
  ["shriram", "Shriram Finance", "SHRIRAMFIN", "NBFC", 2, [null, 11, 13, null, 9.9, 15, 10.25]],
  ["chola", "Cholamandalam Finance", "Cholamandalam", "NBFC", 2, [null, 10, null, null, null, 14, 9.25]],
  ["mahindra", "Mahindra Finance", "mahindrafinance", "NBFC", 2, [null, null, null, null, null, null, 9.5]],
  ["muthoot", "Muthoot Finance", "muthoot", "NBFC", 1, [null, null, null, null, 9, null, null]],
  ["manappuram", "Manappuram Finance", "manappuram", "NBFC", 2, [null, null, null, null, 9.9, null, null]],
  ["incred", "InCred Finance", "InCred", "NBFC", 3, [null, null, 13.5, 11, null, 15, null]],
  ["navi", "Navi Finserv", "navi-finserv", "NBFC", 3, [9.9, null, 11.99, null, null, null, null]],
  ["moneyview", "Moneyview", "moneyview", "NBFC", 3, [null, null, 14, null, null, null, null]],
  ["kreditbee", "KreditBee", "KreditBee", "NBFC", 3, [null, null, 15, null, null, null, null]],
  ["fibe", "Fibe", "fibe", "NBFC", 3, [null, null, 14, null, null, null, null]],
  ["stashfin", "Stashfin", "stashfin", "NBFC", 3, [null, null, 16, null, null, null, null]],
  ["lendingkart", "Lendingkart", "LendindKart", "NBFC", 3, [null, null, null, null, null, 15, null]],
];

// Full / registered name of each lender, shown under the short brand name.
export const FULL_NAMES = {
  sbi: "State Bank of India", boi: "Bank of India", canara: "Canara Bank", union: "Union Bank of India",
  pnb: "Punjab National Bank", bob: "Bank of Baroda", idbi: "Industrial Development Bank of India (IDBI Bank Ltd.)",
  indian: "Indian Bank", central: "Central Bank of India", uco: "United Commercial Bank (UCO Bank)",
  hdfc: "Housing Development Finance Corporation Bank (HDFC Bank Ltd.)",
  icici: "Industrial Credit and Investment Corporation of India Bank (ICICI Bank Ltd.)",
  axis: "Axis Bank Ltd.", kotak: "Kotak Mahindra Bank Ltd.", federal: "The Federal Bank Ltd.",
  idfc: "IDFC First Bank Ltd. (Infrastructure Development Finance Company)", indusind: "IndusInd Bank Ltd.",
  yes: "Yes Bank Ltd.", bandhan: "Bandhan Bank Ltd.", rbl: "Ratnakar Bank Ltd. (RBL Bank)",
  hsbc: "The Hongkong and Shanghai Banking Corporation Ltd. (HSBC India)", stanchart: "Standard Chartered Bank (India)",
  southindian: "The South Indian Bank Ltd.", kvb: "Karur Vysya Bank Ltd. (KVB)", au: "AU Small Finance Bank Ltd.",
  ujjivan: "Ujjivan Small Finance Bank Ltd.", lichfl: "Life Insurance Corporation Housing Finance Ltd. (LIC HFL)",
  pnbhfl: "Punjab National Bank Housing Finance Ltd. (PNB Housing)", bajaj: "Bajaj Finance Ltd.", tata: "Tata Capital Ltd.",
  abc: "Aditya Birla Capital Ltd.", iifl: "India Infoline Finance Ltd. (IIFL Finance)", piramal: "Piramal Capital & Housing Finance Ltd.",
  hdb: "HDB Financial Services Ltd. (HDFC Bank group)", shriram: "Shriram Finance Ltd.",
  chola: "Cholamandalam Investment and Finance Company Ltd.", mahindra: "Mahindra & Mahindra Financial Services Ltd.",
  muthoot: "Muthoot Finance Ltd.", manappuram: "Manappuram Finance Ltd.", incred: "InCred Financial Services Ltd.",
  navi: "Navi Finserv Ltd.", moneyview: "Moneyview (Whizdm Finance Pvt. Ltd.)", kreditbee: "KreditBee (Krazybee Services Pvt. Ltd.)",
  fibe: "Fibe (EarlySalary Services Pvt. Ltd.)", stashfin: "Stashfin (Akara Capital Advisors Pvt. Ltd.)",
  lendingkart: "Lendingkart Finance Ltd.",
};

const TYPE_ORDER = ["home", "lap", "personal", "education", "gold", "business", "car"];

/** Full lender catalogue with per-product details. */
export const LENDERS = RAW.map(([id, name, logo, kind, tier, rates], i) => {
  const products = TYPE_ORDER.map((type, k) => {
    if (rates[k] == null) return null;
    const feats = FEATURES[type];
    return {
      type,
      rate: rates[k],
      maxAmount: LIMITS[type][tier - 1],
      maxTenure: Math.max(...loanById(type).tenures),
      features: [feats[i % feats.length], feats[(i + 1) % feats.length], feats[(i + 2) % feats.length]],
    };
  }).filter(Boolean);
  return { id, name, fullName: FULL_NAMES[id] ?? name, logo, kind, tier, products, fee: FEES[kind], about: ABOUT[kind], lowestRate: Math.min(...products.map((p) => p.rate)) };
});

export const lenderById = (id) => LENDERS.find((l) => l.id === id);

export const ELIGIBILITY = {
  salaried: ["Age 21–60 years", "At least 1 year of total work experience", "Net monthly income from ₹25,000 (varies by city & product)", "CIBIL score of 700+ preferred"],
  self: ["Age 25–65 years", "Business or practice running for 2+ years", "ITR filed for the last 2 years", "CIBIL score of 700+ preferred"],
};
export const DOCUMENTS = {
  salaried: ["PAN card & Aadhaar", "Last 3 months’ salary slips", "Last 6 months’ bank statement", "Form 16 / latest ITR"],
  self: ["PAN card & Aadhaar", "Last 2 years’ ITR with computation", "Last 12 months’ bank statement", "Business proof (GST / Udyam / registration)"],
};

/** Builds the offer list for a search. EMI uses the reducing-balance formula. */
export function getOffers({ type, amount, tenure, annualIncome }, emiFn) {
  const monthlyIncome = annualIncome / 12;
  return LENDERS.flatMap((l) => {
    const p = l.products.find((x) => x.type === type);
    if (!p) return [];
    const loanAmount = Math.min(amount, p.maxAmount);
    const emi = emiFn(loanAmount, p.rate, tenure * 12);
    // Lenders typically cap total EMI at ~50% of monthly income (FOIR).
    const eligible = monthlyIncome > 0 && emi <= monthlyIncome * 0.5;
    return [{
      id: l.id, name: l.name, fullName: l.fullName ?? l.name, logo: l.logo, kind: l.kind, fee: l.fee,
      rate: p.rate, maxAmount: p.maxAmount, maxTenure: p.maxTenure, features: p.features,
      loanAmount, emi, eligible, cappedAmount: amount > p.maxAmount,
    }];
  });
}
