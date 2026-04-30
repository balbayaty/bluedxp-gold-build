# Customer Logo System - Architecture Documentation

## 🎯 Overview

The Customer Logo System provides comprehensive infrastructure for displaying customer logos throughout the BlueDXP platform. Flex Logistics is configured as BlueDXP's first customer with full logo support.

## 📁 File Structure

```
public/
  customers/
    flex-logo.svg          # Flex Logistics logo file

components/
  customer/
    CustomerLogo.tsx      # Reusable customer logo component

contexts/
  CustomerContext.tsx     # Customer context provider

data/
  flexLogisticsCustomer.ts # Flex Logistics customer data

lib/
  services/
    customerLogoService.ts # Logo utility functions

types/
  tenant.ts               # Customer type with logo fields
```

## 🏗️ Architecture Components

### 1. Customer Type Extension

The `Customer` interface in `types/tenant.ts` includes:

```typescript
logo?: {
  url: string              // Path to logo file
  alt: string              // Alt text
  width?: number           // Preferred width
  height?: number          // Preferred height
  variant?: 'light' | 'dark' | 'full'
}
brandColor?: string        // Primary brand color
secondaryColor?: string    // Secondary brand color
```

### 2. Customer Context

`contexts/CustomerContext.tsx` provides:
- Current customer state management
- Customer list management
- LocalStorage persistence
- Default to Flex Logistics

### 3. Customer Logo Component

`components/customer/CustomerLogo.tsx` features:
- Multiple size variants (sm, md, lg, xl)
- Display variants (default, compact, full)
- Fallback to initials if no logo
- Smooth animations
- Responsive design

### 4. Logo Service

`lib/services/customerLogoService.ts` provides utilities:
- `getCustomerLogo()` - Get logo config
- `getLogoUrl()` - Get logo URL with fallback
- `hasCustomerLogo()` - Check if logo exists
- `getCustomerBrandColors()` - Get brand colors
- `validateLogoUrl()` - Validate logo URL
- `getLogoSize()` - Get size for context

## 🎨 Logo Display Locations

### 1. Header Navigation
- Shows alongside BlueDXP logo
- Compact variant
- Separated by divider

### 2. Sidebar (Future)
- Customer selector with logos
- Active customer highlight

### 3. Dashboard
- Customer-specific branding
- Logo in page headers

### 4. Documents & Reports
- PDF exports with customer logo
- Email templates with branding

### 5. Loading Screens
- Customer logo during initialization

## 📊 Flex Logistics Setup

### Customer Data
- **ID**: `customer-flex-001`
- **Name**: Flex Logistics
- **Logo**: `/customers/flex-logo.svg`
- **Brand Color**: `#FF6600` (Orange)
- **Status**: Active (Platinum Tier)

### Logo File
- **Location**: `public/customers/flex-logo.svg`
- **Dimensions**: 200x60px
- **Format**: SVG with gradient
- **Variant**: Full (light/dark compatible)

## 🔧 Usage Examples

### Display Customer Logo

```tsx
import CustomerLogo from '@/components/customer/CustomerLogo'
import { useCustomer } from '@/contexts/CustomerContext'

function MyComponent() {
  const { currentCustomer } = useCustomer()
  
  return (
    <CustomerLogo
      logo={currentCustomer?.logo}
      customerName={currentCustomer?.customerName || 'Customer'}
      size="md"
      variant="default"
      showName={true}
    />
  )
}
```

### Get Logo URL

```tsx
import { getLogoUrl } from '@/lib/services/customerLogoService'
import { useCustomer } from '@/contexts/CustomerContext'

function MyComponent() {
  const { currentCustomer } = useCustomer()
  const logoUrl = getLogoUrl(currentCustomer, '/default-logo.svg')
  
  return <img src={logoUrl} alt="Logo" />
}
```

### Set Current Customer

```tsx
import { useCustomer } from '@/contexts/CustomerContext'
import { flexLogisticsCustomer } from '@/data/flexLogisticsCustomer'

function CustomerSelector() {
  const { setCurrentCustomer } = useCustomer()
  
  const handleSelect = () => {
    setCurrentCustomer(flexLogisticsCustomer)
  }
  
  return <button onClick={handleSelect}>Select Flex Logistics</button>
}
```

## 🎯 Logo Requirements

### File Format
- **Preferred**: SVG (scalable, crisp)
- **Accepted**: PNG, JPG (with proper dimensions)

### Dimensions
- **Header**: 32px height (auto width)
- **Sidebar**: 40px height
- **Documents**: 60px height
- **Full Display**: 200px width

### Best Practices
1. Use SVG for logos when possible
2. Include light/dark variants if needed
3. Optimize file size (< 50KB)
4. Provide proper alt text
5. Test on different backgrounds

## 🔄 Adding New Customers

### Step 1: Add Logo File
```bash
# Place logo in public/customers/
public/customers/new-customer-logo.svg
```

### Step 2: Create Customer Data
```typescript
import { Customer } from '@/types/tenant'

export const newCustomer: Customer = {
  // ... customer fields
  logo: {
    url: '/customers/new-customer-logo.svg',
    alt: 'New Customer Logo',
    width: 200,
    height: 60,
    variant: 'full',
  },
  brandColor: '#0066CC',
  secondaryColor: '#3399FF',
}
```

### Step 3: Add to Context
```typescript
// In CustomerContext.tsx
import { newCustomer } from '@/data/newCustomer'

const [customers, setCustomers] = useState<Customer[]>([
  flexLogisticsCustomer,
  newCustomer,
])
```

## 🎨 Branding Integration

### CSS Variables (Future)
```css
:root {
  --customer-primary-color: #FF6600;
  --customer-secondary-color: #FF8533;
}
```

### Dynamic Theming
- Apply customer brand colors to UI elements
- Customize accent colors per customer
- Maintain BlueDXP base theme

## 📱 Responsive Behavior

- **Mobile**: Smaller logo sizes, compact display
- **Tablet**: Medium sizes, balanced layout
- **Desktop**: Full logo display, side-by-side with BlueDXP

## 🔐 Security & Validation

- Validate logo URLs (prevent XSS)
- Sanitize file paths
- Check file existence before display
- Fallback to default logo on error

## 📈 Performance

- Logo files cached by browser
- Lazy loading for off-screen logos
- SVG optimization
- CDN-ready structure

## 🚀 Future Enhancements

- [ ] Logo upload interface
- [ ] Multiple logo variants per customer
- [ ] Logo cropping/resizing tools
- [ ] Brand color theme application
- [ ] Logo analytics (usage tracking)
- [ ] White-label portal customization

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Status**: ✅ Production Ready

