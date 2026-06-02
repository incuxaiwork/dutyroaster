$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "=== Starting DRMS ===" -ForegroundColor Cyan

# -- Check Python --
try {
    $pyVersion = & python --version
    Write-Host "[OK] Python: $pyVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERR] Python not found. Please install Python 3.10+ from https://python.org" -ForegroundColor Red
    exit 1
}

# -- Check Node.js --
try {
    $nodeVer = & node --version
    $npmVer  = & npm --version
    Write-Host "[OK] Node: $nodeVer  npm: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "[ERR] Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# -- Backend: venv + deps --
$venv = "$root\backend\.venv"
$venvActivate = "$venv\Scripts\Activate.ps1"
$venvPython   = "$venv\Scripts\python.exe"
$venvPip      = "$venv\Scripts\pip.exe"
if (-not (Test-Path $venvActivate)) {
    Write-Host "[..] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv "$venv"
    if (-not (Test-Path $venvActivate)) {
        Write-Host "[ERR] Failed to create virtual environment." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Virtual environment created." -ForegroundColor Green
}

# Only install if not already done
if (-not (Test-Path "$venv\Lib\site-packages\fastapi")) {
    Write-Host "[..] Installing Python dependencies..." -ForegroundColor Yellow
    & $venvPip install -r "$root\backend\requirements.txt"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERR] Failed to install Python dependencies." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Python dependencies installed." -ForegroundColor Green
}

# -- Frontend: npm deps --
if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "[..] Installing frontend dependencies..." -ForegroundColor Yellow
    & npm install --prefix "$root\frontend"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERR] Failed to install frontend dependencies." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Frontend dependencies installed." -ForegroundColor Green
}

# -- Start backend --
Write-Host "[1/3] Starting backend (uvicorn)..." -ForegroundColor Yellow
$backendCmd = "Set-Location '$root\backend'; & '$venvActivate'; uvicorn app.main:app --reload --port 8000"
Start-Process -WindowStyle Normal -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $backendCmd

# -- Start frontend --
Write-Host "[2/3] Starting frontend (Vite)..." -ForegroundColor Yellow
$frontendCmd = "Set-Location '$root\frontend'; npm run dev"
Start-Process -WindowStyle Normal -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "=== All services started ===" -ForegroundColor Green
Write-Host "Frontend : http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend  : http://localhost:8000" -ForegroundColor Cyan
Write-Host "API docs : http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close each terminal window to stop, or press Ctrl+C in each." -ForegroundColor Gray
