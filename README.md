# Contract Intelligence

An AI-powered system that transforms complex legal contracts into interactive, understandable information. Upload a contract, get a plain-language breakdown, and ask questions — all answered directly from the document.

> **Disclaimer:** This system is not a substitute for legal advice. Always consult a qualified lawyer before acting on any contract information.

---

## Key Features

- **Document Upload** — PDF and DOCX support (digital documents only)
- **Plain-Language Summary** — Contract explained in 2–3 clear sentences
- **Clause Extraction** — Key clauses identified, categorized, and explained
- **Risk Detection** — Clauses flagged as low, medium, or high risk
- **Interactive Q&A** — Ask questions and get grounded answers sourced only from the contract
- **Uncertainty Signaling** — Every answer tagged with a confidence level (high / medium / low)
- **Feedback & Accuracy Metric** — Rate answers to build a real accuracy signal over time
- **Fully Local** — Runs entirely on your machine. No data leaves your environment.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Hono |
| Language | TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Vector Store | ChromaDB |
| LLM | Ollama (llama3.2:3b) |
| Embeddings | Ollama (nomic-embed-text) |
| File Parsing | pdf-parse, mammoth |
| File Uploads | multer |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript |
| HTTP Client | Axios |
| Styling | Inline styles (no external CSS framework) |

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           React Frontend (Vite)         │
│   Upload │ Contract Overview │ Chat UI  │
└──────────────────┬──────────────────────┘
                   │ HTTP / REST
┌──────────────────▼──────────────────────┐
│              Hono API Server            │
│  /upload  /contracts  /ask  /feedback   │
└───┬──────────────┬──────────────┬───────┘
    │              │              │
┌───▼───┐    ┌─────▼────┐  ┌─────▼──────┐
│  File │    │PostgreSQL│  │  ChromaDB  │
│Storage│    │ Metadata │  │  Vectors   │
└───────┘    └──────────┘  └─────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │   Ollama    │
                          │ llama3.2:3b │
                          │nomic-embed  │
                          └─────────────┘
```

---

## Prerequisites

- Node.js 20.19+ (or 22.12+)
- PostgreSQL with pgAdmin
- Docker Desktop (for ChromaDB)
- [Ollama](https://ollama.com) installed and running

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourname/contract-intelligence.git
cd contract-intelligence
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Pull Ollama models

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

### 5. Start ChromaDB

```bash
docker run -d -p 8000:8000 --name chromadb chromadb/chroma
```

### 6. Create the database

In pgAdmin, create a new database named `contract_intelligence`.

### 7. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see Environment Variables below).

### 8. Run database migrations

```bash
npm run db:generate
npm run db:migrate
```

### 9. Start the backend

```bash
npm run dev
```

### 10. Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `3002` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/contract_intelligence` |
| `CHROMA_URL` | ChromaDB base URL | `http://localhost:8000` |
| `OLLAMA_URL` | Ollama base URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | LLM model for analysis and Q&A | `llama3.2:3b` |
| `OLLAMA_EMBED_MODEL` | Embedding model | `nomic-embed-text` |

---

## Usage

1. Open the frontend at `http://localhost:5173`
2. Upload a PDF or DOCX contract (digital, not scanned)
3. Wait 30–60 seconds for analysis to complete
4. Review the plain-language summary and extracted clauses
5. Click **Ask Questions** to open the chat interface
6. Ask anything about the contract — answers are grounded in the document only
7. Rate answers with 👍 or 👎 to build an accuracy signal

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check — pings all three services |
| `POST` | `/api/upload` | Upload a contract file |
| `GET` | `/api/contracts` | List all contracts |
| `GET` | `/api/contracts/:id` | Get contract with clauses |
| `GET` | `/api/contracts/:id/status` | Poll processing status |
| `POST` | `/api/contracts/:id/ask` | Ask a question about a contract |
| `GET` | `/api/contracts/:id/session` | Get full Q&A history |
| `POST` | `/api/feedback/:messageId` | Submit thumbs up/down rating |
| `GET` | `/api/contracts/stats/accuracy` | Aggregate accuracy metrics |

---

## Folder Structure

```
contract-intelligence/
├── src/
│   ├── config/
│   │   └── index.ts          # Environment config with fail-fast validation
│   ├── db/
│   │   ├── client.ts         # PostgreSQL connection via Drizzle
│   │   └── schema.ts         # Table definitions
│   ├── lib/
│   │   ├── chunker.ts        # Sliding window text chunker
│   │   └── storage.ts        # File storage path helpers
│   ├── middleware/
│   │   └── logger.ts         # Request logger middleware
│   ├── routes/
│   │   ├── health.ts         # GET /health
│   │   ├── upload.ts         # POST /api/upload
│   │   ├── contracts.ts      # GET /api/contracts/*
│   │   ├── qa.ts             # POST /api/contracts/:id/ask
│   │   └── feedback.ts       # POST /api/feedback/:messageId
│   ├── services/
│   │   ├── analysis.ts       # Contract analysis via LLM
│   │   ├── chroma.ts         # ChromaDB client and helpers
│   │   ├── document.ts       # Text extraction and processing
│   │   ├── embedding.ts      # Embed, store, and query chunks
│   │   ├── ollama.ts         # Ollama API client
│   │   └── qa.ts             # Full Q&A pipeline
│   └── index.ts              # App entry point
├── storage/
│   └── contracts/            # Uploaded contract files
├── frontend/
│   └── src/
│       ├── api/
│       │   └── index.ts      # All API calls
│       ├── components/
│       │   ├── UploadView.tsx
│       │   ├── ContractView.tsx
│       │   └── ChatView.tsx
│       ├── types/
│       │   └── index.ts      # Shared TypeScript types
│       ├── App.tsx
│       └── main.tsx
├── drizzle/                  # Auto-generated migration files
├── .env.example
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## Future Improvements / Roadmap

- [ ] Multi-contract comparison side by side
- [ ] Jurisdiction-specific risk rules
- [ ] Streaming Q&A responses
- [ ] User authentication and contract ownership
- [ ] Advanced risk scoring with weighted clause analysis
- [ ] Multi-language contract support
- [ ] Contract version diffing
- [ ] Export analysis as PDF report
- [ ] Integration with legal professional review workflow
- [ ] GPU acceleration for faster local inference
- [ ] Upgrade to Mistral or larger model as hardware permits

---

## Development Notes

**Model memory:** The system runs two Ollama models sequentially — `nomic-embed-text` for embeddings, then `llama3.2:3b` for analysis and Q&A. On machines with less than 6GB of free RAM, the embed model is explicitly unloaded before the LLM loads. If you have more RAM available, you can remove the `unloadModel` calls in `upload.ts` and `qa.ts` for faster processing.

**ChromaDB:** Must be running before the backend starts. If you restart your machine, run `docker start chromadb` before `npm run dev`.

**Port conflicts:** If port 3002 is occupied, change `PORT` in `.env`. Update the proxy in `frontend/vite.config.ts` to match.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

Please keep commits focused and descriptive. One feature or fix per PR.

---

## License

MIT
