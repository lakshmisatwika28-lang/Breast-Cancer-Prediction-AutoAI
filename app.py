"""
Breast Cancer Prevention & Risk Prediction — Flask Application
IBM Cloud + AutoAI Backend
"""
import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

from utils.ibm_autoai import client, FEATURE_COLUMNS, LABEL_MAP

# ── Bootstrap ─────────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.DEBUG if os.getenv("FLASK_DEBUG", "False").lower() == "true" else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-in-production")
CORS(app)

MAX_HISTORY = int(os.getenv("MAX_PREDICTION_HISTORY", 50))

# ── Feature metadata for UI ───────────────────────────────────────────────────
FEATURE_META = {
    "radius":           {"label": "Radius",            "unit": "µm",    "icon": "circle",     "desc": "Mean of distances from center to points on the perimeter"},
    "texture":          {"label": "Texture",           "unit": "SD",    "icon": "grid-3x3",   "desc": "Standard deviation of gray-scale values"},
    "perimeter":        {"label": "Perimeter",         "unit": "µm",    "icon": "pentagon",   "desc": "Perimeter of the cell nucleus"},
    "area":             {"label": "Area",               "unit": "µm²",  "icon": "square",     "desc": "Area of the cell nucleus"},
    "smoothness":       {"label": "Smoothness",        "unit": "",      "icon": "activity",   "desc": "Local variation in radius lengths"},
    "compactness":      {"label": "Compactness",       "unit": "",      "icon": "hexagon",    "desc": "Perimeter² / area − 1.0"},
    "concavity":        {"label": "Concavity",         "unit": "",      "icon": "arrow-down-circle", "desc": "Severity of concave portions of the contour"},
    "concave_points":   {"label": "Concave Points",   "unit": "",      "icon": "crosshair",  "desc": "Number of concave portions of the contour"},
    "symmetry":         {"label": "Symmetry",          "unit": "",      "icon": "bar-chart-2","desc": "Symmetry of the cell nucleus"},
    "fractal_dimension":{"label": "Fractal Dimension", "unit": "",      "icon": "git-branch", "desc": "Coastline approximation − 1"},
}

FORM_FIELDS = [
    # (field_name, label, min, max, step, default, suffix)
    ("radius_mean",              "Radius (mean)",              6.0,  30.0,  0.01, 14.13, "µm"),
    ("texture_mean",             "Texture (mean)",             9.0,  40.0,  0.01, 19.29, ""),
    ("perimeter_mean",           "Perimeter (mean)",          40.0, 200.0,  0.1,  91.97, "µm"),
    ("area_mean",                "Area (mean)",               140.0,2500.0, 1.0, 654.9,  "µm²"),
    ("smoothness_mean",          "Smoothness (mean)",          0.05,  0.17, 0.001, 0.096, ""),
    ("compactness_mean",         "Compactness (mean)",         0.02,  0.35, 0.001, 0.104, ""),
    ("concavity_mean",           "Concavity (mean)",           0.0,   0.43, 0.001, 0.089, ""),
    ("concave points_mean",      "Concave Points (mean)",      0.0,   0.2,  0.001, 0.049, ""),
    ("symmetry_mean",            "Symmetry (mean)",            0.1,   0.3,  0.001, 0.181, ""),
    ("fractal_dimension_mean",   "Fractal Dimension (mean)",   0.05,  0.1,  0.0001,0.063, ""),
    ("radius_se",                "Radius (SE)",                0.1,   3.0,  0.001, 0.405, "µm"),
    ("texture_se",               "Texture (SE)",               0.3,   5.0,  0.01,  1.217, ""),
    ("perimeter_se",             "Perimeter (SE)",             0.7,  22.0,  0.01,  2.866, "µm"),
    ("area_se",                  "Area (SE)",                  6.0, 550.0,  0.1,  40.34, "µm²"),
    ("smoothness_se",            "Smoothness (SE)",            0.001, 0.032,0.0001,0.007, ""),
    ("compactness_se",           "Compactness (SE)",           0.002, 0.135,0.0001,0.025, ""),
    ("concavity_se",             "Concavity (SE)",             0.0,   0.4,  0.001, 0.032, ""),
    ("concave points_se",        "Concave Points (SE)",        0.0,   0.053,0.0001,0.012, ""),
    ("symmetry_se",              "Symmetry (SE)",              0.007, 0.08, 0.0001,0.021, ""),
    ("fractal_dimension_se",     "Fractal Dimension (SE)",     0.0008,0.03, 0.0001,0.004, ""),
    ("radius_worst",             "Radius (worst)",             7.0,  37.0,  0.01, 16.27, "µm"),
    ("texture_worst",            "Texture (worst)",           12.0,  50.0,  0.01, 25.68, ""),
    ("perimeter_worst",          "Perimeter (worst)",         50.0, 252.0,  0.1, 107.26, "µm"),
    ("area_worst",               "Area (worst)",             185.0,4254.0,  1.0, 880.6,  "µm²"),
    ("smoothness_worst",         "Smoothness (worst)",         0.07,  0.22, 0.001, 0.132, ""),
    ("compactness_worst",        "Compactness (worst)",        0.02,  1.06, 0.001, 0.254, ""),
    ("concavity_worst",          "Concavity (worst)",          0.0,   1.25, 0.001, 0.272, ""),
    ("concave points_worst",     "Concave Points (worst)",     0.0,   0.3,  0.001, 0.115, ""),
    ("symmetry_worst",           "Symmetry (worst)",           0.15,  0.66, 0.001, 0.290, ""),
    ("fractal_dimension_worst",  "Fractal Dimension (worst)",  0.055, 0.21, 0.0001,0.084, ""),
]


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    """Main page."""
    history = session.get("prediction_history", [])
    return render_template(
        "index.html",
        form_fields=FORM_FIELDS,
        feature_meta=FEATURE_META,
        history=history,
    )


@app.route("/predict", methods=["POST"])
def predict():
    """Accept form values and return prediction JSON."""
    errors = {}
    feature_values = []

    for field_name, label, f_min, f_max, _, _, _ in FORM_FIELDS:
        raw = request.form.get(field_name, "").strip()
        if not raw:
            errors[field_name] = f"{label} is required."
            continue
        try:
            val = float(raw)
        except ValueError:
            errors[field_name] = f"{label} must be a number."
            continue
        if not (f_min <= val <= f_max):
            errors[field_name] = f"{label} must be between {f_min} and {f_max}."
            continue
        feature_values.append(val)

    if errors:
        return jsonify({"success": False, "errors": errors}), 422

    # Prepend dummy id=0 — model was trained with 'id' column included
    feature_values_with_id = [0] + feature_values

    try:
        result = client.predict(feature_values_with_id)
    except ValueError as exc:
        # Credential / config / HTTP errors — surface exact message to UI
        logger.warning("Prediction error: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 503
    except Exception as exc:
        # Unexpected errors — log full traceback, surface message to UI
        logger.error("Unexpected prediction error: %s", exc, exc_info=True)
        return jsonify({"success": False, "error": f"Unexpected error: {exc}"}), 503

    # Store in session history
    history = session.get("prediction_history", [])
    history_entry = {
        "id": len(history) + 1,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "radius_mean": feature_values[0],
        "area_mean": feature_values[3],
    }
    history.insert(0, history_entry)
    session["prediction_history"] = history[:MAX_HISTORY]
    session.modified = True

    return jsonify({"success": True, "result": result, "history_entry": history_entry})


@app.route("/history/clear", methods=["POST"])
def clear_history():
    """Clear prediction history from session."""
    session.pop("prediction_history", None)
    return jsonify({"success": True})


@app.route("/api/feature-info")
def feature_info():
    """Return feature metadata as JSON."""
    return jsonify(FEATURE_META)


@app.route("/diagnose")
def diagnose():
    """
    Check IBM credentials and connectivity without making a full prediction.
    Visit http://localhost:5000/diagnose to debug configuration issues.
    """
    from dotenv import dotenv_values
    import requests as req

    cfg = dotenv_values(".env")
    api_key     = cfg.get("IBM_API_KEY", "")
    wml_url     = cfg.get("IBM_WML_URL", "").rstrip("/")
    deploy_id   = cfg.get("IBM_DEPLOYMENT_ID", "")
    space_id    = cfg.get("IBM_SPACE_ID", "")

    placeholders = {"your_ibm_cloud_api_key_here", "your_deployment_space_id_here",
                    "your_autoai_deployment_id_here", ""}

    checks = {
        "IBM_API_KEY_set":       api_key not in placeholders,
        "IBM_WML_URL_set":       wml_url not in placeholders,
        "IBM_DEPLOYMENT_ID_set": deploy_id not in placeholders,
        "IBM_SPACE_ID_set":      space_id not in placeholders,
    }

    # Try IAM token only if API key looks real
    iam_ok = False
    iam_error = None
    token = None
    if checks["IBM_API_KEY_set"]:
        try:
            r = req.post(
                "https://iam.cloud.ibm.com/identity/token",
                data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": api_key},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=15,
            )
            if r.status_code == 200:
                iam_ok = True
                token = r.json()["access_token"]
            else:
                iam_error = f"HTTP {r.status_code}: {r.text[:200]}"
        except Exception as exc:
            iam_error = str(exc)

    checks["IAM_token_ok"] = iam_ok
    checks["IAM_error"]    = iam_error

    # Try deployment lookup only if IAM + space_id are both good
    deploy_ok = False
    deploy_error = None
    deploy_name = None
    deploy_state = None
    if iam_ok and checks["IBM_DEPLOYMENT_ID_set"] and checks["IBM_SPACE_ID_set"]:
        try:
            url = f"{wml_url}/ml/v4/deployments/{deploy_id}?version=2021-05-01&space_id={space_id}"
            d = req.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=15)
            if d.status_code == 200:
                deploy_ok = True
                meta = d.json()
                deploy_name  = meta.get("metadata", {}).get("name", "?")
                deploy_state = meta.get("entity", {}).get("status", {}).get("state", "?")
            else:
                deploy_error = f"HTTP {d.status_code}: {d.text[:300]}"
        except Exception as exc:
            deploy_error = str(exc)

    checks["deployment_reachable"] = deploy_ok
    checks["deployment_error"]     = deploy_error

    all_ok = all([checks["IBM_API_KEY_set"], checks["IBM_WML_URL_set"],
                  checks["IBM_DEPLOYMENT_ID_set"], checks["IBM_SPACE_ID_set"],
                  iam_ok, deploy_ok])

    return jsonify({
        "status":           "ready" if all_ok else "misconfigured",
        "checks":           checks,
        "wml_url":          wml_url,
        "deployment_name":  deploy_name,
        "deployment_state": deploy_state,
        "deployment_id_preview": deploy_id[:8] + "…" if len(deploy_id) > 8 else deploy_id,
        "hint": "All checks passed — ready to predict!" if all_ok
                else "Fix the failing checks in your .env file, then restart the server.",
    })


@app.route("/health")
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    logger.info("Starting app on port %d (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
