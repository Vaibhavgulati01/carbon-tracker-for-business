# Carbon Tracker for Business - UI/UX Documentation

A comprehensive carbon emission tracking SaaS platform with AI-powered insights.

## 🎨 User Interface Overview

### Application Flow

```
Landing Page → Register/Login → Organization Setup (one-time) → Main App
```

---

## 📱 Pages & Features

### 1. Landing Page (`/`)
- **Hero Section** - "Track Your Business Carbon Footprint" with gradient text
- **Stats Display** - Total emissions tracked, average reduction, companies using
- **Features Grid** - Real-time Dashboard, AI Insights, Activity Logging, Audit Reports
- **How It Works** - 3-step visual process
- **CTA Section** - "Start Free Today" button
- **Footer**

### 2. Authentication Pages
- **Login** (`/login`) - Email & password
- **Register** (`/register`) - Name, email, password, confirm password

### 3. Organization Setup (`/organization-setup`)
- **One-time setup** - Redirects if already completed
- **Fields**: Organization Name, Industry, Employees, Reporting Year, Operational Boundary
- **Auto-redirects** to Activities page after completion

### 4. Main App (Protected Routes)

#### Dashboard (`/dashboard`)
- **Time Period Filter** - Last Month, 6 Months, Year, All Time
- **Add Activity Button** - Quick link to log more data
- **Stats Cards** - Total Emissions, Scope 1/2/3 percentages
- **Charts**:
  - Pie Chart: Emissions by Scope
  - Bar Chart: Top Categories
  - Line Chart: Monthly Trends
- **Recent Activities Table** - Latest 5 entries
- **AI Insights Section** - Key findings and quick wins

#### What-If Scenarios (`/scenarios`)
- **Custom Scenario Input** - Describe your scenario
- **AI Analysis** - Predicts reduction impact
- **Saved Scenarios** - History of previous analyses

#### Download Audit (`/audit`)
- **Report Preview** - Shows formatted audit report
- **PDF Download** - Print dialog for PDF generation
- **Content**: Executive summary, scope breakdown, activities log

#### Account Details (`/account`)
- **User Profile** - Name, email, role
- **Organization Info** - Company details (read-only)
- **Logout Button**

---

## 🧭 Navigation

### Pre-Authentication
- No sidebar
- Header with logo and Login button

### Post-Authentication (4-Item Navbar)
| Icon | Label | Route |
|------|-------|-------|
| 📊 | Dashboard | `/dashboard` |
| 🔮 | What-If Scenarios | `/scenarios` |
| 📥 | Download Audit | `/audit` |
| 👤 | Account Details | `/account` |

---

## 🎨 Design System

### Colors
```css
--primary: #10B981       /* Green */
--secondary: #14B8A6     /* Teal */
--accent: #06B6D4        /* Cyan */
--bg-primary: #0F172A    /* Dark Blue */
--bg-secondary: #1E293B  /* Slate */
--scope1: #F59E0B        /* Amber */
--scope2: #3B82F6        /* Blue */
--scope3: #10B981        /* Green */
```

### Typography
- Font: Inter (system fallback)
- Headings: 600-800 weight
- Body: 400-500 weight

### Components
- **Cards** - Rounded corners, subtle borders, dark backgrounds
- **Buttons** - Primary (gradient), Secondary (slate), Outline variants
- **Forms** - Dark inputs with focus glow
- **Tables** - Hover states, alternating row indication
- **Charts** - Chart.js with custom color palette

---

## 📁 File Structure

```
frontend/src/
├── pages/
│   ├── LandingPage.jsx       # Public landing page
│   ├── Login.jsx             # Authentication
│   ├── Register.jsx          # User registration
│   ├── OrganizationSetup.jsx # One-time org setup
│   ├── Dashboard.jsx         # Main dashboard with filters
│   ├── ActivityEntry.jsx     # Log emissions
│   ├── ScenarioSimulation.jsx# What-if analysis
│   ├── AuditReport.jsx       # PDF report generator
│   └── AccountDetails.jsx    # User profile
├── components/
│   └── Layout/
│       └── Layout.jsx        # Sidebar + main content
├── context/
│   └── AuthContext.jsx       # Authentication state
├── services/
│   └── api.js                # Axios API client
└── index.css                 # Global styles
```

---

## 🔧 Key UI Features

1. **Responsive Design** - Mobile-friendly layouts
2. **Dark Theme** - Premium dark mode throughout
3. **Animations** - Fade-in effects, hover transitions
4. **Loading States** - Spinners and skeleton loaders
5. **Error Handling** - User-friendly error messages
6. **Empty States** - Helpful prompts when no data

---

## 🚀 Deployment

- **Frontend**: AWS S3 (Static Website Hosting)
- **Backend**: AWS Elastic Beanstalk
- **Database**: AWS DynamoDB
- **AI**: Groq LLaMA 3.3 70B

---

## 📝 Recent Updates

- ✅ Landing page with hero and features
- ✅ 4-item navigation bar
- ✅ Time-filtered dashboard
- ✅ Recent activities summary
- ✅ PDF audit report download
- ✅ One-time organization setup
- ✅ User state refresh after org creation
