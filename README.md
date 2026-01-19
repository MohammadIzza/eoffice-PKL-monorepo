# FRONTEND STRUCTURE DOCUMENTATION

## 📁 Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public routes (login/register)
│   ├── (dashboard)/              # Protected routes (main app)
│   ├── pengajuan/pkl/            # PKL submission flow
│   └── surat/detail/[id]/        # Letter detail
│
├── components/
│   ├── ui/                       # Atomic UI components (shadcn/ui)
│   ├── features/pkl/             # PKL-specific components
│   ├── layouts/                  # Layout wrappers
│   └── shared/                   # Shared components
│
├── services/                     # API integration
│   ├── auth.service.ts
│   ├── letter.service.ts
│   └── approval.service.ts
│
├── hooks/                        # Custom React hooks
│   ├── api/                      # API-related hooks
│   │   ├── useAuth.ts
│   │   ├── useLetters.ts
│   │   └── useApproval.ts
│   └── ui/                       # UI-related hooks
│       └── useToast.ts
│
├── types/                        # TypeScript types
│   ├── letter.types.ts
│   ├── user.types.ts
│   ├── approval.types.ts
│   └── common.types.ts
│
├── stores/                       # State management (Zustand)
│   ├── authStore.ts
│   └── pklFormStore.ts
│
└── lib/
    ├── api.ts                    # API client
    ├── utils.ts                  # Utilities
    └── constants/                # App constants
        └── index.ts
```

## 🎯 Separation of Concerns

### 1. **Routing & Pages** (`app/`)
- Only render components
- No business logic
- Use route groups: `(auth)` and `(dashboard)`

### 2. **UI Components** (`components/ui/`)
- Atomic, reusable components
- No business logic
- Props only

### 3. **Feature Components** (`components/features/`)
- Domain-specific logic
- Can use hooks and state
- PKL forms, approval UI, etc.

### 4. **Services** (`services/`)
- API integration
- Pure functions
- Return promises

### 5. **Hooks** (`hooks/`)
- Business logic
- Side effects
- State management

### 6. **Types** (`types/`)
- TypeScript interfaces
- Type definitions
- Centralized types

### 7. **Stores** (`stores/`)
- Global state (Zustand)
- Auth, form state, etc.

## 🚀 Usage Examples

### Page Component
```tsx
// app/(dashboard)/surat/page.tsx
import { LetterList } from '@/components/features/letters';

export default function LettersPage() {
  return <LetterList />;
}
```

### Feature Component
```tsx
// components/features/letters/LetterList.tsx
import { useLetters } from '@/hooks/api';

export function LetterList() {
  const { letters, isLoading } = useLetters();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{/* render letters */}</div>;
}
```

### Hook
```tsx
// hooks/api/useLetters.ts
import { useQuery } from '@tanstack/react-query';
import { letterService } from '@/services';

export function useLetters() {
  return useQuery({
    queryKey: ['letters'],
    queryFn: () => letterService.getMyLetters()
  });
}
```

### Service
```tsx
// services/letter.service.ts
import { client } from '@/lib/api';

export const letterService = {
  getMyLetters: () => client.letter.my.get()
};
```

## 📦 Next Steps

1. Move existing pages to route groups
2. Implement services layer
3. Create custom hooks
4. Setup state management
5. Add type definitions
