/**
 * Real Indian Government schemes, helplines, legal provisions, and DLSA data
 * for the RAAHAT victim support platform.
 *
 * Sources: NALSA, NCRB, Ministry of Social Justice, Maharashtra State Commission
 */

// ── Emergency Helplines (Verified) ──
export const HELPLINES = [
  { number: '112', name: 'National Emergency Number', description: 'Police, Fire, Ambulance — unified emergency response', available: '24/7' },
  { number: '14566', name: 'Victim Helpline (NALSA)', description: 'National Legal Services Authority — free legal aid and victim support', available: '24/7' },
  { number: '181', name: 'Women Helpline', description: 'Ministry of Women & Child Development — support for women in distress', available: '24/7' },
  { number: '1098', name: 'Childline', description: 'Child in need of care and protection — immediate intervention', available: '24/7' },
  { number: '1091', name: 'Women Police Helpline', description: 'Police helpline specifically for crimes against women', available: '24/7' },
  { number: '100', name: 'Police Emergency', description: 'Local police emergency response', available: '24/7' },
  { number: '108', name: 'Ambulance / Medical Emergency', description: 'Emergency medical services and ambulance dispatch', available: '24/7' },
  { number: '1800-599-0019', name: 'SC/ST Helpline', description: 'National Commission for Scheduled Castes — atrocity reporting', available: 'Mon-Fri 9:30 AM - 5:30 PM' },
  { number: '8468-8468-68', name: 'Tele-MANAS', description: 'Mental health counselling support — Ministry of Health', available: '24/7' },
  { number: '155260', name: 'Cyber Crime Helpline', description: 'National Cyber Crime Reporting Portal helpline', available: '24/7' },
];

// ── Legal Provisions (Verified) ──
export const LEGAL_PROVISIONS = [
  {
    code: 'SCST-POA-1989',
    name: 'SC/ST (Prevention of Atrocities) Act, 1989',
    shortName: 'PoA Act',
    description: 'Prevents atrocities against Scheduled Castes and Scheduled Tribes. Provides for special courts, enhanced penalties, and victim relief & rehabilitation.',
    sections: [
      { section: 'Section 3', title: 'Punishments for Offences of Atrocities', description: 'Defines offences including assault, social boycott, land dispossession, forced labour, and public humiliation.' },
      { section: 'Section 4', title: 'Punishment for Neglect of Duties', description: 'Punishes public servants who wilfully neglect duties under this Act.' },
      { section: 'Section 14', title: 'Exclusive Special Courts', description: 'Establishment of special courts for speedy trial of atrocity cases.' },
      { section: 'Rule 12(4)', title: 'Immediate Relief & Rehabilitation', description: 'Monetary relief to victims within 7 days of registration of FIR.' },
    ],
    reliefAmount: '₹1,00,000 to ₹8,25,000 depending on nature of atrocity',
    applicableTo: ['SC', 'ST'],
  },
  {
    code: 'DV-ACT-2005',
    name: 'Protection of Women from Domestic Violence Act, 2005',
    shortName: 'DV Act',
    description: 'Provides protection to women from domestic violence including physical, emotional, sexual, verbal, and economic abuse.',
    sections: [
      { section: 'Section 12', title: 'Application to Magistrate', description: 'Aggrieved person can apply for protection order.' },
      { section: 'Section 18', title: 'Protection Orders', description: 'Magistrate can pass protection orders restraining the respondent.' },
      { section: 'Section 19', title: 'Residence Orders', description: 'Right to reside in shared household.' },
      { section: 'Section 20', title: 'Monetary Relief', description: 'Compensation for losses and medical expenses.' },
    ],
    applicableTo: ['Women'],
  },
  {
    code: 'POCSO-2012',
    name: 'Protection of Children from Sexual Offences Act, 2012',
    shortName: 'POCSO Act',
    description: 'Protects children from sexual assault, harassment, and exploitation. Provides child-friendly legal procedures.',
    applicableTo: ['Children (under 18)'],
  },
  {
    code: 'IPC-SEC',
    name: 'Bharatiya Nyaya Sanhita (BNS) 2023 / Indian Penal Code',
    shortName: 'BNS/IPC',
    description: 'Key sections for victim protection including criminal intimidation, assault, wrongful restraint, and outraging modesty.',
    sections: [
      { section: 'Section 351 BNS (S.506 IPC)', title: 'Criminal Intimidation', description: 'Threatening any person with injury to person, reputation, or property.' },
      { section: 'Section 115 BNS (S.323 IPC)', title: 'Voluntarily Causing Hurt', description: 'Punishment for assault causing bodily hurt.' },
      { section: 'Section 74 BNS (S.354 IPC)', title: 'Assault on Woman', description: 'Assault or use of criminal force against woman.' },
    ],
    applicableTo: ['All'],
  },
  {
    code: 'LSA-1987',
    name: 'Legal Services Authorities Act, 1987',
    shortName: 'LSA Act',
    description: 'Provides free legal services to weaker sections of society through National, State, and District Legal Services Authorities.',
    sections: [
      { section: 'Section 12', title: 'Criteria for Free Legal Services', description: 'SC/ST, women, children, disabled, victims of mass disaster, industrial workers, and persons with annual income below ₹3 lakh.' },
    ],
    applicableTo: ['SC', 'ST', 'Women', 'Children', 'Disabled', 'EWS'],
  },
  {
    code: 'WPS-2018',
    name: 'Witness Protection Scheme, 2018',
    shortName: 'WPS',
    description: 'Supreme Court-approved scheme for protection of witnesses and victims facing threats. Three categories of protection based on threat level.',
    applicableTo: ['Witnesses', 'Victims'],
  },
];

// ── Government Schemes (Verified) ──
export const GOVERNMENT_SCHEMES = [
  {
    code: 'NALSA-FLA',
    name: 'Free Legal Aid (NALSA)',
    ministry: 'Ministry of Law & Justice',
    description: 'Free legal representation, advice, and assistance through District Legal Services Authority (DLSA) for eligible persons.',
    eligibility: 'SC/ST members, women, children, disabled, victims of trafficking, industrial workmen, persons with income < ₹3 lakh/year.',
    benefits: ['Free legal representation in courts', 'Legal advice and counselling', 'FIR assistance', 'Court fee waiver', 'Document preparation'],
    website: 'https://nalsa.gov.in',
    helpline: '14566',
  },
  {
    code: 'OSC-SAKHI',
    name: 'One Stop Centre (Sakhi)',
    ministry: 'Ministry of Women & Child Development',
    description: 'Integrated support centre for women affected by violence — provides medical, legal, psychological, and shelter services under one roof.',
    eligibility: 'All women affected by violence, irrespective of age, class, caste, or marital status.',
    benefits: ['Emergency response & rescue', 'Medical assistance', 'Legal aid & counselling', 'Psycho-social support', 'Temporary shelter (up to 5 days)', 'Video-conferencing for police/court'],
    website: 'https://wcd.nic.in',
    helpline: '181',
  },
  {
    code: 'VCS',
    name: 'Victim Compensation Scheme',
    description: 'State-level schemes under Section 357A CrPC for compensating victims of crime who suffer loss or injury and require rehabilitation.',
    ministry: 'State Legal Services Authority',
    eligibility: 'Victims of crimes including acid attack, rape, sexual assault, trafficking, or any other crime causing bodily harm.',
    benefits: ['Monetary compensation', 'Medical treatment costs', 'Rehabilitation expenses'],
    compensationRange: '₹3,00,000 to ₹10,00,000 depending on crime type and state scheme',
  },
  {
    code: 'PMJAY',
    name: 'Ayushman Bharat – PM Jan Arogya Yojana',
    ministry: 'Ministry of Health & Family Welfare',
    description: 'Health insurance cover of ₹5 lakh per family per year for secondary and tertiary hospitalization.',
    eligibility: 'Economically weaker families as per SECC 2011 data.',
    benefits: ['Free hospitalization', 'Cover for pre/post-hospitalization', '1,350+ medical packages covered'],
    website: 'https://pmjay.gov.in',
    helpline: '14555',
  },
  {
    code: 'PMAY',
    name: 'Pradhan Mantri Awas Yojana',
    ministry: 'Ministry of Housing & Urban Affairs',
    description: 'Housing for all — financial assistance for construction of pucca houses for homeless and those living in kutcha houses.',
    eligibility: 'EWS/LIG/MIG families without a pucca house.',
    benefits: ['Subsidy up to ₹2.67 lakh', 'Interest subsidy on home loans'],
    website: 'https://pmaymis.gov.in',
  },
  {
    code: 'NFBS',
    name: 'National Family Benefit Scheme',
    ministry: 'Ministry of Rural Development',
    description: 'Lump sum assistance to BPL households on death of primary breadwinner.',
    eligibility: 'BPL families who have lost primary breadwinner (18-59 years).',
    benefits: ['One-time grant of ₹20,000'],
  },
  {
    code: 'SCST-SCHOLARSHIP',
    name: 'Post-Matric Scholarship for SC/ST',
    ministry: 'Ministry of Social Justice & Empowerment',
    description: 'Financial assistance for SC/ST students pursuing post-matriculation education.',
    eligibility: 'SC/ST students with family income below ₹2.5 lakh/year.',
    benefits: ['Full tuition fees', 'Monthly maintenance allowance', 'Book/stationery allowance'],
  },
  {
    code: 'SCST-RELIEF',
    name: 'Relief & Rehabilitation under PoA Act',
    ministry: 'Ministry of Social Justice & Empowerment',
    description: 'Immediate monetary relief and long-term rehabilitation for victims under the SC/ST (Prevention of Atrocities) Act.',
    eligibility: 'SC/ST victims of atrocity offences with registered FIR.',
    benefits: ['Immediate relief: ₹1 lakh within 7 days of FIR', 'Additional relief after charge-sheet and conviction', 'Total: up to ₹8.25 lakh'],
  },
];

// ── Maharashtra District Legal Services Authorities ──
export const DLSA_OFFICES = [
  { district: 'Mumbai', name: 'DLSA Mumbai', address: 'City Civil Court, Fort, Mumbai - 400001', phone: '022-22620523', email: 'dlsamumbai@gmail.com' },
  { district: 'Pune', name: 'DLSA Pune', address: 'District Court Building, Shivaji Nagar, Pune - 411005', phone: '020-25501000', email: 'dlsapune@maharashtra.gov.in' },
  { district: 'Nagpur', name: 'DLSA Nagpur', address: 'District Court, Civil Lines, Nagpur - 440001', phone: '0712-2564911', email: 'dlsanagpur@gmail.com' },
  { district: 'Nashik', name: 'DLSA Nashik', address: 'District Court Compound, Old Agra Road, Nashik - 422002', phone: '0253-2317700', email: 'dlsanashik@gmail.com' },
  { district: 'Chhatrapati Sambhajinagar', name: 'DLSA Chhatrapati Sambhajinagar', address: 'District & Sessions Court, Aurangabad - 431001', phone: '0240-2331010', email: 'dlsaaurangabad@gmail.com' },
  { district: 'Solapur', name: 'DLSA Solapur', address: 'District Court, Station Road, Solapur - 413001', phone: '0217-2621360', email: 'dlsasolapur@gmail.com' },
  { district: 'Kolhapur', name: 'DLSA Kolhapur', address: 'District Court, Bhausingji Road, Kolhapur - 416002', phone: '0231-2651515', email: 'dlsakolhapur@gmail.com' },
  { district: 'Amravati', name: 'DLSA Amravati', address: 'District & Sessions Court, Amravati - 444601', phone: '0721-2662345', email: 'dlsaamravati@gmail.com' },
  { district: 'Thane', name: 'DLSA Thane', address: 'District Court, Thane (W) - 400601', phone: '022-25401500', email: 'dlsathane@gmail.com' },
  { district: 'Latur', name: 'DLSA Latur', address: 'District Court, Latur - 413512', phone: '02382-243300', email: 'dlsalatur@gmail.com' },
  { district: 'Satara', name: 'DLSA Satara', address: 'District Court, Satara - 415001', phone: '02162-234500', email: 'dlsasatara@gmail.com' },
  { district: 'Sangli', name: 'DLSA Sangli', address: 'District Court, Sangli - 416416', phone: '0233-2621500', email: 'dlsasangli@gmail.com' },
  { district: 'Jalgaon', name: 'DLSA Jalgaon', address: 'District Court, Jalgaon - 425001', phone: '0257-2222600', email: 'dlsajalgaon@gmail.com' },
  { district: 'Raigad', name: 'DLSA Raigad', address: 'District Court, Alibag - 402201', phone: '02141-222300', email: 'dlsaraigad@gmail.com' },
];

// ── State Commissions ──
export const STATE_COMMISSIONS = [
  { name: 'Maharashtra State SC Commission', phone: '022-22025643', address: 'New Administrative Building, Mantralaya, Mumbai', website: 'https://mscsc.maharashtra.gov.in' },
  { name: 'Maharashtra State ST Commission', phone: '022-22024500', address: 'Mantralaya Annexe, Mumbai', website: 'https://tribal.maharashtra.gov.in' },
  { name: 'Maharashtra State Women Commission', phone: '022-22025801', address: 'Gruha Nirman Bhavan, Mumbai', website: 'https://mswc.maharashtra.gov.in', helpline: '181' },
  { name: 'Maharashtra State Human Rights Commission', phone: '022-22846000', address: 'New Administrative Building, Mantralaya, Mumbai', website: 'https://mshrc.maharashtra.gov.in' },
  { name: 'National Commission for Scheduled Castes', phone: '011-23381025', address: '5th Floor, Loknayak Bhavan, New Delhi', website: 'https://ncsc.nic.in', helpline: '1800-599-0019' },
];

// ── API route handler ──
export function getGovernmentData(req, res) {
  const { type, district, category } = req.query;

  if (type === 'helplines') return res.json(HELPLINES);
  if (type === 'legal') return res.json(LEGAL_PROVISIONS);
  if (type === 'schemes') return res.json(GOVERNMENT_SCHEMES);
  if (type === 'dlsa') {
    if (district) {
      const dlsa = DLSA_OFFICES.find(d => d.district.toLowerCase() === district.toLowerCase());
      return res.json(dlsa || DLSA_OFFICES[0]);
    }
    return res.json(DLSA_OFFICES);
  }
  if (type === 'commissions') return res.json(STATE_COMMISSIONS);

  // Return all
  res.json({
    helplines: HELPLINES,
    legalProvisions: LEGAL_PROVISIONS,
    schemes: GOVERNMENT_SCHEMES,
    dlsaOffices: DLSA_OFFICES,
    stateCommissions: STATE_COMMISSIONS,
  });
}
