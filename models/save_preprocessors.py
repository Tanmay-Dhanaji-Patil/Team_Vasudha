"""
Script to save preprocessing components (scaler and label encoder)
Run this after training your model to save the preprocessors
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import RobustScaler, LabelEncoder
from pathlib import Path

# This should match your training code
MODEL_DIR = Path(__file__).parent

def save_preprocessors_from_training():
    """
    This function should be called from your training script
    to save the scaler and label encoder.
    
    Add this to your training code after model training:
    
    from models.save_preprocessors import save_preprocessors_from_training
    save_preprocessors_from_training(scaler, le, MODEL_DIR)
    """
    print("This script is a template.")
    print("To save preprocessors, add this to your training code:")
    print("""
    # After training, save preprocessors:
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(le, 'models/label_encoder.pkl')
    print("✓ Preprocessors saved")
    """)

if __name__ == "__main__":
    # Example: If you have a dataset, you can recreate the preprocessors
    # This is a fallback if you lost the original preprocessors
    
    print("=" * 60)
    print("Preprocessor Saving Utility")
    print("=" * 60)
    print("\nTo save preprocessors from your training code, add:")
    print("""
    import joblib
    
    # After creating scaler and le in your training code:
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(le, 'models/label_encoder.pkl')
    """)
    print("\nIf you need to recreate them, you'll need your training dataset.")
    print("=" * 60)

