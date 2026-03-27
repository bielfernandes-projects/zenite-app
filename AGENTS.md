# AGENTS.md - Zenite App Development Guide

## Project Overview

This is a Vite + React + TypeScript + Tailwind + shadcn-ui project with React Router, React Query, and Vitest for testing.

---

## Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build
```

### Linting & Type Checking
```bash
npm run lint         # Run ESLint on all files
npx tsc --noEmit     # Type check without emitting
```

### Testing
```bash
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode

# Run a single test file
npx vitest run src/test/example.test.ts

# Run a specific test by name
npx vitest run -t "should pass"
```

---

## Code Style Guidelines

### Imports
- Use path aliases (`@/` for `src/`) - configured in `tsconfig.json`
- Group imports: external libs → internal components/hooks → types
- Use type imports where possible: `import { type SomeType } from "..."`

```typescript
// Good
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
```

### Formatting
- Use 2 spaces for indentation (matching ESLint config)
- Semicolons at end of statements
- Single quotes for strings (except JSX props)
- Max line length: 100 characters

### TypeScript
- Prefer explicit types for function parameters and return types
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` - use `unknown` when type is truly unknown
- Enable strict mode in tsconfig

### Naming Conventions
- **Components**: PascalCase (`Dashboard.tsx`, `StudentCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useStudents.ts`)
- **Utils**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Constants**: UPPER_SNAKE_CASE for enums, PascalCase for component names
- **Files**: kebab-case for non-component files (`my-utility.ts`)

### React Patterns
- Use functional components with hooks
- Destructure props when possible
- Keep components focused (single responsibility)
- Extract复用逻辑 to custom hooks

### Error Handling
- Use try/catch for async operations
- Display user-friendly error messages via toast/sonner
- Log errors to console in development

### CSS/Tailwind
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Follow shadcn-ui component patterns
- Use semantic class names when custom styles needed

---

## Project Structure

```
src/
├── components/      # Reusable UI components (shadcn + custom)
│   └── ui/         # shadcn-ui components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and configs
├── pages/          # Route pages
├── data/           # Mock data and data utilities
└── test/           # Test files
```

---

## Testing

- Test files: `*.test.ts` or `*.spec.ts` in `src/`
- Setup file: `src/test/setup.ts` (includes `@testing-library/jest-dom`)
- Run single test: `npx vitest run <path-to-test>`