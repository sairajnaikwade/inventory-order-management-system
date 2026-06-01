# Production Deployment Playbook

This guide details step-by-step instructions to deploy the containerized **Inventory & Order Management System** online using free-tier hosting platforms, build the Docker image, and publish it to Docker Hub.

---

## 1. Docker Hub Build & Publish (Backend)

To submit the backend image as part of the assessment deliverables, compile and push it to Docker Hub:

### Step 1: Login to Docker Hub
From your terminal, authenticate with your Docker Hub credentials:
```bash
docker login
```

### Step 2: Build the Production Image
Move into the `backend/` directory and build the production image, tagging it with your Docker Hub namespace:
```bash
cd backend
# Format: docker build -t <dockerhub-username>/<repository-name>:<tag> .
docker build -t yourdockerusername/im-system-backend:latest .
```

### Step 3: Publish to Docker Hub
Push the compiled image to your public Docker Hub repository:
```bash
docker push yourdockerusername/im-system-backend:latest
```
*(Your submission link will be: `https://hub.docker.com/r/yourdockerusername/im-system-backend`)*

---

## 2. Backend API Deployment (Render / Railway / Fly.io)

We will deploy our PostgreSQL Database and FastAPI server on **Render** (or **Railway**).

### Option A: Provisioning Database & API on Render

#### Step 1: Create a PostgreSQL Database Instance
1. Log in to [Render](https://render.com/).
2. Click **New** (top right) $\rightarrow$ select **PostgreSQL**.
3. Configure the database:
   - **Name**: `im-system-postgres`
   - **Database Name**: `inventory_db`
   - **User**: `inventory_admin`
   - **Region**: Select a region close to you (e.g. `Oregon (US West)`)
   - **Instance Type**: Select **Free**.
4. Click **Create Database**.
5. Once active, copy the **Internal Database URL** (for backend communication) or **External Database URL**.

#### Step 2: Deploy the FastAPI Service
1. On Render, click **New** $\rightarrow$ select **Web Service**.
2. Connect your **GitHub Repository** containing the codebase.
3. Configure the service:
   - **Name**: `im-system-backend-api`
   - **Region**: Use the *same region* as your database.
   - **Branch**: `main`
   - **Root Directory**: `backend` (Crucial! Points to the subfolder)
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Select **Free**.
4. Scroll down, click **Advanced** $\rightarrow$ add **Environment Variables**:
   - `DATABASE_URL`: Paste the PostgreSQL **External Database URL** (or Internal if deployed in the same Render project space).
   - Ensure the prefix starts with `postgresql://` (our code automatically fixes any `postgres://` overrides issued by cloud services).
5. Click **Create Web Service**.
6. Render will automatically build the packages and start the API server. Once ready, copy the public API URL (e.g., `https://im-system-backend-api.onrender.com`).

---

## 3. Frontend Deployment (Vercel / Netlify)

We will compile and deploy our static React client on **Vercel** which supports instant global CDN delivery.

### Step 1: Link GitHub Repository to Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** $\rightarrow$ select **Project**.
3. Import your **GitHub Repository** containing the codebase.

### Step 2: Configure Vercel Project Build Options
1. Set the following options:
   - **Framework Preset**: select **Vite** (Vercel automatically detects this).
   - **Root Directory**: `frontend` (Crucial! Selects the React frontend subfolder).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Open **Environment Variables** and add:
   - `VITE_API_URL`: Paste your **live backend API URL** (including `/api/v1` suffix). E.g.:
     `https://im-system-backend-api.onrender.com/api/v1`
3. Click **Deploy**.
4. Vercel will install Node packages, compile the Vite distribution folder, and deploy.
5. Once completed, your application is live on a public URL (e.g., `https://im-system-frontend.vercel.app`).

---

## 4. Validating the Deployed System

Once both services are active:
1. Open the Vercel Frontend URL.
2. The Dashboard will initialize and display empty metrics (connecting successfully via CORS to your live FastAPI backend!).
3. Navigate to **Products**, click **Add Product**, and submit.
4. Verify that the product is saved successfully.
5. Create a customer profile, place a multi-item order, and verify database updates in real-time.
