"""
Script to save preprocessing components from your training code.
Run this AFTER training your model to save scaler and label encoder.

Add this code to your training script after model training:
"""

import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import RobustScaler, LabelEncoder
from pathlib import Path

# Get the directory where this script is located
MODEL_DIR = Path(__file__).parent

def save_preprocessors(scaler, le, output_dir=None):
    """
    Save preprocessing components to disk.
    
    Args:
        scaler: RobustScaler instance from training
        le: LabelEncoder instance from training
        output_dir: Directory to save files (default: models/)
    """
    if output_dir is None:
        output_dir = MODEL_DIR
    
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # Save scaler
    scaler_path = output_dir / "scaler.pkl"
    joblib.dump(scaler, scaler_path)
    print(f"✓ Scaler saved to {scaler_path}")
    
    # Save label encoder
    le_path = output_dir / "label_encoder.pkl"
    joblib.dump(le, le_path)
    print(f"✓ LabelEncoder saved to {le_path}")
    
    # Also save crop types for reference
    crops_path = output_dir / "crop_types.txt"
    with open(crops_path, 'w') as f:
        f.write('\n'.join(le.classes_))
    print(f"✓ Crop types saved to {crops_path}")
    print(f"  Crop types: {list(le.classes_)}")

# Example usage in your training script:
"""
# In your training script, after training:

from models.save_preprocessors_from_training import save_preprocessors

# After creating scaler and le:
save_preprocessors(scaler, le)

# Or manually:
import joblib
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(le, 'models/label_encoder.pkl')
"""

if __name__ == "__main__":
    print("=" * 60)
    print("Preprocessor Saving Utility")
    print("=" * 60)
    print("\nThis script provides a function to save preprocessors.")
    print("Add this to your training code after model training:\n")
    print("""
from models.save_preprocessors_from_training import save_preprocessors

# After training, save preprocessors:
save_preprocessors(scaler, le)
    """)
    print("\nOr manually save them:")
    print("""
import joblib
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(le, 'models/label_encoder.pkl')
    """)
    print("=" * 60)

