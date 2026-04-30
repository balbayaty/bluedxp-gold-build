# Modern Icon Components

Sexy, modern icon components designed for the BlueDXP platform with a sleek, contemporary aesthetic.

## Icons

### ModernMicIcon
A stylized microphone icon with:
- Gradient fills when active
- Animated sound waves
- Smooth transitions
- Modern geometric design

### ModernSendIcon
A sleek send/paper plane icon with:
- Fluid curved design
- Speed line animations when active
- Gradient effects
- Minimalist aesthetic

## Usage

```tsx
import { ModernMicIcon, ModernSendIcon } from '@/components/icons';

// Basic usage
<ModernMicIcon size={24} isActive={false} />

// With custom styling
<ModernSendIcon 
  size={22} 
  isActive={true}
  className="text-indigo-400"
/>
```

## Props

### Common Props (both icons)
- `className?: string` - Additional CSS classes
- `size?: number` - Icon size in pixels (default: 24)
- `isActive?: boolean` - Active state with animations and gradients (default: false)

## Styling

The icons use:
- **Gradients**: Indigo → Purple → Pink for active states
- **Transitions**: Smooth 300ms transitions
- **Animations**: Pulse effects when active
- **Colors**: Adapts to current text color when inactive

## Integration

Use with `ModernIconButton` component for complete button styling:

```tsx
import { ModernIconButton } from '@/components/ui/ModernIconButton';

<ModernIconButton
  type="mic"
  onClick={handleClick}
  isActive={isRecording}
  size="md"
/>
```



