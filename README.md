# Clarivo - AI-Powered Data Analysis Tool

Clarivo is a comprehensive data analysis platform that combines the power of AI with intuitive data visualization and cleaning tools. It provides a modern web interface for uploading, analyzing, and visualizing datasets with AI-powered insights.

## 🚀 Features

- **Data Upload & Management**: Drag-and-drop CSV file upload with automatic processing
- **AI-Powered Analysis**: Intelligent data insights using Google's Gemini AI
- **Interactive Visualizations**: Create charts, graphs, and dashboards
- **Data Cleaning Tools**: Built-in data cleaning and preprocessing capabilities
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Processing**: Fast backend API with FastAPI
- **Cross-platform**: Works on Windows, macOS, and Linux

## 📋 Requirements

Before installing Clarivo, make sure you have:

- **Python 3.8 or higher**
- **Node.js 16 or higher**
- **npm** (comes with Node.js)

### Installing Requirements

#### Windows
1. Download Python from [python.org](https://python.org)
2. Download Node.js from [nodejs.org](https://nodejs.org)

#### macOS
```bash
# Using Homebrew
brew install python node

# Or download from official websites
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip nodejs npm
```

## 🛠️ Installation

### Quick Install (Recommended)

#### Windows
1. Double-click `install.bat`
2. Follow the on-screen instructions
3. Wait for installation to complete

#### macOS/Linux
```bash
# Make installer executable
chmod +x install.sh

# Run installer
./install.sh
```

### Manual Installation

If you prefer to install manually:

1. **Clone or download** the project
2. **Run the setup script**:
   ```bash
   python setup.py
   ```
3. **Follow the prompts** to complete installation

## 🚀 Running Clarivo

### After Installation

#### Windows
- Double-click the **Clarivo** shortcut on your desktop
- Or run `start-clarivo.bat` from the project folder

#### macOS/Linux
```bash
./start-clarivo.sh
```

### Manual Start

1. **Start the backend**:
   ```bash
   cd backend
   # Windows
   venv\Scripts\activate && python main.py
   # macOS/Linux
   source venv/bin/activate && python main.py
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Open your browser** and go to:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 📖 Usage

### Getting Started

1. **Upload Data**: Drag and drop CSV files or use the upload button
2. **View Dataset**: Browse your uploaded datasets in the home screen
3. **Analyze Data**: Use the AI-powered insights feature
4. **Create Visualizations**: Build charts and graphs in the visualize section
5. **Clean Data**: Use the cleaning tools to prepare your data

### Features Overview

#### Home Screen
- View all uploaded datasets
- Quick access to recent files
- Dataset statistics and preview

#### Data Analysis
- AI-powered insights using Gemini
- Automatic data profiling
- Statistical summaries

#### Visualization
- Interactive charts and graphs
- Multiple chart types (bar, line, pie, etc.)
- Customizable dashboards

#### Data Cleaning
- Handle missing values
- Remove duplicates
- Data type conversion
- Outlier detection

## 🏗️ Project Structure

```
clarivo/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── data/               # Sample datasets
│   ├── main.py             # Backend entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── modules/        # React components
│   │   ├── services/       # API services
│   │   └── shared/         # Shared components
│   └── package.json        # Node.js dependencies
├── setup.py                # Installation script
├── install.bat             # Windows installer
├── install.sh              # Unix installer
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# API Configuration
API_HOST=localhost
API_PORT=8000

# Database (optional)
DATABASE_URL=sqlite:///./clarivo.db

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### Customizing the Application

- **Backend**: Modify `backend/app/core/config.py`
- **Frontend**: Edit `frontend/src/modules/App.tsx`
- **Styling**: Update `frontend/tailwind.config.js`

## 🐛 Troubleshooting

### Common Issues

#### Installation Problems
- **Python not found**: Make sure Python is in your PATH
- **Node.js not found**: Install Node.js from the official website
- **Permission errors**: Run as administrator (Windows) or use sudo (Linux)

#### Runtime Issues
- **Port already in use**: Change ports in configuration or kill existing processes
- **Backend won't start**: Check if virtual environment is activated
- **Frontend won't start**: Ensure all npm dependencies are installed

#### Performance Issues
- **Slow loading**: Check your internet connection for AI features
- **Memory issues**: Close other applications to free up RAM

### Getting Help

1. Check the logs in the terminal windows
2. Verify all requirements are installed
3. Restart the application
4. Check the GitHub issues page

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent data analysis
- **React** and **FastAPI** communities
- **Tailwind CSS** for beautiful styling
- **Plotly** for interactive visualizations

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting section

---

**Made with ❤️ by the Clarivo Team**