# Rate Cards & Service Categories Integration Analysis

## Current State

### ✅ What Exists

1. **Rate Cards Page** (`/proposals/rate-cards`)
   - Shows rate cards by category
   - Displays rates, volume discounts, validity
   - View/edit rate cards
   - Categories: WAREHOUSING, TRANSPORTATION, CUSTOMS, RAIL, COLD_CHAIN

2. **Service Catalog Page** (`/proposals/services`)
   - Shows service categories
   - Lists services with pricing
   - Categories: WAREHOUSING, TRANSPORTATION, CUSTOMS_CLEARANCE, FREIGHT_FORWARDING, RAIL_FREIGHT, VALUE_ADDED

3. **RFQ Creation** (`/proposals/rfq/new`)
   - Has service category selection
   - Uses service categories when creating RFQ

### ❌ What's Missing

1. **Rate Cards → Proposal Creation**
   - Rate cards are NOT used when creating proposals
   - No way to select a rate card when creating proposal
   - Pricing doesn't come from rate cards

2. **Service Categories → Proposal Creation**
   - Service catalog exists but not integrated
   - Can't select services when creating proposal
   - Services don't flow into proposal sections

3. **Pricing Integration**
   - Proposals created with empty/default pricing
   - No automatic pricing from rate cards
   - No service-based pricing calculation

## Integration Plan

### Phase 1: Rate Cards Integration
- Add rate card selector to proposal builder
- Load rates from selected rate card
- Auto-populate pricing section
- Show volume discounts

### Phase 2: Service Categories Integration
- Add service category selector
- Allow selecting multiple services
- Auto-generate sections based on services
- Pull pricing from service catalog

### Phase 3: Smart Pricing
- Calculate pricing from rate cards + services
- Apply volume discounts automatically
- Show pricing breakdown
- Update when quantities change

---

*Currently rate cards and service categories are separate - they need to be integrated into proposal creation!*
