# Frontend — React + Vite

Three role-based portals.

## What's in Here

```
3_frontend/
├── README.md                ← You are here
├── App.tsx                  ← Main app with routes
├── main.tsx                 ← Entry point
├── index.css                ← Global styles
│
├── components/
│   ├── layout/              ← Layout components
│   │   ├── UserLayout.tsx
│   │   └── AdminLayout.tsx
│   └── common/              ← Reusable UI components
│       ├── Badge.tsx
│       └── RaahatLogo.tsx
│
├── pages/
│   ├── Auth/                ← Login, Register
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   │
│   ├── User/                ← Citizen portal
│   │   ├── UserDashboard.tsx
│   │   ├── VoiceAssessment.tsx
│   │   ├── ChatAssessment.tsx
│   │   ├── AssessmentResult.tsx
│   │   ├── MyCase.tsx
│   │   ├── NearbyHelp.tsx
│   │   ├── ProfilePage.tsx
│   │   └── Recommendations.tsx
│   │
│   ├── Admin/               ← Officer/Government portal
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminCaseList.tsx
│   │   ├── AdminCaseDetail.tsx
│   │   ├── AdminReports.tsx
│   │   ├── AdminSecurity.tsx
│   │   └── GeoAnalysis.tsx
│   │
│   ├── Counsellor/          ← STUBBED (deferred)
│   │   └── CounsellorPortal.tsx
│   │
│   └── Shared/              ← Public/shared pages
│       ├── LandingPage.tsx
│       ├── PrivacyPage.tsx
│       └── CaseSummary.tsx
│
├── data/
│   └── sampleData.ts        ← Sample data for demo
│
├── utils/
│   ├── api.ts               ← API client (fetch wrapper)
│   ├── aiEngine.ts          ← Local NLP engine (client-side mirror)
│   └── assessmentStore.ts   ← localStorage state management
│
└── types/
    └── speech.d.ts          ← TypeScript types for Web Speech API
```

## Three Portals

### 1. User Portal (Citizens)
Routes handled by [components/layout/UserLayout.tsx](components/layout/UserLayout.tsx):
- `/dashboard` — User home
- `/assessment/voice` — Voice assessment
- `/assessment/chat` — Text assessment
- `/case/:id` — View case
- `/nearby-help` — Help centers map
- `/profile` — Profile settings

### 2. Admin Portal (Officers)
Routes handled by [components/layout/AdminLayout.tsx](components/layout/AdminLayout.tsx):
- `/admin` — Dashboard
- `/admin/cases` — All cases
- `/admin/cases/:id` — Case detail
- `/admin/reports` — Reports
- `/admin/geo` — Geo analysis
- `/admin/security` — Security

### 3. Counsellor Portal (STUBBED)
Per user request, the counsellor portal is deferred.
A placeholder exists at [pages/Counsellor/CounsellorPortal.tsx](pages/Counsellor/CounsellorPortal.tsx).

## File-by-File (Key Files)

### [App.tsx](App.tsx)
Main component. Defines all routes using React Router.

### [main.tsx](main.tsx)
Entry point. Mounts the React app to `#root`.

### [utils/api.ts](utils/api.ts)
- API client wrapper
- Adds JWT token to every request
- Handles 401 (redirects to login)
- Returns `ApiResponse<T>` for type safety

### [utils/aiEngine.ts](utils/aiEngine.ts)
- **Client-side NLP engine** (mirrors backend logic)
- Used for instant feedback before sending to server
- Falls back gracefully if backend is down

### [utils/assessmentStore.ts](utils/assessmentStore.ts)
- Manages latest assessment in localStorage
- Syncs to backend if logged in
- Custom event dispatch for cross-component updates

### [components/layout/UserLayout.tsx](components/layout/UserLayout.tsx)
- Sidebar navigation for users
- Header with profile dropdown
- Mobile-responsive

### [components/layout/AdminLayout.tsx](components/layout/AdminLayout.tsx)
- Sidebar navigation for admins
- District filter
