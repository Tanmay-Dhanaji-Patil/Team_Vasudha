"""
Fertilizer Recommendation Model Prediction Script
Loads the trained Gradient Boosting model and makes predictions
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

def create_fallback_preprocessors():
    """
    Create fallback preprocessors with reasonable defaults.
    These are approximations and may not match training data exactly.
    For best results, save scaler and encoder from training code.
    """
    # Common crop types (update this list to match your training data)
    common_crops = ['Wheat', 'Rice', 'Maize', 'Corn', 'Barley', 'Soybean', 'Cotton']
    le = LabelEncoder()
    le.fit(common_crops)
    
    # Create a dummy scaler (will be fitted on first prediction)
    # This is not ideal but allows predictions to work
    scaler = RobustScaler()
    
    return scaler, le

def recreate_preprocessors_from_dataset():
    """
    Try to recreate preprocessors from training dataset if available.
    Looks for common dataset file names.
    """
    dataset_paths = [
        MODEL_DIR.parent / "data" / "realistic_fertilizer_dataset_10k.csv",
        MODEL_DIR.parent / "data" / "authenticated_agriculture_dataset.csv",
        MODEL_DIR / "training_data.csv",
    ]
    
    for dataset_path in dataset_paths:
        if dataset_path.exists():
            try:
                print(f"📊 Attempting to recreate preprocessors from {dataset_path}", file=sys.stderr)
                df = pd.read_csv(dataset_path)
                
                # Check if required columns exist
                required_cols = ['sensor_nitrogen', 'sensor_phosphorus', 'sensor_potassium', 
                                'soil_pH', 'soil_moisture_percent', 'soil_electrical_conductivity_us_cm',
                                'soil_temperature_celsius', 'crop_type']
                
                if not all(col in df.columns for col in required_cols):
                    print(f"⚠ Dataset missing required columns. Skipping.", file=sys.stderr)
                    continue
                
                # Create label encoder
                le = LabelEncoder()
                le.fit(df['crop_type'].unique())
                print(f"✓ LabelEncoder created with crops: {list(le.classes_)}", file=sys.stderr)
                
                # Create feature engineering
                df['NPK_ratio'] = df['sensor_nitrogen'] + df['sensor_phosphorus'] + df['sensor_potassium']
                df['N_P_ratio'] = df['sensor_nitrogen'] / (df['sensor_phosphorus'] + 1)
                df['N_K_ratio'] = df['sensor_nitrogen'] / (df['sensor_potassium'] + 1)
                df['pH_moisture'] = df['soil_pH'] * df['soil_moisture_percent']
                df['temp_moisture'] = df['soil_temperature_celsius'] * df['soil_moisture_percent']
                
                # Encode crop type
                df['crop_type_encoded'] = le.transform(df['crop_type'])
                
                # Prepare features
                feature_list = ['sensor_nitrogen', 'sensor_phosphorus', 'sensor_potassium',
                              'soil_pH', 'soil_moisture_percent', 'soil_electrical_conductivity_us_cm',
                              'soil_temperature_celsius', 'crop_type_encoded', 'NPK_ratio', 
                              'N_P_ratio', 'N_K_ratio', 'pH_moisture', 'temp_moisture']
                
                X = df[feature_list]
                
                # Create and fit scaler
                scaler = RobustScaler()
                scaler.fit(X)
                print(f"✓ RobustScaler fitted on {len(X)} samples", file=sys.stderr)
                
                # Save for future use
                scaler_path = MODEL_DIR / "scaler.pkl"
                le_path = MODEL_DIR / "label_encoder.pkl"
                joblib.dump(scaler, scaler_path)
                joblib.dump(le, le_path)
                print(f"✓ Preprocessors saved to {scaler_path} and {le_path}", file=sys.stderr)
                
                return scaler, le
                
            except Exception as e:
                print(f"⚠ Error recreating from {dataset_path}: {str(e)}", file=sys.stderr)
                continue
    
    return None, None

def load_model_and_preprocessors():
    """Load the trained model and preprocessing components"""
    try:
        # Load the model
        model_path = MODEL_DIR / "gb_model.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        model = joblib.load(model_path)
        print(f"✓ Model loaded from {model_path}", file=sys.stderr)
        
        # Try to load scaler and label encoder if they exist
        # Check for multiple possible file names
        scaler_paths = [
            MODEL_DIR / "scaler.pkl",
            MODEL_DIR / "feature_scaler (1).pkl",
            MODEL_DIR / "feature_scaler.pkl",
        ]
        le_paths = [
            MODEL_DIR / "label_encoder.pkl",
            MODEL_DIR / "crop_type_encoder.pkl",
        ]
        
        scaler = None
        le = None
        scaler_path = None
        le_path = None
        
        # Find scaler file
        for path in scaler_paths:
            if path.exists():
                scaler_path = path
                break
        
        # Find label encoder file
        for path in le_paths:
            if path.exists():
                le_path = path
                break
        
        # Option 1: Load saved preprocessors (BEST)
        if scaler_path and le_path:
            scaler = joblib.load(scaler_path)
            le = joblib.load(le_path)
            print(f"✓ Preprocessors loaded from saved files", file=sys.stderr)
            print(f"  Scaler: {scaler_path.name}", file=sys.stderr)
            print(f"  Encoder: {le_path.name}", file=sys.stderr)
            return model, scaler, le
        
        # Option 2: Try to recreate from training dataset
        print(f"⚠ Preprocessors not found. Attempting to recreate from training data...", file=sys.stderr)
        scaler, le = recreate_preprocessors_from_dataset()
        
        if scaler is not None and le is not None:
            return model, scaler, le
        
        # Option 3: Use fallback (less accurate but functional)
        print(f"⚠ Using fallback preprocessors. Predictions may be less accurate.", file=sys.stderr)
        print(f"⚠ To improve accuracy, save scaler and encoder from your training code.", file=sys.stderr)
        scaler, le = create_fallback_preprocessors()
        
        return model, scaler, le
    
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}", file=sys.stderr)
        raise

def preprocess_input(data, scaler, le):
    """
    Preprocess input data to match model requirements
    
    Args:
        data: dict with keys: sensor_nitrogen, sensor_phosphorus, sensor_potassium,
              soil_pH, soil_moisture_percent, soil_electrical_conductivity_us_cm,
              soil_temperature_celsius, crop_type
        scaler: RobustScaler (or None if needs to be created)
        le: LabelEncoder (or None if needs to be created)
    
    Returns:
        numpy array of shape (1, 13) - preprocessed features ready for model
    """
    # Extract sensor features
    sensor_features = [
        "sensor_nitrogen",
        "sensor_phosphorus",
        "sensor_potassium",
        "soil_pH",
        "soil_moisture_percent",
        "soil_electrical_conductivity_us_cm",
        "soil_temperature_celsius",
    ]
    
    # Create DataFrame
    df = pd.DataFrame([data])
    
    # Encode crop type
    if le is None:
        # Create a new encoder (this should ideally be saved from training)
        # For now, we'll create one with common crop types
        common_crops = ['Wheat', 'Rice', 'Maize', 'Corn', 'Barley', 'Soybean', 'Cotton']
        le = LabelEncoder()
        le.fit(common_crops)
        print(f"⚠ Created new LabelEncoder. Crop '{data['crop_type']}' may not be in training set.", file=sys.stderr)
    
    if 'crop_type_encoded' not in df.columns:
        try:
            df['crop_type_encoded'] = le.transform([data['crop_type']])[0]
        except ValueError:
            # Crop type not seen during training, use most common or default
            print(f"⚠ Crop type '{data['crop_type']}' not in encoder. Using default.", file=sys.stderr)
            df['crop_type_encoded'] = 0
    
    # Create engineered features
    df['NPK_ratio'] = df['sensor_nitrogen'] + df['sensor_phosphorus'] + df['sensor_potassium']
    df['N_P_ratio'] = df['sensor_nitrogen'] / (df['sensor_phosphorus'] + 1)
    df['N_K_ratio'] = df['sensor_nitrogen'] / (df['sensor_potassium'] + 1)
    df['pH_moisture'] = df['soil_pH'] * df['soil_moisture_percent']
    df['temp_moisture'] = df['soil_temperature_celsius'] * df['soil_moisture_percent']
    
    # Prepare feature list in correct order
    feature_list = sensor_features + ['crop_type_encoded', 'NPK_ratio', 'N_P_ratio', 'N_K_ratio', 'pH_moisture', 'temp_moisture']
    X = df[feature_list]
    
    # Scale features
    # If scaler is not fitted (fallback case), fit it on this sample
    # This is not ideal but allows predictions to work
    if not hasattr(scaler, 'center_') or scaler.center_ is None:
        print(f"⚠ Fitting scaler on single sample. This may affect accuracy.", file=sys.stderr)
        scaler.fit(X)
    
    X_scaled = scaler.transform(X)
    
    return X_scaled, scaler, le

def predict_fertilizer(input_data):
    """
    Main prediction function
    
    Args:
        input_data: dict with sensor readings and crop type
    
    Returns:
        dict with fertilizer recommendations in kg/ha
    """
    # Load model and preprocessors
    model, scaler, le = load_model_and_preprocessors()
    
    # Preprocess input
    X_scaled, scaler, le = preprocess_input(input_data, scaler, le)
    
    # Make prediction
    predictions = model.predict(X_scaled)
    
    # Map to fertilizer names
    target_features = [
        "fertilizer_urea_kg_per_ha",
        "fertilizer_dap_kg_per_ha",
        "fertilizer_map_kg_per_ha",
        "fertilizer_mop_kg_per_ha",
        "fertilizer_sop_kg_per_ha",
        "fertilizer_can_kg_per_ha",
        "fertilizer_ssp_kg_per_ha",
        "fertilizer_ammonium_sulfate_kg_per_ha",
    ]
    
    # Convert to dict
    result = {}
    for i, fertilizer in enumerate(target_features):
        # Remove 'fertilizer_' prefix and '_kg_per_ha' suffix for cleaner names
        name = fertilizer.replace('fertilizer_', '').replace('_kg_per_ha', '')
        # Convert to readable name
        name_map = {
            'urea': 'Urea',
            'dap': 'DAP',
            'map': 'MAP',
            'mop': 'MOP',
            'sop': 'SOP',
            'can': 'CAN',
            'ssp': 'SSP',
            'ammonium_sulfate': 'Ammonium Sulfate'
        }
        readable_name = name_map.get(name, name)
        result[readable_name] = max(0, float(predictions[0][i]))  # Ensure non-negative
    
    return result

if __name__ == "__main__":
    # Read input from stdin (JSON)
    try:
        input_json = sys.stdin.read()
        input_data = json.loads(input_json)
        
        # Map frontend field names to model field names
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
        
        # Make prediction
        predictions = predict_fertilizer(mapped_data)
        
        # Output as JSON
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

