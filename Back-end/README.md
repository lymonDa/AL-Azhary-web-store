# AL-AZHARI LIBRARY — Backend

Modular Monolith REST API backend for AL-AZHARI LIBRARY, built with Node.js, Express, TypeScript, and MongoDB Atlas.

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB Atlas cluster or local MongoDB instance

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and adjust the variables:
```bash
cp .env.example .env
```

### Development Server
```bash
npm run dev
```

### Production Build & Run
```bash
npm run build
npm start
```

### Testing
```bash
npm test
npm run test:watch
```

### Linting & Formatting
```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Documentation
For complete architectural details, see [ARCHITECTURE.md](ARCHITECTURE.md).
