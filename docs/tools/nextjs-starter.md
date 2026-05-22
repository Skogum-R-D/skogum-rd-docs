# Next.js Starter Template

`Skogum-R-D/skogum-nextjs-starter` is the canonical Next.js 16.2 template that the frontend agent copies instead of generating components from scratch.

## Why it exists

Early frontend agent iterations suffered from recurring TypeScript build failures caused by incompatibilities between Framer Motion's `MotionProps` and React's `HTMLAttributes`. The agent would generate a `Button` component with Framer Motion inside, which compiles locally but fails the TypeScript strict check every time.

The starter template fixes these patterns once, permanently, so agents can copy correct code instead of re-deriving it.

## File index

| File | Purpose |
|---|---|
| `package.json` | Pinned dependency versions — always copy as-is |
| `next.config.js` | `output: "standalone"` for Docker builds |
| `tailwind.config.ts` | Tailwind v3 config with dark theme CSS variables |
| `tsconfig.json` | TypeScript config (strict mode) |
| `postcss.config.js` | PostCSS for Tailwind v3 |
| `app/layout.tsx` | Root layout with `className="dark"` on `<html>` |
| `app/globals.css` | Tailwind directives + glassmorphism + gradient-text utilities |
| `components/ui/button.tsx` | Button with CVA variants — **no Framer Motion inside** |
| `components/ui/card.tsx` | Card with Framer Motion — uses `(props as any)` pattern |
| `components/ui/input.tsx` | Styled text input |
| `components/ui/badge.tsx` | Status badge with color variants |
| `lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |

## Critical patterns

### Button — never add Framer Motion inside

```tsx
// CORRECT — wrap in motion.div at the call site
<motion.div whileHover={{ scale: 1.02 }}>
  <Button variant="default" size="lg">Click me</Button>
</motion.div>

// WRONG — causes TypeScript errors
<motion.button asChild ...>  // ❌
```

Adding Framer Motion inside Button conflicts with `ButtonProps`/`asChild` and generates a hard-to-diagnose TypeScript error on every build.

### Card — always use `(props as any)` at the spread site

```tsx
// CORRECT — already in the template
<motion.div {...(props as any)} />

// WRONG — causes MotionProps / HTMLAttributes conflict
<motion.div {...props} />   // ❌
```

### No `src/` prefix

```
app/          ← NOT src/app/
components/   ← NOT src/components/
lib/          ← NOT src/lib/
```

### Dockerfile — always mkdir public

```dockerfile
RUN npm run build && mkdir -p /app/public
```

### No next-themes

Do not use `next-themes` — it is incompatible with React 19. Set dark mode directly:

```tsx
<html lang="en" className="dark">
```

## How the frontend agent uses it

The agent calls `_fetch_starter()` at the start of every task, which fetches all 12 files from the repo via `github_get_file`. The content is injected into the Mistral prompt under the heading **"Starter Template — copy these files verbatim"**.

This means the agent always has the correct, pre-validated component code in context and is instructed to copy it exactly rather than generate new implementations.

## Dependency versions

```json
{
  "next": "16.2.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^3.4.0",
  "framer-motion": "^11.3.28",
  "lucide-react": "^0.468.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.5"
}
```
