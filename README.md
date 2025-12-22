# Carbon Emission Tracker for Businesses

A comprehensive enterprise-grade carbon accounting SaaS platform built with MERN stack on AWS infrastructure.

## 🌟 Features

- **User Authentication** - JWT-based secure login/register
- **Organization Setup** - Industry type, employee count, reporting year
- **Activity Data Entry** - Manual input + CSV bulk upload
- **Emission Calculation** - Scope 1, 2, 3 calculations with DEFRA/IPCC factors
- **Interactive Dashboard** - Chart.js visualizations (pie, bar, line)
- **AI Insights** - Gemini API-powered emission analysis
- **What-If Scenarios** - Simulate reduction strategies
- **Dark Theme UI** - Premium emerald/teal design

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + Vite |
| Backend | Node.js + Express.js |
| Database | AWS DynamoDB |
| AI | Google Gemini API |
| Charts | Chart.js |
| Auth | JWT + bcrypt |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS Account with DynamoDB tables
- Gemini API Key

### Backend Setup

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## 📁 Project Structure

```
carbon-tracker-for-business/
├── backend/
│   ├── config/         # DynamoDB configuration
│   ├── routes/         # API routes
│   ├── middleware/     # Auth middleware
│   ├── utils/          # Emission calculator, Gemini service
│   └── server.js       # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # Auth context
│   │   └── services/   # API service
│   └── index.html
│
└── README.md
```

## 🔧 DynamoDB Tables Required

1. `CarbonTracker_Users` - userId (PK), email (GSI)
2. `CarbonTracker_Organizations` - organizationId (PK)
3. `CarbonTracker_Activities` - activityId (PK), organizationId-date-index (GSI)
4. `CarbonTracker_EmissionFactors` - factorId (PK)
5. `CarbonTracker_Calculations` - calculationId (PK)
6. `CarbonTracker_Scenarios` - scenarioId (PK)

## 🌐 API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/organizations` - Create organization
- `POST /api/activities` - Add activity
- `GET /api/dashboard/overview` - Dashboard data
- `GET /api/ai/insights` - AI-generated insights
- `POST /api/ai/scenario` - What-if simulation

## 📊 Emission Scopes

- **Scope 1**: Direct emissions (fuel, company vehicles)
- **Scope 2**: Indirect energy (purchased electricity)
- **Scope 3**: Value chain (travel, waste, purchased goods)

## 🚀 Deployment

See `implementation_plan.md` for detailed AWS deployment guide:
- Backend → AWS Elastic Beanstalk
- Frontend → S3 + CloudFront
- Database → DynamoDB

## 📝 License

MIT
