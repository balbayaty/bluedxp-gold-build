/**
 * Chemcheck-style SDS prompt selector
 *
 * Goal: choose a prompt that maximizes extraction completeness depending on the
 * document quality (short text, noisy OCR, proper section structure, etc.)
 */

export type PromptVariant = "structured" | "ocr_noisy" | "short";

function hasSectionStructure(text: string): boolean {
  return (
    /section\s+\d+\s*[:.\-]/i.test(text) ||
    /##\s*IDENTIFICATION\s*##/i.test(text)
  );
}

function looksLikeOCRNoise(text: string): boolean {
  // Heuristics: lots of broken words / low vowel ratio / repeated characters
  const sample = text.slice(0, 4000);
  const letters = (sample.match(/[a-z]/gi) || []).length;
  const vowels = (sample.match(/[aeiou]/gi) || []).length;
  const ratio = letters > 0 ? vowels / letters : 0;
  const tooManyOdd =
    (sample.match(/[\uFFFD]{2,}|[|]{3,}|_{3,}/g) || []).length > 0;
  return ratio < 0.25 || tooManyOdd;
}

export function selectSdsExtractionPromptVariant(text: string): PromptVariant {
  const trimmed = (text || "").trim();
  if (trimmed.length < 1500) return "short";
  if (looksLikeOCRNoise(trimmed) && !hasSectionStructure(trimmed))
    return "ocr_noisy";
  return "structured";
}

export function buildSdsExtractionPrompt(text: string): string {
  const variant = selectSdsExtractionPromptVariant(text);
  const snippet = `${text.substring(0, 14000)} ${text.length > 14000 ? "... (truncated)" : ""}`;

  const schema = `Return ONLY valid JSON with this structure:
{
  "chemicalName": "string",
  "manufacturer": "string",
  "casNumber": "string|null",
  "ecNumber": "string|null",
  "unNumber": "string|null",
  "molecularFormula": "string|null",
  "productCode": "string|null",
  "hazardClass": "string|null",
  "hazardStatements": ["string"],
  "precautionaryStatements": ["string"],
  "firstAid": { "inhalation": "string|null", "skinContact": "string|null", "eyeContact": "string|null", "ingestion": "string|null" },
  "fireExtinguishingMedia": ["string"],
  "storageRequirements": ["string"],
  "physicalProperties": { "appearance": "string|null", "odor": "string|null", "ph": "string|number|null", "boilingPoint": "string|null", "flashPoint": "string|null", "density": "string|null", "solubility": "string|null" },
  "stabilityReactivity": { "stability": "string|null", "conditionsToAvoid": ["string"], "incompatibleMaterials": ["string"], "decompositionProducts": ["string"] },
  "regulatoryInformation": ["string"],
  "disposalConsiderations": "string|null",
  "transportInformation": { "transportClass": "string|null", "packingGroup": "string|null", "packagingType": "string|null" },
  "nfpa": { "health": "number|null", "flammability": "number|null", "reactivity": "number|null" },
  "confidence": 0.0
}`;

  const commonRules = `Rules:
- Do NOT invent values. If missing/unreadable, use null or empty arrays.
- Preserve exact identifiers: CAS (XX-XX-X), EC (XXX-XXX-X), UN (UN####), H-codes (Hxxx), P-codes (Pxxx).
- Prefer values from SECTION 1 (Identification), SECTION 2 (Hazards), SECTION 3 (Composition), SECTION 9 (Physical), SECTION 10 (Stability), SECTION 14 (Transport).
- Extract manufacturer name from SECTION 1 (Identification) - look for "Manufacturer:", "Supplier:", "Company:", or similar labels.
- Extract molecular formula from SECTION 3 (Composition) or SECTION 1 - look for chemical formulas like C6H12O6, H2SO4, etc.
- Extract hazard class from SECTION 2 (Hazards) or SECTION 14 (Transport) - look for UN classification, hazard class numbers, or GHS categories.
- Extract transport information from SECTION 14 (Transport) - UN number, packing group (PG I, PG II, PG III), transport class.
- Extract NFPA 704 diamond ratings if present - Health (0-4), Flammability (0-4), Reactivity (0-4).
- For physical properties, extract ALL available values: appearance, flash point, boiling point, pH, density, solubility.
- Be thorough - extract every field that is present in the document. Only use null if the field is truly not found.
`;

  if (variant === "ocr_noisy") {
    return `You are an expert SDS extractor working with OCR-noisy text. Your priority is to accurately recover identifiers and hazard codes even if formatting is broken.

${commonRules}

${schema}

SDS TEXT:
${snippet}`;
  }

  if (variant === "short") {
    return `You are an expert SDS extractor. The input may be partial. Extract whatever is present; do not guess missing fields.

${commonRules}

${schema}

SDS TEXT:
${snippet}`;
  }

  // structured
  return `Extract detailed information from this Safety Data Sheet (SDS). Use section headings to locate data.

${commonRules}

${schema}

SDS TEXT:
${snippet}`;
}
