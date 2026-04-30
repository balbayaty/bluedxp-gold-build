# Premium Loading Components Guide

## 🎨 Overview

This guide covers the premium loading component library designed to provide a consistent, professional loading experience throughout the BlueDXP platform.

## 📦 Components

### 1. PremiumSpinner

A sophisticated spinner with multiple variants.

```tsx
import { PremiumSpinner } from '@/components/loading'

// Default spinner
<PremiumSpinner size="md" />

// Minimal variant
<PremiumSpinner size="lg" variant="minimal" />

// Pulse dots variant
<PremiumSpinner size="sm" variant="pulse" />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `variant`: 'default' | 'minimal' | 'pulse' (default: 'default')
- `className`: Additional CSS classes

---

### 2. PremiumLoader

A complete loading component with optional message.

```tsx
import { PremiumLoader } from '@/components/loading'

// Inline loader
<PremiumLoader message="Loading data..." size="md" />

// Full-screen overlay
<PremiumLoader 
  message="Initializing platform..." 
  size="lg" 
  fullScreen 
/>
```

**Props:**
- `message`: Optional loading message
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `variant`: 'default' | 'minimal' | 'pulse' (default: 'default')
- `fullScreen`: Show as full-screen overlay (default: false)
- `className`: Additional CSS classes

---

### 3. SkeletonLoader Components

Skeleton loaders for better perceived performance.

```tsx
import { 
  SkeletonLoader, 
  SkeletonBox, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable 
} from '@/components/loading'

// Basic skeleton
<SkeletonLoader count={3} height="h-4" />

// Text skeleton
<SkeletonText lines={4} />

// Card skeleton
<SkeletonCard />

// Table skeleton
<SkeletonTable rows={5} columns={4} />
```

**Use Cases:**
- **SkeletonBox**: Individual loading bars
- **SkeletonText**: Text content placeholders
- **SkeletonCard**: Card component placeholders
- **SkeletonTable**: Table data placeholders

---

### 4. ButtonLoader

Spinner specifically designed for buttons.

```tsx
import { ButtonLoader } from '@/components/loading'

<button>
  <ButtonLoader size="md" />
  Processing...
</button>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `className`: Additional CSS classes

---

### 5. LoadingButton

Complete button component with built-in loading state.

```tsx
import { LoadingButton } from '@/components/loading'

<LoadingButton
  loading={isSubmitting}
  variant="primary"
  size="md"
  onClick={handleSubmit}
>
  Submit Proposal
</LoadingButton>
```

**Props:**
- `loading`: Boolean loading state
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- All standard button HTML attributes

---

### 6. ProgressLoader

Animated progress bar with optional percentage.

```tsx
import { ProgressLoader } from '@/components/loading'

// Auto-progress
<ProgressLoader label="Uploading..." showPercentage />

// Controlled progress
<ProgressLoader 
  progress={uploadProgress} 
  label="Processing files"
  size="lg"
/>
```

**Props:**
- `progress`: Number 0-100 (optional, auto if not provided)
- `label`: Optional label text
- `showPercentage`: Show percentage (default: false)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `className`: Additional CSS classes

---

### 7. PremiumLoadingScreen

Full-screen premium loading experience (used on app initialization).

```tsx
import { PremiumLoadingScreen } from '@/components/loading'

// Automatically handles stages and progress
<PremiumLoadingScreen />
```

---

## 🎯 Usage Patterns

### Pattern 1: Data Fetching

```tsx
const [loading, setLoading] = useState(true)
const [data, setData] = useState([])

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false))
}, [])

if (loading) {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </div>
  )
}

return <DataList data={data} />
```

### Pattern 2: Form Submission

```tsx
const [submitting, setSubmitting] = useState(false)

const handleSubmit = async () => {
  setSubmitting(true)
  try {
    await submitForm()
  } finally {
    setSubmitting(false)
  }
}

return (
  <LoadingButton
    loading={submitting}
    onClick={handleSubmit}
    variant="primary"
  >
    Save Changes
  </LoadingButton>
)
```

### Pattern 3: File Processing

```tsx
const [processing, setProcessing] = useState(false)
const [progress, setProgress] = useState(0)

{processing && (
  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl">
    <PremiumLoader message="Processing files..." size="lg" />
    <ProgressLoader 
      progress={progress} 
      showPercentage 
      className="mt-4"
    />
  </div>
)}
```

### Pattern 4: Inline Loading

```tsx
{isLoading ? (
  <PremiumLoader message="Loading..." size="sm" />
) : (
  <Content />
)}
```

---

## 🎨 Design Principles

1. **Consistency**: Use the same loading components throughout
2. **Feedback**: Always show what's happening
3. **Performance**: Use skeletons for better perceived performance
4. **Accessibility**: Loading states should be accessible
5. **Branding**: Maintain BlueDXP visual identity

---

## 📱 Responsive Behavior

All loading components are responsive and adapt to screen size:
- Mobile: Smaller spinners, compact layouts
- Tablet: Medium sizes
- Desktop: Full-featured with animations

---

## ⚡ Performance Tips

1. **Use skeletons** for initial page loads
2. **Show progress** for long operations
3. **Debounce** rapid state changes
4. **Lazy load** heavy components
5. **Optimize animations** with CSS transforms

---

## 🔧 Customization

All components accept `className` prop for custom styling:

```tsx
<PremiumSpinner 
  className="text-blue-500" 
  size="lg" 
/>
```

---

## 📚 Examples

See these files for real-world usage:
- `app/page.tsx` - Initial loading screen
- `app/msds-intelligence/page.tsx` - Processing indicator
- `app/transportation/proposals/page.tsx` - Data loading
- `components/Layout.tsx` - Auth loading state

---

## 🚀 Best Practices

1. ✅ Always show loading state for async operations
2. ✅ Use appropriate component size for context
3. ✅ Provide meaningful loading messages
4. ✅ Use skeletons for list/card loading
5. ✅ Show progress for file uploads/downloads
6. ❌ Don't show loading for < 200ms operations
7. ❌ Don't use multiple loading indicators simultaneously
8. ❌ Don't block UI unnecessarily

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0

