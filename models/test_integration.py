"""
Test script to verify model integration works correctly
"""

import sys
import json
from pathlib import Path
import joblib

MODEL_DIR = Path(__file__).parent

def test_file_loading():
    """Test that all model files can be loaded"""
    print("=" * 60)
    print("Testing Model File Loading")
    print("=" * 60)
    
    # Test model loading
    try:
        model = joblib.load(MODEL_DIR / "gb_model.pkl")
        print("✅ gb_model.pkl loaded successfully")
        print(f"   Model type: {type(model)}")
    except Exception as e:
        print(f"❌ Failed to load gb_model.pkl: {e}")
        return False
    
    # Test scaler loading
    scaler_files = [
        "scaler.pkl",
        "feature_scaler (1).pkl",
        "feature_scaler.pkl"
    ]
    
    scaler = None
    scaler_file = None
    for filename in scaler_files:
        path = MODEL_DIR / filename
        if path.exists():
            try:
                scaler = joblib.load(path)
                scaler_file = filename
                print(f"✅ {filename} loaded successfully")
                print(f"   Scaler type: {type(scaler)}")
                break
            except Exception as e:
                print(f"⚠ Failed to load {filename}: {e}")
    
    if scaler is None:
        print("❌ No scaler file found!")
        return False
    
    # Test encoder loading
    encoder_files = [
        "label_encoder.pkl",
        "crop_type_encoder.pkl"
    ]
    
    encoder = None
    encoder_file = None
    for filename in encoder_files:
        path = MODEL_DIR / filename
        if path.exists():
            try:
                encoder = joblib.load(path)
                encoder_file = filename
                print(f"✅ {filename} loaded successfully")
                print(f"   Encoder type: {type(encoder)}")
                print(f"   Crop types: {list(encoder.classes_)}")
                break
            except Exception as e:
                print(f"⚠ Failed to load {filename}: {e}")
    
    if encoder is None:
        print("❌ No encoder file found!")
        return False
    
    print("\n" + "=" * 60)
    print("✅ All files loaded successfully!")
    print(f"   Using scaler: {scaler_file}")
    print(f"   Using encoder: {encoder_file}")
    print("=" * 60)
    
    return True

def test_prediction():
    """Test making a prediction"""
    print("\n" + "=" * 60)
    print("Testing Prediction")
    print("=" * 60)
    
    try:
        # Import the prediction function
        sys.path.insert(0, str(MODEL_DIR))
        from predict_fertilizer import predict_fertilizer
        
        # Test input
        test_input = {
            'sensor_nitrogen': 50.0,
            'sensor_phosphorus': 30.0,
            'sensor_potassium': 40.0,
            'soil_pH': 7.0,
            'soil_moisture_percent': 50.0,
            'soil_electrical_conductivity_us_cm': 1.5,
            'soil_temperature_celsius': 28.0,
            'crop_type': 'Wheat'
        }
        
        print("Test input:")
        for key, value in test_input.items():
            print(f"  {key}: {value}")
        
        print("\nMaking prediction...")
        predictions = predict_fertilizer(test_input)
        
        print("\n✅ Prediction successful!")
        print("\nFertilizer Recommendations (kg/ha):")
        for fertilizer, amount in predictions.items():
            if amount > 0:
                print(f"  {fertilizer}: {amount:.2f}")
        
        if all(v == 0 for v in predictions.values()):
            print("  (No fertilizer recommendations)")
        
        return True
        
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🧪 Model Integration Test\n")
    
    # Test file loading
    if not test_file_loading():
        print("\n❌ File loading test failed. Please check your model files.")
        sys.exit(1)
    
    # Test prediction
    if not test_prediction():
        print("\n❌ Prediction test failed. Please check the model integration.")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nYour model is ready to use! 🚀")

