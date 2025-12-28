"""
Script to extract and save preprocessors from your training code.
Run this script AFTER training your model to save scaler and label encoder.

USAGE:
1. Copy your training code below
2. Run this script
3. It will save scaler.pkl and label_encoder.pkl
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.preprocessing import RobustScaler, LabelEncoder

# Get the directory where this script is located
MODEL_DIR = Path(__file__).parent

def extract_and_save_preprocessors():
    """
    Extract preprocessors from your training process.
    Modify this function to match your training code.
    """
    
    # ===== MODIFY THIS SECTION TO MATCH YOUR TRAINING CODE =====
    
    # Load your training dataset
    # UPDATE THIS PATH to match your dataset location
    dataset_path = MODEL_DIR.parent / "data" / "realistic_fertilizer_dataset_10k.csv"
    
    if not dataset_path.exists():
        print(f"❌ Dataset not found at {dataset_path}")
        print("Please update the dataset_path in this script to point to your training dataset.")
        return False
    
    print(f"📊 Loading dataset from {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    # Define features (should match your training code)
    sensor_features = [
        "sensor_nitrogen",
        "sensor_phosphorus",
        "sensor_potassium",
        "soil_pH",
        "soil_moisture_percent",
        "soil_electrical_conductivity_us_cm",
        "soil_temperature_celsius",
    ]
    categorical_features = ["crop_type"]
    
    # Check for missing columns
    all_required_cols = sensor_features + categorical_features
    missing_cols = [col for col in all_required_cols if col not in df.columns]
    if missing_cols:
        print(f"❌ Missing columns: {missing_cols}")
        print(f"Available columns: {df.columns.tolist()}")
        return False
    
    # Handle missing values (match your training code)
    for col in sensor_features:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
    
    # Remove outliers (match your training code - IQR method)
    def remove_outliers(df, columns, threshold=3):
        df_clean = df.copy()
        for col in columns:
            Q1 = df_clean[col].quantile(0.25)
            Q3 = df_clean[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            df_clean = df_clean[(df_clean[col] >= lower_bound) & (df_clean[col] <= upper_bound)]
        return df_clean
    
    original_size = len(df)
    df = remove_outliers(df, sensor_features, threshold=3)
    print(f"✓ Removed {original_size - len(df)} outliers")
    
    # Encode categorical features
    le = LabelEncoder()
    df['crop_type_encoded'] = le.fit_transform(df['crop_type'])
    print(f"✓ Encoded {len(le.classes_)} crop types: {list(le.classes_)}")
    
    # Create feature interactions (match your training code)
    df['NPK_ratio'] = df['sensor_nitrogen'] + df['sensor_phosphorus'] + df['sensor_potassium']
    df['N_P_ratio'] = df['sensor_nitrogen'] / (df['sensor_phosphorus'] + 1)
    df['N_K_ratio'] = df['sensor_nitrogen'] / (df['sensor_potassium'] + 1)
    df['pH_moisture'] = df['soil_pH'] * df['soil_moisture_percent']
    df['temp_moisture'] = df['soil_temperature_celsius'] * df['soil_moisture_percent']
    print("✓ Created engineered features")
    
    # Prepare features
    feature_list = sensor_features + ['crop_type_encoded', 'NPK_ratio', 'N_P_ratio', 'N_K_ratio', 'pH_moisture', 'temp_moisture']
    X = df[feature_list]
    
    # Create and fit scaler (match your training code)
    scaler = RobustScaler()
    scaler.fit(X)
    print(f"✓ RobustScaler fitted on {len(X)} samples")
    
    # ===== END OF MODIFICATION SECTION =====
    
    # Save preprocessors
    scaler_path = MODEL_DIR / "scaler.pkl"
    le_path = MODEL_DIR / "label_encoder.pkl"
    
    joblib.dump(scaler, scaler_path)
    joblib.dump(le, le_path)
    
    print(f"\n✅ SUCCESS!")
    print(f"✓ Scaler saved to: {scaler_path}")
    print(f"✓ LabelEncoder saved to: {le_path}")
    print(f"✓ Crop types: {list(le.classes_)}")
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Preprocessor Extraction Script")
    print("=" * 60)
    print("\nThis script extracts scaler and label encoder from your training data.")
    print("Make sure to update the dataset_path in the script first.\n")
    
    success = extract_and_save_preprocessors()
    
    if not success:
        print("\n" + "=" * 60)
        print("ALTERNATIVE: Add this to your training code instead:")
        print("=" * 60)
        print("""
# After training your model, add these lines:

import joblib

# Save preprocessors
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(le, 'models/label_encoder.pkl')
print("✓ Preprocessors saved")
        """)

