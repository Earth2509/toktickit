# TokTickIT — IT Service Desk Application (Lab 1)

TokTickIT is an IT service desk web application for Account and Access, Hardware, Software, and Network requests. Lab 1 establishes the initial full-stack **vertical slice** proving that all system layers (React UI → Express REST API → Prisma ORM → Database) function seamlessly together.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Bootstrap 5
- **Backend**: Node.js, Express, TypeScript
- **ORM / Database**: Prisma ORM, PostgreSQL / SQLite (for local dev)
- **Testing**: Vitest, Supertest, React Testing Library

---

## Directory Structure

```text
toktickit/
├── client/                 # React UI frontend (Vite + TypeScript + Bootstrap)
│   ├── src/                # Component logic and API wrappers
│   └── tests/lab-01/       # Vitest UI test suite
├── server/                 # Express REST API backend
│   ├── prisma/             # Schema definitions & database seed scripts
│   ├── src/                # Express app & route handlers
│   └── tests/lab-01/       # Supertest API test suite
├── docs/lab-01/            # Submission documentation & evidence
│   ├── ai_use.md
│   ├── reviewer.md
│   └── tests.md
├── .gitignore              # Repository ignore rules
└── README.md               # Project documentation
```

---

## Getting Started

### 1. Install Dependencies

Install dependencies for both client and server:

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure Environment & Database

Copy `.env.example` files to `.env` in both folders:

```bash
# In server/
npx prisma db push
npm run prisma:seed
```

### 3. Run Development Servers

Start the Express backend API (Port 3000):

```bash
# Inside server/
npm run dev
```

Start the Vite React frontend (Port 5173):

```bash
# Inside client/
npm run dev
```

Open `http://localhost:5173` in your browser and click **[Check System]**.

---

## Automated Testing

To run backend API tests (Supertest + Vitest):

```bash
cd server
npm test
```

To run frontend UI tests (Vitest + Testing Library):

```bash
cd client
npm test
```

---

## API Endpoints

- `GET /api/health` — Returns `{ "status": "ok", "service": "TokTickIT API" }`
- `GET /api/categories` — Returns array of 4 seeded IT request categories (`Account and Access`, `Hardware`, `Software`, `Network`)