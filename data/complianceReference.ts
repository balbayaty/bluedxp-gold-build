/**
 * Compliance Reference Data
 * =========================
 * Reusable compliance, regulatory, and industry reference data
 * Used across all feature playbooks for consistency
 */

// =============================================================================
// REGULATORY BODIES BY REGION
// =============================================================================

export const regulatoryBodies = {
  // Global
  ISO: { code: 'ISO', name: 'International Organization for Standardization', jurisdiction: 'global', type: 'standards-body' },
  IEC: { code: 'IEC', name: 'International Electrotechnical Commission', jurisdiction: 'global', type: 'standards-body' },
  
  // USA
  FDA: { code: 'FDA', name: 'Food and Drug Administration', jurisdiction: 'us', type: 'government', website: 'https://www.fda.gov' },
  EPA: { code: 'EPA', name: 'Environmental Protection Agency', jurisdiction: 'us', type: 'government', website: 'https://www.epa.gov' },
  OSHA: { code: 'OSHA', name: 'Occupational Safety and Health Administration', jurisdiction: 'us', type: 'government', website: 'https://www.osha.gov' },
  DOT: { code: 'DOT', name: 'Department of Transportation', jurisdiction: 'us', type: 'government', website: 'https://www.transportation.gov' },
  CBP: { code: 'CBP', name: 'Customs and Border Protection', jurisdiction: 'us', type: 'government', website: 'https://www.cbp.gov' },
  BIS: { code: 'BIS', name: 'Bureau of Industry and Security', jurisdiction: 'us', type: 'government', website: 'https://www.bis.doc.gov' },
  OFAC: { code: 'OFAC', name: 'Office of Foreign Assets Control', jurisdiction: 'us', type: 'government', website: 'https://home.treasury.gov/policy-issues/office-of-foreign-assets-control-sanctions-programs-and-information' },
  FCC: { code: 'FCC', name: 'Federal Communications Commission', jurisdiction: 'us', type: 'government', website: 'https://www.fcc.gov' },
  CISA: { code: 'CISA', name: 'Cybersecurity and Infrastructure Security Agency', jurisdiction: 'us', type: 'government', website: 'https://www.cisa.gov' },
  NIST: { code: 'NIST', name: 'National Institute of Standards and Technology', jurisdiction: 'us', type: 'government', website: 'https://www.nist.gov' },
  
  // European Union
  EC: { code: 'EC', name: 'European Commission', jurisdiction: 'eu', type: 'government', website: 'https://ec.europa.eu' },
  ENISA: { code: 'ENISA', name: 'EU Agency for Cybersecurity', jurisdiction: 'eu', type: 'government', website: 'https://www.enisa.europa.eu' },
  EDPB: { code: 'EDPB', name: 'European Data Protection Board', jurisdiction: 'eu', type: 'government', website: 'https://edpb.europa.eu' },
  EMA: { code: 'EMA', name: 'European Medicines Agency', jurisdiction: 'eu', type: 'government', website: 'https://www.ema.europa.eu' },
  ECHA: { code: 'ECHA', name: 'European Chemicals Agency', jurisdiction: 'eu', type: 'government', website: 'https://echa.europa.eu' },
  
  // UK
  ICO: { code: 'ICO', name: 'Information Commissioner\'s Office', jurisdiction: 'uk', type: 'government', website: 'https://ico.org.uk' },
  HSE: { code: 'HSE', name: 'Health and Safety Executive', jurisdiction: 'uk', type: 'government', website: 'https://www.hse.gov.uk' },
  MHRA: { code: 'MHRA', name: 'Medicines and Healthcare products Regulatory Agency', jurisdiction: 'uk', type: 'government', website: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency' },
  
  // Saudi Arabia & GCC
  SAMA: { code: 'SAMA', name: 'Saudi Central Bank', jurisdiction: 'saudi-arabia', type: 'government', website: 'https://www.sama.gov.sa' },
  NCA_SA: { code: 'NCA', name: 'National Cybersecurity Authority (Saudi)', jurisdiction: 'saudi-arabia', type: 'government', website: 'https://nca.gov.sa' },
  SFDA: { code: 'SFDA', name: 'Saudi Food & Drug Authority', jurisdiction: 'saudi-arabia', type: 'government', website: 'https://www.sfda.gov.sa' },
  GACA: { code: 'GACA', name: 'General Authority of Civil Aviation', jurisdiction: 'saudi-arabia', type: 'government', website: 'https://gaca.gov.sa' },
  ZATCA: { code: 'ZATCA', name: 'Zakat, Tax and Customs Authority', jurisdiction: 'saudi-arabia', type: 'government', website: 'https://zatca.gov.sa' },
  NUPCO: { code: 'NUPCO', name: 'National Unified Procurement Company', jurisdiction: 'saudi-arabia', type: 'government', website: 'https://www.nupco.com' },
  
  // UAE
  SCA: { code: 'SCA', name: 'Securities and Commodities Authority', jurisdiction: 'uae', type: 'government', website: 'https://www.sca.gov.ae' },
  TDRA: { code: 'TDRA', name: 'Telecommunications and Digital Government Regulatory Authority', jurisdiction: 'uae', type: 'government', website: 'https://tdra.gov.ae' },
  MOIAT: { code: 'MOIAT', name: 'Ministry of Industry and Advanced Technology', jurisdiction: 'uae', type: 'government', website: 'https://www.moiat.gov.ae' },
} as const;

// =============================================================================
// LAWS BY JURISDICTION
// =============================================================================

export const laws = {
  // Data Privacy
  GDPR: {
    name: 'General Data Protection Regulation',
    code: 'GDPR',
    jurisdiction: 'eu',
    yearEnacted: 2016,
    category: 'data-privacy',
    keyProvisions: ['Data Protection by Design', 'Right to Erasure', 'Data Portability', 'Breach Notification', 'DPO Requirement'],
    penalties: 'Up to €20 million or 4% of global annual turnover'
  },
  CCPA: {
    name: 'California Consumer Privacy Act',
    code: 'CCPA',
    jurisdiction: 'us',
    yearEnacted: 2018,
    category: 'data-privacy',
    keyProvisions: ['Right to Know', 'Right to Delete', 'Right to Opt-Out', 'Non-Discrimination'],
    penalties: 'Up to $7,500 per intentional violation'
  },
  PDPL: {
    name: 'Personal Data Protection Law',
    code: 'PDPL',
    jurisdiction: 'saudi-arabia',
    yearEnacted: 2021,
    category: 'data-privacy',
    keyProvisions: ['Consent Requirements', 'Data Transfer Restrictions', 'Data Subject Rights', 'Data Localization'],
    penalties: 'Up to SAR 5 million per violation'
  },
  UKGDPR: {
    name: 'UK General Data Protection Regulation',
    code: 'UK GDPR',
    jurisdiction: 'uk',
    yearEnacted: 2021,
    category: 'data-privacy',
    keyProvisions: ['Similar to EU GDPR with UK-specific provisions'],
    penalties: 'Up to £17.5 million or 4% of global annual turnover'
  },
  
  // Environmental
  RCRA: {
    name: 'Resource Conservation and Recovery Act',
    code: 'RCRA',
    jurisdiction: 'us',
    yearEnacted: 1976,
    category: 'environmental',
    keyProvisions: ['Hazardous Waste Management', 'Underground Storage Tanks', 'Solid Waste'],
    penalties: 'Up to $70,117 per day per violation'
  },
  TSCA: {
    name: 'Toxic Substances Control Act',
    code: 'TSCA',
    jurisdiction: 'us',
    yearEnacted: 1976,
    category: 'environmental',
    keyProvisions: ['Chemical Inventory', 'New Chemical Review', 'Risk Evaluation'],
    penalties: 'Up to $44,539 per day per violation'
  },
  REACH: {
    name: 'Registration, Evaluation, Authorisation and Restriction of Chemicals',
    code: 'REACH',
    jurisdiction: 'eu',
    yearEnacted: 2006,
    category: 'environmental',
    keyProvisions: ['Chemical Registration', 'Safety Data Sheets', 'Authorization', 'Restriction'],
    penalties: 'Varies by member state'
  },
  
  // Safety
  OSHA_ACT: {
    name: 'Occupational Safety and Health Act',
    code: 'OSH Act',
    jurisdiction: 'us',
    yearEnacted: 1970,
    category: 'safety',
    keyProvisions: ['General Duty Clause', 'Standards Compliance', 'Recordkeeping'],
    penalties: 'Up to $156,259 per willful violation'
  },
  PSM: {
    name: 'Process Safety Management of Highly Hazardous Chemicals',
    code: 'PSM',
    jurisdiction: 'us',
    yearEnacted: 1992,
    category: 'safety',
    keyProvisions: ['Process Hazard Analysis', 'Operating Procedures', 'Mechanical Integrity', 'Incident Investigation'],
    penalties: 'Same as OSHA penalties'
  },
  
  // Trade & Customs
  CTPAT: {
    name: 'Customs-Trade Partnership Against Terrorism',
    code: 'C-TPAT',
    jurisdiction: 'us',
    yearEnacted: 2001,
    category: 'customs',
    keyProvisions: ['Supply Chain Security', 'Business Partner Requirements', 'Physical Security'],
    penalties: 'Loss of trusted trader benefits'
  },
  AEO: {
    name: 'Authorized Economic Operator',
    code: 'AEO',
    jurisdiction: 'global',
    yearEnacted: 2005,
    category: 'customs',
    keyProvisions: ['Customs Simplification', 'Security Standards', 'Mutual Recognition'],
    penalties: 'Revocation of AEO status'
  },
  
  // AI & Technology
  EU_AI_ACT: {
    name: 'European Union Artificial Intelligence Act',
    code: 'EU AI Act',
    jurisdiction: 'eu',
    yearEnacted: 2024,
    category: 'technology',
    keyProvisions: ['AI Risk Classification', 'High-Risk AI Requirements', 'Transparency', 'Human Oversight'],
    penalties: 'Up to €35 million or 7% of global turnover'
  },
  CRA: {
    name: 'Cyber Resilience Act',
    code: 'CRA',
    jurisdiction: 'eu',
    yearEnacted: 2024,
    category: 'technology',
    keyProvisions: ['Security by Design', 'Vulnerability Handling', 'CE Marking'],
    penalties: 'Up to €15 million or 2.5% of global turnover'
  },
} as const;

// =============================================================================
// COMPLIANCE STANDARDS
// =============================================================================

export const complianceStandards = {
  // Security
  ISO27001: {
    code: 'ISO 27001',
    name: 'Information Security Management System',
    category: 'security',
    description: 'International standard for information security management',
    certificationBody: 'ISO',
    regions: ['global']
  },
  ISO27701: {
    code: 'ISO 27701',
    name: 'Privacy Information Management System',
    category: 'data-privacy',
    description: 'Extension to ISO 27001 for privacy management',
    certificationBody: 'ISO',
    regions: ['global']
  },
  SOC2: {
    code: 'SOC 2 Type II',
    name: 'Service Organization Control 2',
    category: 'security',
    description: 'Trust services criteria for security, availability, processing integrity, confidentiality, and privacy',
    certificationBody: 'AICPA',
    regions: ['global', 'north-america']
  },
  NISTCSF: {
    code: 'NIST CSF',
    name: 'NIST Cybersecurity Framework',
    category: 'security',
    description: 'Framework for improving critical infrastructure cybersecurity',
    certificationBody: 'NIST',
    regions: ['us', 'global']
  },
  IEC62443: {
    code: 'IEC 62443',
    name: 'Industrial Automation and Control Systems Security',
    category: 'security',
    description: 'Security for industrial automation and control systems',
    certificationBody: 'IEC',
    regions: ['global']
  },
  
  // Quality
  ISO9001: {
    code: 'ISO 9001',
    name: 'Quality Management System',
    category: 'quality',
    description: 'International standard for quality management',
    certificationBody: 'ISO',
    regions: ['global']
  },
  ISO13485: {
    code: 'ISO 13485',
    name: 'Medical Devices Quality Management',
    category: 'quality',
    description: 'Quality management for medical device manufacturers',
    certificationBody: 'ISO',
    regions: ['global']
  },
  IATF16949: {
    code: 'IATF 16949',
    name: 'Automotive Quality Management',
    category: 'quality',
    description: 'Quality management for automotive industry',
    certificationBody: 'IATF',
    regions: ['global']
  },
  
  // Environmental
  ISO14001: {
    code: 'ISO 14001',
    name: 'Environmental Management System',
    category: 'environmental',
    description: 'International standard for environmental management',
    certificationBody: 'ISO',
    regions: ['global']
  },
  ISO50001: {
    code: 'ISO 50001',
    name: 'Energy Management System',
    category: 'environmental',
    description: 'International standard for energy management',
    certificationBody: 'ISO',
    regions: ['global']
  },
  
  // Safety
  ISO45001: {
    code: 'ISO 45001',
    name: 'Occupational Health and Safety Management',
    category: 'safety',
    description: 'International standard for occupational health and safety',
    certificationBody: 'ISO',
    regions: ['global']
  },
  
  // Supply Chain
  ISO28000: {
    code: 'ISO 28000',
    name: 'Supply Chain Security Management',
    category: 'security',
    description: 'Security management for supply chain',
    certificationBody: 'ISO',
    regions: ['global']
  },
  
  // Business Continuity
  ISO22301: {
    code: 'ISO 22301',
    name: 'Business Continuity Management',
    category: 'operational',
    description: 'Requirements for business continuity management',
    certificationBody: 'ISO',
    regions: ['global']
  },
} as const;

// =============================================================================
// INDUSTRY STANDARDS
// =============================================================================

export const industryStandards = {
  // Data Exchange
  GS1: {
    code: 'GS1',
    name: 'GS1 Standards',
    organization: 'GS1',
    category: 'identification',
    description: 'Global standards for identification and data capture'
  },
  EPCIS: {
    code: 'EPCIS',
    name: 'Electronic Product Code Information Services',
    organization: 'GS1',
    category: 'data-exchange',
    version: '2.0',
    description: 'Standard for sharing supply chain event data'
  },
  EDIFACT: {
    code: 'EDIFACT',
    name: 'UN/EDIFACT',
    organization: 'UN/CEFACT',
    category: 'data-exchange',
    description: 'United Nations standard for electronic data interchange'
  },
  X12: {
    code: 'ANSI X12',
    name: 'ANSI ASC X12',
    organization: 'ANSI',
    category: 'data-exchange',
    description: 'American EDI standard'
  },
  
  // IoT & Communication
  MQTT: {
    code: 'MQTT',
    name: 'Message Queuing Telemetry Transport',
    organization: 'OASIS',
    category: 'communication',
    version: '5.0',
    description: 'Lightweight messaging protocol for IoT'
  },
  OPCUA: {
    code: 'OPC UA',
    name: 'Open Platform Communications Unified Architecture',
    organization: 'OPC Foundation',
    category: 'interoperability',
    version: '1.05',
    description: 'Industrial interoperability standard'
  },
  
  // Chemical & Safety
  GHS: {
    code: 'GHS',
    name: 'Globally Harmonized System of Classification and Labelling',
    organization: 'UN',
    category: 'safety',
    description: 'International chemical hazard classification'
  },
  SDS: {
    code: 'SDS',
    name: 'Safety Data Sheet (ISO 11014)',
    organization: 'ISO',
    category: 'safety',
    description: 'Standard format for chemical safety information'
  },
} as const;

// =============================================================================
// INDUSTRY VERTICALS & REQUIREMENTS
// =============================================================================

export const industryVerticals = {
  pharmaceutical: {
    name: 'Pharmaceutical',
    requirements: ['21 CFR Part 11', 'GDP', 'GxP', 'Serialization', 'Cold Chain'],
    regulations: ['FDA', 'EMA', 'ICH'],
    certifications: ['ISO 13485', 'WHO GMP']
  },
  foodBeverage: {
    name: 'Food & Beverage',
    requirements: ['FSMA', 'HACCP', 'GFSI', 'Traceability', 'Allergen Management'],
    regulations: ['FDA', 'USDA', 'EFSA'],
    certifications: ['SQF', 'BRC', 'IFS', 'FSSC 22000']
  },
  chemical: {
    name: 'Chemical',
    requirements: ['PSM', 'RMP', 'REACH', 'GHS', 'Responsible Care'],
    regulations: ['EPA', 'OSHA', 'ECHA'],
    certifications: ['ISO 14001', 'RC 14001']
  },
  automotive: {
    name: 'Automotive',
    requirements: ['PPAP', 'APQP', 'FMEA', 'Traceability', 'EDI'],
    regulations: ['EPA', 'DOT', 'NHTSA'],
    certifications: ['IATF 16949', 'VDA 6.3']
  },
  aerospace: {
    name: 'Aerospace & Defense',
    requirements: ['AS9100', 'NADCAP', 'ITAR', 'EAR', 'Cybersecurity'],
    regulations: ['FAA', 'EASA', 'DOD'],
    certifications: ['AS9100', 'NADCAP', 'CMMC']
  },
  healthcare: {
    name: 'Healthcare',
    requirements: ['HIPAA', 'HITECH', 'Medical Device Regulations', 'Sterilization'],
    regulations: ['FDA', 'CMS', 'MHRA'],
    certifications: ['ISO 13485', 'HITRUST']
  },
  logistics: {
    name: 'Third-Party Logistics (3PL)',
    requirements: ['C-TPAT', 'AEO', 'IATA DGR', 'Cold Chain', 'Multi-client Security'],
    regulations: ['CBP', 'DOT', 'TSA'],
    certifications: ['ISO 28000', 'TAPA']
  },
  manufacturing: {
    name: 'Manufacturing',
    requirements: ['Quality Management', 'Lean Manufacturing', 'Industry 4.0', 'OEE'],
    regulations: ['OSHA', 'EPA'],
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 45001']
  },
  energy: {
    name: 'Energy & Utilities',
    requirements: ['NERC CIP', 'IEC 62351', 'Smart Grid', 'SCADA Security'],
    regulations: ['FERC', 'DOE', 'NRC'],
    certifications: ['ISO 27001', 'IEC 62443']
  },
  retail: {
    name: 'Retail',
    requirements: ['PCI DSS', 'Omnichannel', 'Inventory Accuracy', 'Loss Prevention'],
    regulations: ['FTC', 'State AGs'],
    certifications: ['PCI DSS', 'SOC 2']
  },
} as const;

// =============================================================================
// UN SUSTAINABLE DEVELOPMENT GOALS
// =============================================================================

export const unSDGs = {
  1: { number: 1, name: 'No Poverty', icon: '🎯' },
  2: { number: 2, name: 'Zero Hunger', icon: '🌾' },
  3: { number: 3, name: 'Good Health and Well-being', icon: '❤️' },
  4: { number: 4, name: 'Quality Education', icon: '📚' },
  5: { number: 5, name: 'Gender Equality', icon: '⚖️' },
  6: { number: 6, name: 'Clean Water and Sanitation', icon: '💧' },
  7: { number: 7, name: 'Affordable and Clean Energy', icon: '⚡' },
  8: { number: 8, name: 'Decent Work and Economic Growth', icon: '📈' },
  9: { number: 9, name: 'Industry, Innovation and Infrastructure', icon: '🏭' },
  10: { number: 10, name: 'Reduced Inequalities', icon: '🤝' },
  11: { number: 11, name: 'Sustainable Cities and Communities', icon: '🏙️' },
  12: { number: 12, name: 'Responsible Consumption and Production', icon: '♻️' },
  13: { number: 13, name: 'Climate Action', icon: '🌍' },
  14: { number: 14, name: 'Life Below Water', icon: '🐟' },
  15: { number: 15, name: 'Life on Land', icon: '🌳' },
  16: { number: 16, name: 'Peace, Justice and Strong Institutions', icon: '⚖️' },
  17: { number: 17, name: 'Partnerships for the Goals', icon: '🤝' },
} as const;

// =============================================================================
// COMMON TOOLTIPS
// =============================================================================

export const commonTooltips = {
  // Compliance
  'iso27001': {
    summary: 'International standard for information security management',
    details: 'ISO 27001 provides a framework for establishing, implementing, maintaining, and continually improving an information security management system (ISMS).',
    keyPoints: ['Risk-based approach', 'Continuous improvement', 'Third-party certification available'],
    criticality: 'critical' as const
  },
  'gdpr': {
    summary: 'EU regulation on data protection and privacy',
    details: 'The General Data Protection Regulation (GDPR) is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area.',
    keyPoints: ['Applies to EU citizens\' data globally', 'Requires lawful basis for processing', 'Heavy penalties for non-compliance'],
    criticality: 'critical' as const
  },
  'soc2': {
    summary: 'Trust service criteria for service organizations',
    details: 'SOC 2 is an auditing procedure that ensures service providers securely manage data to protect the interests of the organization and the privacy of its clients.',
    keyPoints: ['Five trust principles', 'Type I and Type II reports', 'Annual audit required'],
    criticality: 'warning' as const
  },
  
  // Technology
  '4ir': {
    summary: 'Fourth Industrial Revolution - Digital transformation era',
    details: 'The Fourth Industrial Revolution (4IR) is characterized by a fusion of technologies that blur the lines between physical, digital, and biological spheres.',
    keyPoints: ['IoT, AI, Big Data', 'Cyber-Physical Systems', 'Cloud Computing'],
    criticality: 'info' as const
  },
  '5ir': {
    summary: 'Fifth Industrial Revolution - Human-centric technology',
    details: 'The Fifth Industrial Revolution emphasizes the collaboration between humans and machines, focusing on personalization, sustainability, and human wellbeing.',
    keyPoints: ['Human-AI collaboration', 'Sustainability focus', 'Personalization'],
    criticality: 'info' as const
  },
  
  // Risk
  'critical-risk': {
    summary: 'Immediate action required',
    details: 'Critical risks require immediate attention and mitigation. Failure to address may result in severe business impact, legal consequences, or safety issues.',
    keyPoints: ['Likelihood × Impact = 20-25', 'Requires executive attention', 'Daily monitoring'],
    criticality: 'critical' as const
  },
  'high-risk': {
    summary: 'Priority attention needed',
    details: 'High risks should be addressed as a priority. These may significantly impact operations, compliance, or security if not properly managed.',
    keyPoints: ['Likelihood × Impact = 15-19', 'Weekly review required', 'Mitigation plan needed'],
    criticality: 'warning' as const
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getRegulatoryBodiesByJurisdiction(jurisdiction: string) {
  return Object.values(regulatoryBodies).filter(rb => rb.jurisdiction === jurisdiction);
}

export function getLawsByCategory(category: string) {
  return Object.values(laws).filter(l => l.category === category);
}

export function getStandardsByCategory(category: string) {
  return Object.values(complianceStandards).filter(s => s.category === category);
}

export function getIndustryRequirements(industry: keyof typeof industryVerticals) {
  return industryVerticals[industry];
}

export function getSDGInfo(sdgNumber: number) {
  return unSDGs[sdgNumber as keyof typeof unSDGs];
}

