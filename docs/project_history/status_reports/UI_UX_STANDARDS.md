# UI/UX Standards & Guidelines

## 🎨 Design System Standards

### Typography
- **Headings**: 
  - H1: `text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight`
  - H2: `text-xl sm:text-2xl font-semibold text-white leading-tight`
  - H3: `text-lg font-semibold text-white leading-tight`
  - Body: `text-sm sm:text-base text-white leading-relaxed`
  - Small: `text-xs text-[#9ca3af] leading-normal`

### Spacing
- **Container Padding**: `p-4 sm:p-6 lg:p-8`
- **Card Padding**: `p-4 sm:p-6`
- **Section Gap**: `gap-4 sm:gap-6`
- **Element Gap**: `gap-2 sm:gap-3`
- **Margin Bottom**: `mb-4 sm:mb-6`

### Colors
- **Primary Background**: `bg-[#1f2937]` (gray-800)
- **Secondary Background**: `bg-white/5` (semi-transparent)
- **Border**: `border-white/10`
- **Text Primary**: `text-white`
- **Text Secondary**: `text-[#9ca3af]` (gray-400)
- **Text Muted**: `text-[#6b7280]` (gray-500)
- **Accent**: `text-cyan-400` / `bg-cyan-500`
- **Success**: `text-green-400` / `bg-green-500`
- **Warning**: `text-yellow-400` / `bg-yellow-500`
- **Error**: `text-red-400` / `bg-red-500`

### Buttons
- **Primary**: `bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors`
- **Secondary**: `bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors`
- **Icon Button**: `p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors`

### Input Fields
- **Standard**: `bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500`
- **With Icon**: Add `pl-10` and icon positioned `absolute left-3 top-1/2 -translate-y-1/2`

### Cards
- **Standard**: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all`
- **Large**: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6`

### Tables
- **Header**: `px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider`
- **Cell**: `px-4 py-3 text-sm text-white`
- **Row Hover**: `hover:bg-white/5 transition-colors`

### Badges/Tags
- **Status**: `px-2 py-1 rounded text-xs font-medium`
- **Platinum**: `bg-purple-500/20 text-purple-400`
- **Gold**: `bg-yellow-500/20 text-yellow-400`
- **Silver**: `bg-gray-500/20 text-gray-400`
- **Active**: `bg-green-500/20 text-green-400`
- **Inactive**: `bg-gray-500/20 text-gray-400`

### Icons
- **Size**: `text-lg` (18px) for standard, `text-xl` (20px) for larger
- **Color**: `text-cyan-400` for primary, `text-[#9ca3af]` for secondary
- **Spacing**: Always use `gap-2` or `gap-3` with flex items-center

### Responsive Design
- **Mobile First**: Always start with mobile styles, then add `sm:`, `md:`, `lg:` breakpoints
- **Grid**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- **Flex**: `flex flex-col sm:flex-row items-start sm:items-center gap-4`

### Alignment Rules
1. **Text Alignment**: 
   - Headers: Always left-aligned (`text-left`)
   - Numbers: Right-aligned (`text-right`)
   - Labels: Left-aligned with consistent spacing

2. **Vertical Alignment**:
   - Use `items-center` for horizontal flex containers
   - Use `items-start` for vertical flex containers with varying heights
   - Use `justify-between` for space distribution

3. **Spacing Consistency**:
   - All cards: `p-4 sm:p-6`
   - All sections: `space-y-6`
   - All grids: `gap-4 sm:gap-6`
   - All buttons: `px-4 py-2` or `px-6 py-3`

4. **Truncation**:
   - Long text: `truncate` or `line-clamp-2`
   - Tables: `truncate` on cells
   - Cards: `line-clamp-2` on descriptions

### Accessibility
- **Focus States**: Always include `focus:outline-none focus:ring-1 focus:ring-cyan-500`
- **ARIA Labels**: Add `aria-label` to icon-only buttons
- **Keyboard Navigation**: All interactive elements should be keyboard accessible
- **Color Contrast**: Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)

### Animation
- **Page Load**: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- **Stagger**: `transition={{ delay: index * 0.05 }}`
- **Hover**: `transition-all` with `hover:` states
- **Duration**: 150ms for standard, 200ms for complex

### Charts
- **Container**: `ResponsiveContainer width="100%" height={300}` or `height={400}`
- **Colors**: Use consistent color palette
- **Tooltips**: Dark background `#1f2937` with white text
- **Axes**: `stroke="#9ca3af" fontSize={12}`
- **Grid**: `strokeDasharray="3 3" stroke="#374151"`

### Modals
- **Backdrop**: `bg-black/50 backdrop-blur-sm`
- **Container**: `bg-[#1f2937] border border-white/10 rounded-2xl p-6`
- **Sizes**: `max-w-md` (small), `max-w-lg` (medium), `max-w-2xl` (large)

### Loading States
- **Spinner**: `w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin`
- **Skeleton**: `bg-white/5 rounded animate-pulse`

### Error States
- **Message**: `text-red-400 text-sm`
- **Border**: `border-red-500`
- **Background**: `bg-red-500/10`

### Success States
- **Message**: `text-green-400 text-sm`
- **Border**: `border-green-500`
- **Background**: `bg-green-500/10`

---

## ✅ Checklist for Every Page

- [ ] Consistent padding (`p-4 sm:p-6 lg:p-8`)
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Consistent spacing (`gap-4 sm:gap-6`)
- [ ] Text truncation for long content
- [ ] Responsive grid layouts
- [ ] Proper focus states
- [ ] ARIA labels on icon buttons
- [ ] Consistent button styles
- [ ] Proper color usage
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile-friendly layout

---

## 🎯 Component Patterns

### Page Header Pattern
```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 mt-0.5">
      <i className={`${icon} text-white text-lg sm:text-xl`}></i>
    </div>
    <div className="min-w-0 flex-1">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
        {title}
      </h1>
      <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
        {description}
      </p>
    </div>
  </div>
  {actions && (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
      {actions}
    </div>
  )}
</div>
```

### Card Pattern
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
>
  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
    <i className="ri-icon-line text-cyan-400"></i>
    Title
  </h3>
  {/* Content */}
</motion.div>
```

### Table Pattern
```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-white/5 border-b border-white/10">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/10">
      <tr className="hover:bg-white/5 transition-colors">
        <td className="px-4 py-3 text-sm text-white">
          Content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Button Group Pattern
```tsx
<div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
  {options.map((option) => (
    <button
      key={option.id}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 min-h-[36px] ${
        isActive
          ? 'bg-cyan-500 text-white'
          : 'text-[#9ca3af] hover:text-white hover:bg-white/5'
      }`}
    >
      <i className={option.icon}></i>
      <span className="hidden sm:inline">{option.label}</span>
    </button>
  ))}
</div>
```

---

**Last Updated**: [Current Date]
**Version**: 1.0.0

