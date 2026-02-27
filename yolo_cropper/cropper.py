
import logging
import os

import cv2
from ultralytics import YOLO

# Silence ultralytics logging so subprocess stdout stays clean
logging.getLogger("ultralytics").setLevel(logging.CRITICAL)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "weights", "best.pt")
model = YOLO(MODEL_PATH)

def crop_prescription(image_path, save_path=None):
    results = model(image_path, verbose=False)[0]
    if len(results.boxes) == 0:
        return None
    
    box = results.boxes.xyxy[0].cpu().numpy().astype(int)
    x1,y1,x2,y2 = box
    
    img = cv2.imread(image_path)
    crop = img[y1:y2, x1:x2]
    
    if save_path:
        cv2.imwrite(save_path, crop)
    
    return crop
