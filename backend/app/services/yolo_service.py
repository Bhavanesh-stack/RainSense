"""YOLOv8 rooftop analysis service with demo fallback."""

import numpy as np
from typing import List
from app.models.schemas import DetectedObject, AIAnalysis


class RoofAnalyzer:
    """
    Analyzes rooftop images using YOLOv8 object detection.
    Falls back to demo mode if no suitable model is available.
    """

    # COCO classes that are relevant to rooftop analysis
    ROOFTOP_RELEVANT_CLASSES = {
        "roof", "building", "house", "solar panel", "water tank",
        "air conditioner", "satellite dish", "chimney",
        # Generic COCO classes that might appear on rooftops
        "potted plant", "umbrella", "bench", "chair", "tv",
    }

    def __init__(self, model_path: str = "yolov8n.pt"):
        self.model = None
        self.model_path = model_path
        self.mode = "demo"
        self._load_model()

    def _load_model(self):
        """Attempt to load YOLOv8 model."""
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            self.mode = "ai"
            print(f"✓ YOLO model loaded: {self.model_path}")
        except Exception as e:
            print(f"⚠ YOLO model unavailable: {e}")
            print("  Rooftop analysis will use demo mode.")
            self.mode = "demo"

    def analyze(self, image: np.ndarray) -> AIAnalysis:
        """
        Analyze a preprocessed image for rooftop features.
        Returns structured AI analysis result.
        """
        if self.mode == "ai" and self.model is not None:
            return self._analyze_with_yolo(image)
        return self._demo_analysis(image)

    def _analyze_with_yolo(self, image: np.ndarray) -> AIAnalysis:
        """Run actual YOLO inference."""
        try:
            results = self.model(image, verbose=False)
            obstacles: List[DetectedObject] = []
            roof_detected = False
            max_confidence = 0.0

            for result in results:
                if result.boxes is None:
                    continue
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = self.model.names.get(cls_id, f"class_{cls_id}")

                    if confidence < 0.3:
                        continue

                    max_confidence = max(max_confidence, confidence)

                    # Check if any large object detected (potential roof/building)
                    bbox = box.xyxy[0].tolist()
                    bbox_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                    img_area = image.shape[0] * image.shape[1]

                    if bbox_area / img_area > 0.3:
                        roof_detected = True

                    obstacles.append(DetectedObject(
                        label=label,
                        confidence=round(confidence, 3),
                        bbox=bbox,
                    ))

            # If no large object but detections exist, still consider roof detected
            if not roof_detected and len(obstacles) > 0:
                roof_detected = True

            # If absolutely nothing detected, still mark roof as likely present
            # (an aerial photo of a plain roof may have no COCO objects)
            if len(obstacles) == 0:
                roof_detected = True
                max_confidence = 0.6

            return AIAnalysis(
                roof_detected=roof_detected,
                obstacles=obstacles,
                confidence=round(max_confidence, 3) if max_confidence > 0 else 0.6,
                analysis_mode="ai",
                model_info=f"YOLOv8 ({self.model_path}) — Note: using a general-purpose model. "
                           f"A rooftop-specific model would improve accuracy.",
            )

        except Exception as e:
            print(f"⚠ YOLO inference failed: {e}")
            return self._demo_analysis(image)

    def _demo_analysis(self, image: np.ndarray) -> AIAnalysis:
        """
        Demo/fallback analysis when YOLO is unavailable.
        Uses basic image properties to generate illustrative results.
        """
        h, w = image.shape[:2]

        # Simple heuristic based on image properties
        gray = None
        try:
            import cv2
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        except Exception:
            pass

        # Generate deterministic demo results from image dimensions
        demo_confidence = round(0.75 + (w % 20) / 100, 3)
        demo_confidence = min(demo_confidence, 0.95)

        obstacles = []
        # Simulate obstacle detection based on image variance
        if gray is not None:
            variance = float(np.var(gray))
            if variance > 2000:
                obstacles.append(DetectedObject(
                    label="potential_obstacle",
                    confidence=0.65,
                    bbox=None,
                ))

        return AIAnalysis(
            roof_detected=True,
            obstacles=obstacles,
            confidence=demo_confidence,
            analysis_mode="demo",
            model_info="Demo mode — results are illustrative. No trained rooftop model is loaded.",
        )


# Singleton instance (lazy loaded)
_analyzer: RoofAnalyzer = None


def get_roof_analyzer() -> RoofAnalyzer:
    """Get or create the singleton RoofAnalyzer."""
    global _analyzer
    if _analyzer is None:
        from app.config import settings
        _analyzer = RoofAnalyzer(settings.YOLO_MODEL_PATH)
    return _analyzer
