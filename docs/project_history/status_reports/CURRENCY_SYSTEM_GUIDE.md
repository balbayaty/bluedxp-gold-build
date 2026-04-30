# 💰 Currency System Guide
## SAR (Saudi Riyal) - ر.س

---

## ✅ **What's Implemented**

### **1. Currency System**
- **Default Currency**: SAR (Saudi Riyal) - ر.س
- **10 Supported Currencies**: SAR, USD, EUR, GBP, AED, KWD, BHD, OMR, QAR, JOD
- **Automatic Formatting**: Proper decimal places, thousand separators
- **Symbol Display**: Currency symbol (ر.س) visible throughout the app

### **2. Components Created**
- `CurrencyDisplay` - Display formatted currency amounts
- `CurrencyBadge` - Show current currency symbol
- `CurrencySelector` - Dropdown to change currency
- `CurrencyContext` - Global currency state management

### **3. Visible Locations**
- **Header**: Currency selector/badge in top navigation bar
- **Settings**: Full currency management at `/settings/currency`
- **All Pages**: Currency formatting available via `CurrencyDisplay` component

---

## 🎨 **How to Use**

### **Basic Usage - Display Currency**

```tsx
import CurrencyDisplay from '@/components/CurrencyDisplay'

// Simple usage
<CurrencyDisplay amount={1234.56} />

// With options
<CurrencyDisplay 
  amount={1234.56}
  size="lg"              // 'sm' | 'md' | 'lg'
  variant="highlight"     // 'default' | 'highlight' | 'muted'
  compact={true}          // Show as 1.2K, 1.5M for large numbers
  showSymbol={true}       // Show currency symbol (default: true)
  showCode={false}        // Show currency code (default: false)
/>
```

### **Using Currency Context**

```tsx
import { useCurrency } from '@/contexts/CurrencyContext'

function MyComponent() {
  const { currency, currencyInfo, formatCurrency, setCurrency } = useCurrency()
  
  // Get current currency code
  console.log(currency) // 'SAR'
  
  // Get currency info
  console.log(currencyInfo.symbol) // 'ر.س'
  console.log(currencyInfo.name)   // 'Saudi Riyal'
  
  // Format amount
  const formatted = formatCurrency(1234.56)
  // Returns: "ر.س 1,234.56"
  
  // Change currency
  setCurrency('USD')
}
```

### **Direct Utility Functions**

```tsx
import { formatCurrency, getCurrency } from '@/utils/currency'

// Format with specific currency
const formatted = formatCurrency(1234.56, 'SAR')
// Returns: "ر.س 1,234.56"

// Get currency info
const sarInfo = getCurrency('SAR')
console.log(sarInfo.symbol) // 'ر.س'
```

---

## 🔄 **Updating Existing Pages**

### **Before (Old Way)**
```tsx
<div className="text-sm text-white">
  {item.currency} {item.valuation.toFixed(2)}
</div>
```

### **After (New Way)**
```tsx
import CurrencyDisplay from '@/components/CurrencyDisplay'

<CurrencyDisplay 
  amount={item.valuation}
  size="sm"
  variant="default"
/>
```

### **Benefits**
- ✅ Automatic currency symbol (ر.س)
- ✅ Proper formatting (thousand separators)
- ✅ Consistent styling
- ✅ Easy to change currency globally
- ✅ Responsive to currency changes

---

## 📍 **Where Currency Appears**

### **1. Header Navigation**
- **Desktop**: Currency selector dropdown (shows symbol + code)
- **Mobile**: Currency badge (shows symbol only)
- **Location**: Top right, before other icons

### **2. Settings Page**
- **URL**: `/settings/currency`
- **Features**:
  - View current currency
  - Select from 10 currencies
  - See examples of formatting
  - Currency information

### **3. All Financial Displays**
- Inventory valuations
- Purchase order totals
- Sales order amounts
- Freight costs
- Stock valuations
- Any monetary value

---

## 🎯 **Supported Currencies**

| Code | Symbol | Name | Decimal Places |
|------|--------|------|----------------|
| **SAR** | ر.س | Saudi Riyal | 2 |
| USD | $ | US Dollar | 2 |
| EUR | € | Euro | 2 |
| GBP | £ | British Pound | 2 |
| AED | د.إ | UAE Dirham | 2 |
| KWD | د.ك | Kuwaiti Dinar | 3 |
| BHD | د.ب | Bahraini Dinar | 3 |
| OMR | ر.ع. | Omani Rial | 3 |
| QAR | ر.ق | Qatari Riyal | 2 |
| JOD | د.أ | Jordanian Dinar | 3 |

---

## 🎨 **Design System Integration**

### **Styling**
- Follows Hazalyze design system
- Glassmorphism effects
- Cyan/Blue gradient accents
- Smooth animations
- Responsive design

### **Color Scheme**
- **Default**: White text
- **Highlight**: Cyan-400 (for important amounts)
- **Muted**: Gray-400 (for secondary amounts)

### **Sizes**
- **sm**: `text-sm` (14px)
- **md**: `text-base` (16px) - Default
- **lg**: `text-xl` (20px)

---

## 🔧 **Advanced Usage**

### **Custom Formatting**
```tsx
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

function CustomDisplay({ amount }: { amount: number }) {
  const { currency } = useCurrency()
  
  // Custom format with code
  const formatted = formatCurrency(amount, currency, {
    showSymbol: true,
    showCode: true,
    compact: false
  })
  
  return <span className="custom-class">{formatted}</span>
}
```

### **Currency Conversion** (Future)
```tsx
import { convertCurrency } from '@/utils/currency'

// Convert from SAR to USD
const usdAmount = convertCurrency(1000, 'SAR', 'USD')
// Returns: ~270 (approximate)
```

---

## 📝 **Migration Checklist**

To update existing pages to use the new currency system:

- [ ] Import `CurrencyDisplay` component
- [ ] Replace hardcoded currency displays
- [ ] Remove `currency` prop from data (use context instead)
- [ ] Test currency switching
- [ ] Verify formatting looks correct
- [ ] Check mobile responsiveness

### **Example Migration**

**File**: `app/inventory/page.tsx`

**Before**:
```tsx
{item.currency} {item.valuation.toFixed(2)}
```

**After**:
```tsx
import CurrencyDisplay from '@/components/CurrencyDisplay'

<CurrencyDisplay amount={item.valuation} size="sm" />
```

---

## 🚀 **Quick Start**

1. **Currency is already set to SAR (ر.س)** - No action needed
2. **Currency selector is in header** - Click to change
3. **Use CurrencyDisplay component** - Import and use anywhere
4. **Settings page** - Visit `/settings/currency` for full control

---

## 💡 **Tips**

- ✅ Currency preference is saved in localStorage
- ✅ Changes apply immediately across the app
- ✅ Symbol (ر.س) is always visible in header
- ✅ Use `compact` option for large numbers (1.2K, 1.5M)
- ✅ Use `variant="highlight"` for important amounts
- ✅ Currency context is available globally

---

**The currency system is fully integrated and ready to use!**


