# BreastCare AI — Breast Cancer Prevention & Risk Prediction

An AI-powered web application for breast cancer risk prediction using **IBM AutoAI**, **IBM Watson Machine Learning**, and **Python Flask**. Trained on the [UCI Breast Cancer Wisconsin (Diagnostic) Dataset](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic).

> ⚠️ **Educational Purpose Only** — This tool is not a medical device and must not replace professional clinical advice or diagnosis.

---

## 🎯 Features

- 🔬 **AI Prediction** — IBM AutoAI-powered classification (Benign / Malignant)
- 📊 **Interactive Dashboard** — 10 feature cards with descriptions
- 🕑 **Prediction History** — Session-based history table
- 🎗 **Prevention Awareness** — Risk factors, early detection tips, statistics
- 🌙 **Dark Mode** — Persistent theme preference
- 📱 **Responsive** — Mobile-first Bootstrap-inspired design
- ⚡ **Live Radar Chart** — Real-time feature profile visualization
- 🔐 **Secure** — Credentials via `.env`, never hardcoded

---

## 🗂️ Project Structure

```
BreastCancer/
├── app.py                    # Flask application entry point
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variable template
├── .env                      # Your actual secrets (git-ignored)
├── utils/
│   ├── __init__.py
│   └── ibm_autoai.py         # IBM WML REST API integration
├── templates/
│   └── index.html            # Main Jinja2 template
├── static/
│   ├── css/
│   │   └── styles.css        # Medical theme CSS with dark mode
│   └── js/
│       └── main.js           # Form validation, charts, AJAX
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/yourusername/breast-cancer-ai.git
cd breast-cancer-ai

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure IBM Credentials

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
IBM_API_KEY=your_ibm_cloud_api_key
IBM_WML_URL=https://us-south.ml.cloud.ibm.com
IBM_SPACE_ID=your_deployment_space_id
IBM_DEPLOYMENT_ID=your_autoai_deployment_id
FLASK_SECRET_KEY=a-long-random-string
FLASK_DEBUG=False
```

### 3. Run the Application

```bash
python app.py
```

Open your browser at **http://localhost:5000**

---

## ☁️ IBM Cloud Setup Guide

### Step 1 — Create IBM Cloud Account
- Sign up at [cloud.ibm.com](https://cloud.ibm.com)
- Activate a Lite or Pay-As-You-Go account

### Step 2 — Create Watson Studio & WML Services
1. Go to **IBM Cloud Catalog** → search **Watson Studio** → Create
2. Go to **IBM Cloud Catalog** → search **Watson Machine Learning** → Create
3. Link both services to a **Project** in Watson Studio

### Step 3 — Upload the Dataset
1. In Watson Studio, open your Project
2. Click **Add to project** → **Data** → Upload `breast_cancer_wisconsin.csv`
3. Ensure the file has columns: `id`, `diagnosis`, `radius_mean`, …, `fractal_dimension_worst`, `Unnamed: 32`

> The model training excludes `id` and `Unnamed: 32` columns automatically.

### Step 4 — Create an AutoAI Experiment
1. In your Project → **Add to project** → **AutoAI experiment**
2. Select your dataset
3. Set **Prediction column**: `diagnosis`
4. Set **Positive class**: `M` (Malignant)
5. Set **Metric**: ROC AUC or F1
6. Exclude columns: `id`, `Unnamed: 32`
7. Click **Run experiment**

### Step 5 — Deploy the Best Pipeline
1. Once the experiment completes, click on the top-ranked pipeline (e.g., **Pipeline 4**)
2. Click **Save as** → **Model**
3. Go to **Deployments** → Create a new **Deployment Space**
4. In the space → **Deploy** → **Online** deployment
5. Copy the **Deployment ID** from the deployment details

### Step 6 — Get Your API Key
1. IBM Cloud → top-right menu → **Manage** → **Access (IAM)**
2. **API keys** → **Create** → copy the key

### Step 7 — Get WML URL
Use the region where you created your WML service:

| Region | URL |
|--------|-----|
| Dallas (us-south) | `https://us-south.ml.cloud.ibm.com` |
| London (eu-gb) | `https://eu-gb.ml.cloud.ibm.com` |
| Frankfurt (eu-de) | `https://eu-de.ml.cloud.ibm.com` |
| Tokyo (jp-tok) | `https://jp-tok.ml.cloud.ibm.com` |
| Sydney (au-syd) | `https://au-syd.ml.cloud.ibm.com` |

---

## 🌐 Deployment to IBM Cloud Foundry

### 1. Create `manifest.yml`

```yaml
applications:
  - name: breastcare-ai
    memory: 256M
    instances: 1
    buildpack: python_buildpack
    command: gunicorn app:app --bind 0.0.0.0:$PORT
    env:
      IBM_API_KEY: your_api_key
      IBM_WML_URL: https://us-south.ml.cloud.ibm.com
      IBM_DEPLOYMENT_ID: your_deployment_id
      FLASK_SECRET_KEY: your_secret_key
```

### 2. Deploy

```bash
ibmcloud login
ibmcloud target --cf
ibmcloud cf push
```

---

## 🐳 Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2"]
```

```bash
docker build -t breastcare-ai .
docker run -p 5000:5000 --env-file .env breastcare-ai
```

---

## 📊 Dataset Reference

| Property | Value |
|----------|-------|
| Name | Breast Cancer Wisconsin (Diagnostic) |
| Source | UCI ML Repository |
| Samples | 569 |
| Features | 30 (excluding id & Unnamed: 32) |
| Target | `diagnosis` (M = Malignant, B = Benign) |
| Malignant | 212 (37.3%) |
| Benign | 357 (62.7%) |

### Feature Groups
Each of the 10 base features has three variants:
- `*_mean` — Mean value across nuclei
- `*_se` — Standard error
- `*_worst` — Mean of the 3 largest values

Base features: `radius`, `texture`, `perimeter`, `area`, `smoothness`, `compactness`, `concavity`, `concave_points`, `symmetry`, `fractal_dimension`

---

## 🔒 Security Notes

- Never commit `.env` to version control — add it to `.gitignore`
- Rotate API keys regularly via IBM Cloud IAM
- Use HTTPS in production (handled by IBM Cloud/CF)
- `FLASK_SECRET_KEY` should be a long random string in production

```bash
# Generate a secret key
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🛠️ Development

```bash
# Run in debug mode
FLASK_DEBUG=True python app.py

# Health check
curl http://localhost:5000/health

# Test prediction API (requires curl + jq)
curl -s -X POST http://localhost:5000/predict \
  -d "radius_mean=12.46&texture_mean=24.04&..." | jq .
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| Flask | Web framework |
| Flask-CORS | Cross-origin resource sharing |
| python-dotenv | Environment variable loading |
| requests | HTTP calls to IBM WML REST API |
| ibm-watson-machine-learning | Optional: IBM Python SDK alternative |
| gunicorn | Production WSGI server |

---

## ⚖️ License & Disclaimer

This project is released under the **MIT License** for educational purposes.

**Medical Disclaimer**: This application is a demonstration/research tool only. It is NOT approved for clinical use, is NOT a medical device, and does NOT provide medical diagnoses. Always seek advice from a qualified healthcare professional regarding any medical conditions.

---

*Built with ❤️ using IBM AutoAI, IBM Watson Machine Learning, Python Flask, and the UCI Breast Cancer Wisconsin Dataset.*
