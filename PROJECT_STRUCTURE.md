# Project File Structure

## Monorepo Root
```
cms/
├── apps/
│   ├── admin-portal/          # Admin dashboard application
│   │   ├── src/
│   │   │   ├── app/           # Next.js app directory
│   │   │   │   ├── api/       # API routes
│   │   │   │   ├── appearance/publisher-form/  # Form configuration page
│   │   │   │   ├── auth/      # Authentication pages
│   │   │   │   ├── dashboard/ # Dashboard page
│   │   │   │   ├── offers/    # Offers management pages
│   │   │   │   └── publishers/applications/  # Publisher applications
│   │   │   ├── components/    # React components
│   │   │   └── lib/          # Utility functions
│   │   ├── md/               # Documentation
│   │   └── package.json
│   │
│   └── publisher-portal/     # Publisher-facing application
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/      # API routes
│       │   │   ├── apply/    # Application form page
│       │   │   └── apply/success/  # Success page
│       │   └── components/   # React components
│       └── package.json
│
├── packages/
│   ├── auth/                 # Authentication package
│   │   └── src/
│   │
│   ├── database/             # Database package
│   │   └── src/
│   │
│   ├── publishers/           # Publisher form package (main focus)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── modals/   # Modal components
│   │   │   │   │   ├── ConfirmationModal.tsx
│   │   │   │   │   ├── FileUploadModal.tsx
│   │   │   │   │   ├── FromSubjectLinesModal.tsx
│   │   │   │   │   ├── MultipleCreativeView.tsx
│   │   │   │   │   └── SingleCreativeView.tsx
│   │   │   │   └── ui/       # UI components
│   │   │   │       ├── button.tsx
│   │   │   │       ├── card.tsx
│   │   │   │       ├── error-message.tsx
│   │   │   │       ├── ImagePreview.tsx
│   │   │   │       ├── input.tsx
│   │   │   │       ├── label.tsx
│   │   │   │       ├── select.tsx
│   │   │   │       ├── separator.tsx
│   │   │   │       ├── textarea.tsx
│   │   │   │       └── validation-summary.tsx
│   │   │   │
│   │   │   ├── constants/    # Constants and configuration
│   │   │   │   ├── Constants/
│   │   │   │   │   └── Constants.ts
│   │   │   │   ├── apiEndpoints.ts
│   │   │   │   ├── fileUpload.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── form/         # Form components
│   │   │   │   ├── Steps/    # Form step components
│   │   │   │   │   ├── PersonalDetails.tsx
│   │   │   │   │   ├── ContactDetails.tsx
│   │   │   │   │   └── CreativeDetails.tsx
│   │   │   │   ├── CreativeForm.tsx      # Main form component
│   │   │   │   ├── admin-editor.tsx      # Admin configuration editor
│   │   │   │   ├── applications.ts       # Backend integration
│   │   │   │   ├── config.ts            # Form configuration types
│   │   │   │   ├── offers-helper.ts     # Offers integration
│   │   │   │   ├── onboarding.ts       # Onboarding logic
│   │   │   │   ├── schema.ts           # Database schema
│   │   │   │   ├── storage.ts          # File storage
│   │   │   │   └── submission-schema.ts # Submission schema
│   │   │   │
│   │   │   ├── hooks/        # React hooks
│   │   │   │   ├── useFormValidation.ts
│   │   │   │   ├── useFileUpload.ts
│   │   │   │   ├── useUploadProgress.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── lib/          # Library/utility functions
│   │   │   │   ├── creativeClient.ts
│   │   │   │   ├── filesClient.ts
│   │   │   │   ├── generationClient.ts
│   │   │   │   ├── proofreadCreativeClient.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── types/        # TypeScript types
│   │   │   │   └── upload.ts
│   │   │   │
│   │   │   ├── upload/       # Upload utilities
│   │   │   │   ├── constants.ts
│   │   │   │   └── storage.ts
│   │   │   │
│   │   │   ├── utils/        # Utility functions
│   │   │   │   └── validations.ts
│   │   │   │
│   │   │   └── index.ts      # Package entry point
│   │   │
│   │   ├── md/               # Documentation
│   │   │   └── COMPLETE_FORM_MIGRATION.md
│   │   └── package.json
│   │
│   ├── rate-limit/          # Rate limiting package
│   │   └── src/
│   │
│   ├── types/               # Shared TypeScript types
│   │   └── src/
│   │
│   └── ui/                  # Shared UI components
│       └── src/
│
├── publisher-form-reference/  # Reference repository (cloned)
│   ├── app/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
│
├── .gitignore
├── package.json             # Root package.json
├── pnpm-lock.yaml          # pnpm lock file
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── turbo.json              # Turborepo configuration
└── SETUP.md                # Setup documentation
```

## Key Directories

### Apps
- **admin-portal**: Admin dashboard for managing offers, publishers, and form configuration
- **publisher-portal**: Public-facing application where publishers submit creative applications

### Packages
- **@repo/publishers**: Main package containing the publisher form implementation
  - Form components (CreativeForm, step components)
  - UI components (buttons, inputs, modals)
  - Hooks (validation, file upload)
  - API clients (creative, files, generation)
  - Constants and configuration

- **@repo/auth**: Authentication package
- **@repo/database**: Database package
- **@repo/types**: Shared TypeScript types
- **@repo/rate-limit**: Rate limiting package

### Reference Repository
- **publisher-form-reference**: Cloned repository used as reference for form UI and logic

## Important Files

### Form Implementation
- `packages/publishers/src/form/CreativeForm.tsx` - Main form component
- `packages/publishers/src/form/Steps/*.tsx` - Step components
- `packages/publishers/src/components/modals/*.tsx` - Modal components
- `packages/publishers/src/hooks/useFormValidation.ts` - Validation logic

### Configuration
- `packages/publishers/src/constants/Constants/Constants.ts` - Form constants
- `packages/publishers/src/form/config.ts` - Form configuration types
- `packages/publishers/src/form/admin-editor.tsx` - Admin configuration UI

### API Integration
- `packages/publishers/src/lib/*Client.ts` - API client functions
- `packages/publishers/src/constants/apiEndpoints.ts` - API endpoint definitions

### Entry Points
- `apps/publisher-portal/src/app/apply/page.tsx` - Publisher form page
- `apps/admin-portal/src/app/appearance/publisher-form/page.tsx` - Form configuration page
- `packages/publishers/src/index.ts` - Package exports

