"""
Fertilizer Recommendation Model Prediction Script
Loads the user-provided trained Gradient Boosting model and makes predictions
"""

import sys
import json
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.preprocessing import RobustScaler, LabelEncoder

# Get the directory where this script is located
MODEL_DIR = Path(__file__).parent

def load_model_and_preprocessors():
    """Load the trained model and preprocessing components"""
    try:
        # Load the model
        model_path = MODEL_DIR / "gb_model.pkl"
        if not model_path.exists():
             model_path = MODEL_DIR / "gb_model (1).pkl"
            
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        model = joblib.load(model_path)
        print(f"✓ Model loaded from {model_path}", file=sys.stderr)
        
        # Load scaler
        scaler_path = MODEL_DIR / "scaler.pkl"
        if not scaler_path.exists():
             raise FileNotFoundError(f"Scaler file not found: {scaler_path}")
        scaler = joblib.load(scaler_path)
        print(f"✓ Scaler loaded from {scaler_path}", file=sys.stderr)

        # Load Label Encoder
        le_path = MODEL_DIR / "Label_Encoder.pkl"
        if not le_path.exists():
            # Try lowercase
            le_path = MODEL_DIR / "label_encoder.pkl"
        
        if not le_path.exists():
             raise FileNotFoundError(f"Label Encoder file not found: {le_path}")
        le = joblib.load(le_path)
        print(f"✓ Encoder loaded from {le_path}", file=sys.stderr)
        
        return model, scaler, le
    
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}", file=sys.stderr)
        raise

def preprocess_input(data, scaler, le):
    """
    Preprocess input data to match model requirements
    """
    # Create DataFrame
    df = pd.DataFrame([data])
    
    # Feature Engineering (Must match Mainmodel.py)
    df['NPK_ratio'] = df['sensor_nitrogen'] + df['sensor_phosphorus'] + df['sensor_potassium']
    df['N_P_ratio'] = df['sensor_nitrogen'] / (df['sensor_phosphorus'] + 1)
    df['N_K_ratio'] = df['sensor_nitrogen'] / (df['sensor_potassium'] + 1)
    df['pH_moisture'] = df['soil_pH'] * df['soil_moisture_percent']
    df['temp_moisture'] = df['soil_temperature_celsius'] * df['soil_moisture_percent']
    
    # Encode crop type
    try:
        df['crop_type_encoded'] = le.transform([data['crop_type']])[0]
    except ValueError:
        print(f"⚠ Crop type '{data['crop_type']}' not seen in training. Using default (0).", file=sys.stderr)
        df['crop_type_encoded'] = 0
    
    # Feature list matching Mainmodel.py
    sensor_features = [
        "sensor_nitrogen",
        "sensor_phosphorus",
        "sensor_potassium",
        "soil_pH",
        "soil_moisture_percent",
        "soil_electrical_conductivity_us_cm",
        "soil_temperature_celsius",
    ]
    feature_list = sensor_features + ['crop_type_encoded', 'NPK_ratio', 'N_P_ratio', 'N_K_ratio', 'pH_moisture', 'temp_moisture']
    
    X = df[feature_list]
    
    # Scale features
    X_scaled = scaler.transform(X)
    
    return X_scaled

def predict_fertilizer(input_data):
    # Load model and preprocessors
    model, scaler, le = load_model_and_preprocessors()
    
    # Preprocess input
    X_scaled = preprocess_input(input_data, scaler, le)
    
    # Make prediction
    predictions = model.predict(X_scaled)
    
    # Map to fertilizer names
    target_features = [
        "Urea", "DAP", "MAP", "MOP", "SOP", "CAN", "SSP", "Ammonium Sulfate"
    ]
    
    result = {}
    for i, name in enumerate(target_features):
        result[name] = max(0, float(predictions[0][i]))  # Ensure non-negative
    
    return result

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_json = sys.stdin.read()
        if not input_json:
            raise ValueError("No input received")
            
        input_data = json.loads(input_json)
        
        # Map frontend fields to model fields
        mapped_data = {
            'sensor_nitrogen': float(input_data.get('nitrogen', 0)),
            'sensor_phosphorus': float(input_data.get('phosphorous', 0)),
            'sensor_potassium': float(input_data.get('potassium', 0)),
            'soil_pH': float(input_data.get('ph', 7.0)),
            'soil_moisture_percent': float(input_data.get('moisture', 0)),
            'soil_electrical_conductivity_us_cm': float(input_data.get('soil_ec', 0)),
            'soil_temperature_celsius': float(input_data.get('temperature', 25)),
            'crop_type': input_data.get('crop', 'Wheat')
        }
        
        predictions = predict_fertilizer(mapped_data)
        
        print(json.dumps({
            'success': True,
            'predictions': predictions
        }))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)
