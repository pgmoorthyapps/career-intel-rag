# shadcn/ui Integration

The template comes with shadcn/ui pre-configured and ready to use. This guide covers the configuration, component structure, and how to add new components.

## Installation

The template has shadcn/ui already configured. To add new components:

```bash
# Add individual components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add data-table

# Add multiple components
npx shadcn@latest add button card input
```

## Configuration

The shadcn/ui configuration is stored in `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

## Available Components

### UI Foundation Components

Core building blocks from shadcn/ui:

- **Button** - Various button styles and states
- **Input** - Text inputs, search fields, and form controls
- **Card** - Content containers and panels
- **Badge** - Status indicators and labels
- **Avatar** - User profile images and fallbacks
- **Dialog** - Modals and overlays
- **Dropdown Menu** - Context menus and select options
- **Tabs** - Tabbed content navigation
- **Sheet** - Side panels and drawers
- **Tooltip** - Contextual information popups

### Form Components

Complete form handling solution:

- **Form** - React Hook Form integration
- **Select** - Enhanced select dropdowns
- **Checkbox** - Checkbox inputs with indeterminate state
- **Radio Group** - Radio button groups
- **Switch** - Toggle switches
- **Textarea** - Multi-line text inputs
- **Date Picker** - Date and time selection

### Data Display Components

- **Calendar** - Date picker and event display
- **Progress** - Progress bars and indicators
- **Skeleton** - Loading placeholders
- **Accordion** - Collapsible content sections

### Navigation Components

- **Breadcrumb** - Hierarchical navigation paths
- **Pagination** - Page navigation controls
- **Command** - Command palette for quick actions

## Component Structure

All shadcn/ui components follow a consistent pattern:

```typescript
// Example: Button component structure (base-nova style)
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
        lg: "h-9 gap-1.5 px-2.5",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

The components are built on [Base UI](https://base-ui.com). To render a component as a
different element, pass it through the `render` prop (Base UI's equivalent of Radix's
`asChild`). When a Button renders something that is not a `<button>`, add
`nativeButton={false}`:

```tsx
<Button render={<a href="/docs" />} nativeButton={false}>
  Read the docs
</Button>

<DropdownMenuTrigger render={<Button variant="outline" />}>
  Open menu
</DropdownMenuTrigger>
```

## Form Integration

React Hook Form integration with schema validation:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

function UserForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## Styling and Customization

### CSS Variables

All components use CSS variables for theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
}
```

### Component Variants

Use `class-variance-authority` for component variants:

```typescript
const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        destructive: "border-destructive",
        outline: "border-2",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Custom Styling

Extend components with custom classes:

```typescript
<Button 
  variant="outline" 
  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
>
  Custom Button
</Button>
```

## Accessibility

All shadcn/ui components follow accessibility best practices:

- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Proper ARIA labels and descriptions
- **Focus Management** - Logical focus order and visible focus indicators
- **Color Contrast** - WCAG AA compliant color combinations

## Performance

Components are optimized for performance:

- **Tree Shaking** - Only import what you use
- **Lazy Loading** - Components load on demand
- **Memoization** - React.memo for expensive components
- **Bundle Splitting** - Automatic code splitting
