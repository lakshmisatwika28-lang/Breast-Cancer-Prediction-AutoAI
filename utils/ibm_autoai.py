"""
IBM AutoAI Integration Module
Handles authentication and prediction calls to the deployed AutoAI model.
"""
import os
import logging
import requests
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

# ── Feature columns (exact order the AutoAI model was trained on) ────────────
# NOTE: AutoAI was trained with 'id' still present in the dataset (31 cols).
#       We pass id=0 as a dummy value — the model ignores it numerically.
FEATURE_COLUMNS = [
    "id",
    "radius_mean", "texture_mean", "perimeter_mean", "area_mean",
    "smoothness_mean", "compactness_mean", "concavity_mean",
    "concave points_mean", "symmetry_mean", "fractal_dimension_mean",
    "radius_se", "texture_se", "perimeter_se", "area_se",
    "smoothness_se", "compactness_se", "concavity_se",
    "concave points_se", "symmetry_se", "fractal_dimension_se",
    "radius_worst", "texture_worst", "perimeter_worst", "area_worst",
    "smoothness_worst", "compactness_worst", "concavity_worst",
    "concave points_worst", "symmetry_worst", "fractal_dimension_worst",
]

# Label map returned by AutoAI
LABEL_MAP = {"M": "Malignant", "B": "Benign"}


# Placeholder sentinel values written by .env.example — treat as "not set"
_PLACEHOLDERS = {
    "your_ibm_cloud_api_key_here",
    "your_deployment_space_id_here",
    "your_autoai_deployment_id_here",
    "",
}


class IBMAutoAIClient:
    """Wraps IBM WML REST API calls for the AutoAI deployment."""

    def __init__(self):
        # Re-read from env on every instantiation so restarts pick up .env edits
        load_dotenv(override=True)
        self.api_key = os.getenv("IBM_API_KEY", "")
        self.wml_url = os.getenv("IBM_WML_URL", "https://us-south.ml.cloud.ibm.com").rstrip("/")
        self.deployment_id = os.getenv("IBM_DEPLOYMENT_ID", "")
        self.space_id = os.getenv("IBM_SPACE_ID", "")

    def _check_credentials(self):
        """Raise a clear ValueError if any credential is missing or still a placeholder."""
        missing = []
        if self.api_key in _PLACEHOLDERS:
            missing.append("IBM_API_KEY")
        if self.deployment_id in _PLACEHOLDERS:
            missing.append("IBM_DEPLOYMENT_ID")
        if self.space_id in _PLACEHOLDERS:
            missing.append("IBM_SPACE_ID")
        if missing:
            raise ValueError(
                f"Missing or unconfigured credentials: {', '.join(missing)}. "
                "Open your .env file and replace the placeholder values with your "
                "real IBM Cloud API key and AutoAI Deployment ID."
            )

    # ── IAM Token ────────────────────────────────────────────────────────────
    def _get_iam_token(self) -> str:
        """Obtain a fresh IAM bearer token."""
        try:
            resp = requests.post(
                "https://iam.cloud.ibm.com/identity/token",
                data={
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": self.api_key,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30,
            )
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else "?"
            body = exc.response.text[:300] if exc.response is not None else ""
            raise ValueError(
                f"IBM IAM token request failed (HTTP {status}). "
                "Check that IBM_API_KEY in your .env is correct. "
                f"Server said: {body}"
            ) from exc
        except requests.exceptions.ConnectionError as exc:
            raise ValueError(
                "Cannot reach IBM IAM (iam.cloud.ibm.com). Check your internet connection."
            ) from exc
        except requests.exceptions.Timeout as exc:
            raise ValueError("IBM IAM token request timed out (30 s).") from exc

        return resp.json()["access_token"]

    def _auth_headers(self) -> dict:
        token = self._get_iam_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    # ── Prediction ────────────────────────────────────────────────────────────
    def predict(self, feature_values: list) -> dict:
        """
        Call the AutoAI scoring endpoint.
        feature_values: ordered list matching FEATURE_COLUMNS.
        Returns dict with keys: prediction, confidence, probabilities, raw_response.
        """
        # Re-read credentials every call so .env edits take effect without restart
        load_dotenv(override=True)
        self.api_key = os.getenv("IBM_API_KEY", "")
        self.wml_url = os.getenv("IBM_WML_URL", "https://us-south.ml.cloud.ibm.com").rstrip("/")
        self.deployment_id = os.getenv("IBM_DEPLOYMENT_ID", "")
        self.space_id = os.getenv("IBM_SPACE_ID", "")

        self._check_credentials()

        scoring_url = (
            f"{self.wml_url}/ml/v4/deployments/{self.deployment_id}/predictions"
            f"?version=2021-05-01&space_id={self.space_id}"
        )

        payload = {
            "input_data": [
                {
                    "fields": FEATURE_COLUMNS,
                    "values": [feature_values],
                }
            ]
        }

        logger.info("Calling scoring URL: %s", scoring_url)
        try:
            resp = requests.post(
                scoring_url,
                json=payload,
                headers=self._auth_headers(),
                timeout=60,
            )
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else "?"
            body = exc.response.text[:400] if exc.response is not None else ""
            raise ValueError(
                f"WML scoring endpoint returned HTTP {status}. "
                f"Check IBM_DEPLOYMENT_ID and IBM_WML_URL in your .env. "
                f"Server said: {body}"
            ) from exc
        except requests.exceptions.ConnectionError as exc:
            raise ValueError(
                f"Cannot reach WML endpoint ({self.wml_url}). "
                "Check IBM_WML_URL and your internet connection."
            ) from exc
        except requests.exceptions.Timeout as exc:
            raise ValueError("WML scoring request timed out (60 s). Try again.") from exc

        return self._parse_response(resp.json())

    # ── Response Parser ───────────────────────────────────────────────────────
    @staticmethod
    def _parse_response(raw: dict) -> dict:
        """
        Extract prediction label and confidence from WML scoring response.
        Supports both AutoAI pipeline response shapes.
        """
        try:
            predictions = raw["predictions"][0]
            fields: list = predictions["fields"]
            values: list = predictions["values"][0]
            result = dict(zip(fields, values))

            # AutoAI typically returns 'prediction' and 'probability' fields
            prediction_raw = result.get("prediction", "")
            prediction_label = str(prediction_raw).strip()
            human_label = LABEL_MAP.get(prediction_label, prediction_label)

            # Probability / confidence
            probability = result.get("probability", None)
            confidence = None
            probabilities = {}

            if probability is not None:
                # probability is a list aligned to prediction_classes
                classes_field = result.get(
                    "prediction_classes",
                    result.get("predictedLabel_classes", None),
                )
                if classes_field and isinstance(probability, list):
                    probabilities = dict(zip(classes_field, probability))
                    # confidence for the predicted class
                    conf_val = probabilities.get(prediction_label, max(probability))
                    confidence = round(float(conf_val) * 100, 2)
                elif isinstance(probability, list) and len(probability) >= 1:
                    confidence = round(float(max(probability)) * 100, 2)
                elif isinstance(probability, (int, float)):
                    confidence = round(float(probability) * 100, 2)

            return {
                "prediction": human_label,
                "prediction_raw": prediction_label,
                "confidence": confidence,
                "probabilities": probabilities,
                "raw_response": raw,
            }
        except (KeyError, IndexError, TypeError) as exc:
            logger.error("Failed to parse WML response: %s", exc)
            raise ValueError(f"Unexpected model response format: {exc}") from exc


# Singleton client
client = IBMAutoAIClient()
