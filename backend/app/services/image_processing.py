"""Image preprocessing service using OpenCV."""

import cv2
import numpy as np
from io import BytesIO
from PIL import Image


class ImageProcessor:
    """Handles image validation, preprocessing, and preparation for AI analysis."""

    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    MAX_DIMENSION = 1024  # Resize largest dimension to this

    @staticmethod
    def validate_image(file_bytes: bytes, filename: str) -> dict:
        """Validate image format and basic properties."""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in ImageProcessor.ALLOWED_EXTENSIONS:
            return {
                "valid": False,
                "error": f"Invalid image format '{ext}'. Accepted: {', '.join(ImageProcessor.ALLOWED_EXTENSIONS)}",
            }

        try:
            img = Image.open(BytesIO(file_bytes))
            img.verify()
            return {"valid": True, "format": ext, "size": len(file_bytes)}
        except Exception:
            return {"valid": False, "error": "Corrupted or unreadable image file."}

    @staticmethod
    def preprocess(file_bytes: bytes) -> np.ndarray:
        """
        Full preprocessing pipeline:
        1. Decode → 2. Resize → 3. Noise reduction → 4. Contrast enhancement → 5. Normalize
        """
        # Decode
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Unable to decode the uploaded image.")

        # Resize (maintain aspect ratio)
        h, w = img.shape[:2]
        max_dim = ImageProcessor.MAX_DIMENSION
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

        # Noise reduction (gentle bilateral filter preserves edges)
        img = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)

        # Contrast enhancement (CLAHE on L channel in LAB space)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_channel = clahe.apply(l_channel)
        lab = cv2.merge([l_channel, a, b])
        img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        return img

    @staticmethod
    def to_rgb(img: np.ndarray) -> np.ndarray:
        """Convert BGR (OpenCV) to RGB."""
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
