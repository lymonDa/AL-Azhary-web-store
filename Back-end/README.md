# AL-AZHARI LIBRARY — Backend

Modular Monolith REST API backend for **AL-AZHARI LIBRARY**, built with Node.js, Express, TypeScript (strict mode), and MongoDB Atlas via Mongoose.

---

## Getting Started

### Prerequisites
* Node.js >= 20.0.0
* npm >= 10.0.0
* MongoDB Atlas cluster or local MongoDB instance

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and fill in required values:
```bash
cp .env.example .env
```
*(The existing `.env` secrets provided by the project owner are authoritative).*

### Development Server
```bash
# Starts the server with live reload via tsx watch
npm run dev
```

### Production Build & Run
```bash
# Typecheck and compile TypeScript to dist/
npm run build

# Start the compiled production server
npm start
```

### Verification & Testing
```bash
# Typecheck TypeScript code without emitting
npm run typecheck

# Lint with ESLint
npm run lint

# Run all automated tests (Jest + Supertest)
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Documentation

* [Architecture Overview](docs/ARCHITECTURE.md)
* [Error Handling & Response Envelopes](docs/ERROR-HANDLING.md)
* [Environment Configuration & Safety](docs/ENVIRONMENT.md)
* [Phase 0 Foundation Details](docs/PHASE-0-FOUNDATION.md)
