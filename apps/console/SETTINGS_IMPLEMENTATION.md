# System Settings Page Implementation

## Overview

Comprehensive system settings page for the KU-WAVE-PLAT admin console, built with Next.js 14+ App Router, TypeScript, and shadcn/ui components.

## Files Created/Modified

### 1. UI Components (`src/components/ui/`)
- **select.tsx** - Radix UI Select component with shadcn/ui styling
- **form.tsx** - React Hook Form integration with Radix UI primitives
- **toast.tsx** - Already existed (Sonner toast notifications)

### 2. Type Definitions (`src/types/`)
- **settings.ts** - TypeScript interfaces for system settings
  - `SystemSettings` - Main settings interface
  - `UpdateSystemSettingsRequest` - Update payload type
  - `UploadImageResponse` - Image upload response type
  - `ApiResponse<T>` - Generic API response wrapper

### 3. Validation (`src/lib/validations/`)
- **settings.ts** - Zod schema for form validation
  - `systemSettingsSchema` - Complete validation rules matching backend
  - `validateImageFile()` - Client-side image file validation

### 4. API Client (`src/lib/api/`)
- **client.ts** - Base axios instance with interceptors
  - JWT token auto-injection
  - 401 redirect to login
  - Centralized error handling
  
- **settings.ts** - Type-safe settings API functions
  - `getSystemSettings()` - Fetch current settings
  - `updateSystemSettings(data)` - Update settings
  - `uploadSystemImage(file)` - Upload DID player image
  - `getImageUrl(path)` - Generate full image URL

### 5. Main Page (`src/app/(dashboard)/settings/page.tsx`)
- **Comprehensive settings form** with all required features

## Features Implemented

### Form Fields
1. **API 통신주기** (API Interval)
   - Select dropdown with 5-minute increments (5-60분)
   - Validation: 5-60, multiples of 5

2. **실행주기** (Execution Interval)
   - Select dropdown with 1-minute increments (1-60분)
   - Validation: 1-60

3. **블랙 시간 설정** (Blackout Time)
   - Start Time: Time picker (07:00부터)
   - End Time: Time picker (12:00까지)
   - Cross-field validation: start < end

4. **DID 플레이어 기본 이미지** (Default Image)
   - File upload input
   - Image preview with Next.js Image component
   - Remove image functionality
   - Client-side validation (JPEG/PNG, max 5MB)

### Data Management
- **TanStack Query** for server state
  - `useQuery` for fetching settings
  - `useMutation` for updates and uploads
  - Automatic cache invalidation

- **React Hook Form** for form state
  - Zod schema validation
  - Type-safe form values
  - Error messaging

### User Experience
- **Loading States**
  - Full-page loader during initial fetch
  - Button loading indicators during mutations
  - Upload progress feedback

- **Error Handling**
  - Toast notifications for success/error
  - Form-level error messages
  - Field-level validation feedback

- **Accessibility**
  - ARIA labels on inputs
  - Semantic HTML
  - Keyboard navigation support
  - Screen reader friendly

- **Responsive Design**
  - Mobile-first approach
  - Grid layout adapts to screen size
  - Touch-friendly controls

### Visual Enhancements
- Information callout for blackout time explanation
- Image preview with removal button
- Consistent spacing and typography
- Icon usage (lucide-react)

## API Integration

### Endpoints Used
```typescript
GET    /api/v1/settings/system           // Fetch settings
PUT    /api/v1/settings/system           // Update settings
POST   /api/v1/settings/system/upload-image  // Upload image
```

### Request/Response Flow
1. Page loads → `getSystemSettings()` → Populate form
2. User edits → Form validation (Zod)
3. Image upload → `uploadSystemImage()` → Preview + path storage
4. Form submit → `updateSystemSettings()` → Success toast + cache refresh

## Validation Rules

### API Interval
- Type: Integer
- Range: 5-60
- Step: 5 (multiples of 5 only)
- Error: "API 통신주기는 5분 단위여야 합니다"

### Execution Interval
- Type: Integer
- Range: 1-60
- Step: 1
- Error: "실행주기는 최소 1분이어야 합니다"

### Blackout Start Time
- Format: HH:mm
- Range: 07:00 - 23:59
- Error: "블랙 시간 시작은 07:00부터 가능합니다"

### Blackout End Time
- Format: HH:mm
- Range: 00:00 - 12:00
- Constraint: Must be after start time
- Error: "블랙 시간 시작은 종료 시간보다 이전이어야 합니다"

### Image File
- Types: image/jpeg, image/png
- Max Size: 5MB
- Recommended: 1920x1080
- Error: "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다"

## Dependencies Added

```json
{
  "@hookform/resolvers": "^3.x.x"  // Zod integration for React Hook Form
}
```

Existing dependencies used:
- react-hook-form
- zod
- @tanstack/react-query
- axios
- sonner (toast notifications)
- lucide-react (icons)
- next/image (optimized images)

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage

### Development
```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Access page
http://localhost:3000/settings
```

### Testing Checklist
- [ ] Form loads with current settings
- [ ] API interval dropdown shows 5-60 in 5-min steps
- [ ] Execution interval dropdown shows 1-60 minutes
- [ ] Time pickers enforce min/max constraints
- [ ] Image upload validates file type and size
- [ ] Image preview displays correctly
- [ ] Remove image button works
- [ ] Form validation prevents invalid submissions
- [ ] Success toast appears on save
- [ ] Error toast appears on failure
- [ ] Settings persist after page refresh
- [ ] Responsive layout works on mobile
- [ ] Keyboard navigation functional
- [ ] Screen reader announces errors

## Code Quality

### TypeScript Strict Mode
- All types explicitly defined
- No `any` types used
- Full type safety across API boundaries

### Best Practices
- Separation of concerns (types, validation, API, UI)
- Reusable validation schemas
- Centralized API client
- Error boundary ready
- Performance optimized (React Query caching)

## Future Enhancements

Potential improvements:
1. Image cropping/resizing tool
2. Bulk settings import/export
3. Settings history/audit log
4. Preview mode before saving
5. Advanced scheduling (recurring blackout times)
6. Multi-file upload support
7. Image optimization on upload
8. Real-time settings validation with backend

## Troubleshooting

### Common Issues

**Form not loading**
- Check API connection (NEXT_PUBLIC_API_URL)
- Verify backend is running on port 8000
- Check browser console for errors

**Image upload fails**
- Verify file size < 5MB
- Check file type is JPEG or PNG
- Ensure backend accepts multipart/form-data

**Validation errors persist**
- Clear browser cache
- Check Zod schema matches backend rules
- Verify form field names match schema

**TypeScript errors**
- Run `pnpm typecheck` to identify issues
- Ensure all dependencies installed
- Check import paths are correct

## Related Documentation

- [Backend Settings Module](/apps/api/src/modules/settings/README.md)
- [shadcn/ui Form Component](https://ui.shadcn.com/docs/components/form)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)

---

**Last Updated**: 2026-02-01
**Author**: Claude Code Implementation
**Version**: 1.0.0
