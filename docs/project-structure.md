# Clarivo Project Structure

```
clarivo/
├── README.md                          # Project overview and setup
├── docs/                              # Documentation
│   └── project-structure.md           # This file
├── scripts/                           # Development and build scripts
│   ├── dev.bat                        # Start development environment
│   └── setup.bat                      # Initial project setup
├── backend/                           # FastAPI backend
│   ├── main.py                        # FastAPI application entry point
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Environment variables template
│   ├── app/                           # Application code
│   │   ├── __init__.py
│   │   ├── core/                      # Core configuration and utilities
│   │   │   ├── __init__.py
│   │   │   └── config.py              # Application settings
│   │   ├── models/                    # SQLAlchemy models
│   │   │   └── __init__.py
│   │   ├── services/                  # Business logic services
│   │   │   └── __init__.py
│   │   └── api/                       # API routes
│   │       ├── __init__.py
│   │       └── api_v1/                # API version 1
│   │           ├── __init__.py
│   │           └── api.py             # Main API router
│   └── tests/                         # Backend tests
│       ├── __init__.py
│       └── test_main.py               # Main application tests
└── frontend/                          # React + Electron frontend
    ├── package.json                   # Node.js dependencies and scripts
    ├── tsconfig.json                  # TypeScript configuration
    ├── tailwind.config.js             # Tailwind CSS configuration
    ├── postcss.config.js              # PostCSS configuration
    ├── public/                        # Static files
    │   ├── index.html                 # HTML template
    │   ├── electron.js                # Electron main process
    │   └── preload.js                 # Electron preload script
    └── src/                           # React source code
        ├── index.tsx                  # React entry point
        ├── index.css                  # Global styles
        ├── App.tsx                    # Main React component
        ├── components/                # React components
        ├── services/                  # API and external services
        │   └── api.ts                 # API client configuration
        ├── types/                     # TypeScript type definitions
        │   └── index.ts               # Core type definitions
        └── hooks/                     # Custom React hooks
```

## Key Features

### Backend (FastAPI)
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **Pandas**: Data manipulation and analysis
- **Plotly**: Interactive visualizations
- **spaCy**: Natural language processing
- **JWT Authentication**: Secure user authentication

### Frontend (React + Electron)
- **React 18**: Modern React with hooks and TypeScript
- **Electron**: Cross-platform desktop application framework
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Composable charting library
- **React Query**: Data fetching and caching
- **React Hot Toast**: Toast notifications

### Development Tools
- **TypeScript**: Type safety for JavaScript
- **Pytest**: Python testing framework
- **React Testing Library**: React component testing
- **ESLint & Prettier**: Code formatting and linting

## Getting Started

1. Run `scripts\setup.bat` to install dependencies
2. Run `scripts\dev.bat` to start development environment
3. Backend will be available at http://localhost:8000
4. Frontend will be available at http://localhost:3000
5. Electron app will launch automatically