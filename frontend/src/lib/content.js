// Content adapted from github.com/Avodah-Khen/AvodahLoans (frontend/src)

export const NAV_LINKS = [
  { label: "Loans", id: "loans" },
  { label: "Compare banks", id: "banks" },
  { label: "EMI calculator", id: "emi" },
  { label: "How it works", id: "how" },
  { label: "FAQ", id: "faq" },
];

export const HERO_STATS = [
  { value: 2.4, prefix: "", suffix: "L+", decimals: 1, label: "Happy customers" },
  { value: 50, prefix: "", suffix: "+", decimals: 0, label: "Lending partners" },
  { value: 8200, prefix: "₹", suffix: " Cr+", decimals: 0, label: "Loans disbursed" },
  { value: 7.1, prefix: "", suffix: "%", decimals: 1, label: "Lowest rate offered" },
];

export const CATEGORIES = [
  { icon: "House", title: "Home Loan", note: "Best rates" },
  { icon: "Briefcase", title: "Business Loan", note: "Available now" },
  { icon: "User", title: "Personal Loan", note: "Quick approval" },
  { icon: "Car", title: "Car Loan", note: "Low interest" },
  { icon: "GraduationCap", title: "Education Loan", note: "Flexible EMI" },
  { icon: "LandPlot", title: "Plot Loan", note: "Best rates" },
  { icon: "CreditCard", title: "Credit Card", note: "Instant approval" },
  { icon: "HeartPulse", title: "Medical Loan", note: "Available now" },
];

export const TOP_BANKS = [
  { logo: "sbi", name: "State Bank of India", type: "PSU Bank", rate: "7.10%", max: "₹5 Cr", process: "3–5 days", featured: true },
  { logo: "hdfs", name: "HDFC Bank", type: "Private Bank", rate: "7.40%", max: "₹10 Cr", process: "48 hrs" },
  { logo: "icic", name: "ICICI Bank", type: "Private Bank", rate: "7.60%", max: "₹10 Cr", process: "24 hrs" },
  { logo: "axis", name: "Axis Bank", type: "Private Bank", rate: "7.75%", max: "₹5 Cr", process: "48 hrs" },
];

export const PARTNER_LOGOS = [
  ["sbi", "SBI"], ["hdfs", "HDFC Bank"], ["icic", "ICICI Bank"], ["axis", "Axis Bank"],
  ["pnb", "PNB"], ["Kotak Mahindra", "Kotak Mahindra Bank"], ["Baroda-bank", "Bank of Baroda"],
  ["canara", "Canara Bank"], ["union-bank", "Union Bank"], ["idfcfirst", "IDFC First Bank"],
  ["indusind", "IndusInd Bank"], ["bandhan", "Bandhan Bank"], ["yes", "Yes Bank"],
  ["federal", "Federal Bank"], ["rbl", "RBL Bank"], ["bajaj", "Bajaj Finance"],
  ["tatacapital", "Tata Capital"], ["adityabirla", "Aditya Birla Capital"], ["lichfl", "LIC Housing Finance"],
  ["mahindrafinance", "Mahindra Finance"], ["Piramal", "Piramal Finance"], ["muthoot", "Muthoot Finance"],
  ["hsbc", "HSBC"], ["standardchartered", "Standard Chartered"], ["IIFL", "IIFL Finance"],
  ["pnb-housing", "PNB Housing"], ["Cholamandalam", "Cholamandalam"], ["AU-Small", "AU Small Finance Bank"],
];

export const WHY_ITEMS = [
  { icon: "Search", title: "Compare 50+ lenders", desc: "Interest rates, EMI and eligibility from 50+ banks and NBFCs, side by side on a single screen." },
  { icon: "Zap", title: "Instant pre-approval", desc: "Check your eligibility in under 60 seconds — pre-approved without touching your credit score." },
  { icon: "Handshake", title: "Zero commission", desc: "We earn from lenders, not from you. The service is free with zero hidden charges." },
  { icon: "ShieldCheck", title: "End-to-end support", desc: "A dedicated loan advisor guides you from application to disbursal — and for the life of your loan." },
];

export const STEPS = [
  { icon: "ClipboardCheck", title: "Check eligibility", desc: "Enter basic details and instantly see how much you qualify for — no documents needed." },
  { icon: "Scale", title: "Compare offers", desc: "Personalised offers from 50+ lenders, sorted by lowest EMI and best terms." },
  { icon: "BadgeCheck", title: "Choose the best offer", desc: "Pick the offer that fits your needs, budget and repayment preferences." },
  { icon: "FileUp", title: "Apply online", desc: "Upload documents once and apply to multiple banks — fully digital." },
  { icon: "Banknote", title: "Disbursal in 24 hrs", desc: "Once approved, funds land directly in your bank account within 24 hours." },
];

export const TESTIMONIALS = [
  { initials: "RK", name: "Rahul Kumar", city: "Mumbai, Maharashtra", loan: "Home loan", text: "Got my home loan approved at 7.1% when other platforms were offering 8.5%. The team guided me through the entire process and there were zero surprises at the end." },
  { initials: "PS", name: "Priya Shah", city: "Pune, Maharashtra", loan: "Business loan", text: "Applied for a business loan on Monday, got sanctioned by Wednesday, and funds were in my account on Friday. Exceptional speed and a completely transparent process." },
  { initials: "AM", name: "Amit Mehta", city: "Thane, Maharashtra", loan: "Balance transfer", text: "The EMI calculator and bank comparison tools are genuinely useful. I saved ₹3.2 lakh in interest by switching to the bank AvodahLoans recommended." },
];

export const FAQS = [
  { q: "How do I check my loan eligibility?", a: "Click ‘Check eligibility’, then fill in your monthly income, employment type and loan amount. You’ll get an instant result — no documents needed and no impact on your credit score." },
  { q: "Does checking eligibility affect my CIBIL score?", a: "No. We use a soft inquiry to check your eligibility, which does not affect your CIBIL or credit score in any way." },
  { q: "How long does loan approval take?", a: "Most lenders on our platform approve loans within 24–48 hours for salaried applicants. Self-employed applicants may take 3–5 working days depending on the lender." },
  { q: "What documents are required for a home loan?", a: "Typically: PAN, Aadhaar, last 3 months’ salary slips (salaried) or 2 years’ ITR (self-employed), last 6 months’ bank statement, and property documents. Requirements vary by lender." },
  { q: "Is AvodahLoans a direct lender?", a: "No — we are a loan comparison and facilitation platform. We partner with 50+ banks and NBFCs to find you the best offer. You apply through us and the lender disburses directly." },
  { q: "Are there any charges for using AvodahLoans?", a: "Our service is completely free for borrowers. We are compensated by lenders when a loan is disbursed. There are zero hidden charges from our side." },
  { q: "What is the minimum CIBIL score required?", a: "Most lenders require 700–750 for home loans and 720+ for personal loans. Some NBFCs accept scores as low as 650 with a higher interest rate." },
  { q: "Can I prepay my loan?", a: "Yes. Most banks allow prepayment. For floating-rate loans, RBI guidelines prohibit prepayment penalties. Fixed-rate loans may carry a 2–4% prepayment charge depending on the lender." },
];

export const CALCULATORS = [
  { group: "Loan EMI", items: ["Personal loan EMI", "Business loan EMI", "Home loan EMI", "Mudra loan EMI"] },
  { group: "Eligibility", items: ["Personal loan eligibility", "Home loan eligibility", "Personal loan prepayment", "Home loan prepayment"] },
  { group: "Investment", items: ["Fixed deposit", "Post office FD", "GST calculator", "NPS calculator"] },
];

// Placeholder contact details carried over from the reference repo — replace before launch.
export const CONTACT = {
  phone: "+91 99999 99999",
  email: "info@compareprojects.in",
  city: "Mumbai, Maharashtra",
};
