# CLAUDE.md — PyME OS Frontend (Next.js 14 + TailwindCSS + Lucide)

## Engineering Standards

### Before Any Edit
1. **Read the target file completely** before making any change.
2. **Check `lib/api.ts`** for existing API methods before adding new ones — do not duplicate.
3. For new components, check `components/shared/` and `components/ui/` for reusable bases.

### User Feedback — No Native Dialogs
- **NEVER use `alert()`, `confirm()`, or `prompt()`** anywhere in the codebase.
  These are browser-native dialogs that can be blocked or suppressed, providing no feedback.
- Use the Toast system instead:
  ```tsx
  import { useToast } from "@/hooks/useToast";
  // Inside component:
  const toast = useToast();
  toast.success("Mensaje de éxito");
  toast.error("Mensaje de error");
  toast.warning("Advertencia");
  toast.info("Información");
  ```
- `ToastProvider` is wired in `app/(dashboard)/layout.tsx` — all dashboard pages have access.

### Button / Action UX
- **All interactive buttons must have visible text labels**, not just icons.
  An icon-only button is not accessible and confuses users who don't recognize the icon.
- Show a loading state during async operations: disable the button and show a spinner or "...".
- Use `disabled:opacity-50` for disabled state styling.

### API Calls
- ALL API calls go through `apiFetch` in `lib/api.ts` — never call `fetch` directly in components.
- When adding a backend endpoint, add the corresponding TypeScript method to the relevant `*Api`
  object in `lib/api.ts` before using it in a component.
- Always check the backend route prefix (e.g., `/api/procesos`, `/api/automatizaciones-python`)
  before writing the client method path.

### State Management Patterns
- Page data fetching: `useCallback` + `useEffect` pattern with explicit `setLoading(true/false)`.
- After mutations, always re-fetch: `await cargar()` — no optimistic updates.
- Error state: use `setErrorCarga(msg)` for load errors, toast for action errors.

### Error Display
- **Load errors** (initial data fetch fails): show an inline red banner with AlertTriangle icon
  and a "Reintentar" button that calls `cargar()`.
- **Action errors** (create/update/delete fails): show a `toast.error()` — never a banner.
- **Empty states** (no data yet): show `<EmptyState>` component or a friendly centered message
  with an icon — never show an error UI for empty data.

### Code Style
- TailwindCSS only — no inline styles.
- Lucide icons from `lucide-react`, consistent sizing: `h-4 w-4` for body, `h-3 w-3` for compact.
- `cn()` from `@/lib/utils` for all conditional class strings.
- All user-visible strings in Spanish (this is an Argentine product).
- Do not add TypeScript `any` types unless the external data shape is genuinely unknown.
