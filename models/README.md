# ML Model Integration Guide

## Overview
This directory contains the trained Gradient Boosting model (`gb_model.pkl`) and utilities for making fertilizer recommendations based on soil sensor data.

## Files
- `gb_model.pkl` - Trained Gradient Boosting model (47MB)
- `predict_fertilizer.py` - Python script to load model and make predictions
- `save_preprocessors.py` - Utility to save preprocessing components
- `preprocessor.pkl` - Preprocessor for neural network model (different model)

## Setup Instructions

### 1. Install Python Dependencies
Make sure you have Python 3.7+ installed with the following packages:
```bash
pip install pandas numpy scikit-learn joblib
```

### 2. Preprocessing Components (IMPORTANT)

The model needs a `RobustScaler` and `LabelEncoder` from training. The code will automatically try three options:

#### **Option 1: Load Saved Files (BEST - Recommended)**
If you have `scaler.pkl` and `label_encoder.pkl`, the code will use them automatically.

**To create these files, add this to your training script:**
```python
import joblib

# After creating scaler and le in your training code:
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(le, 'models/label_encoder.pkl')
print("✓ Preprocessors saved")
```

#### **Option 2: Auto-Recreate from Training Dataset**
If saved files don't exist, the code will automatically try to recreate them from your training dataset. It looks for:
- `data/realistic_fertilizer_dataset_10k.csv`
- `data/authenticated_agriculture_dataset.csv`
- `models/training_data.csv`

**Or manually run:**
```bash
python models/extract_preprocessors.py
```
(Update the dataset path in the script first)

#### **Option 3: Fallback (Works but Less Accurate)**
If neither option works, the code uses fallback preprocessors. Predictions will work but may be less accurate.

**Recommendation:** Always use Option 1 for best results!

### 3. Test the Model
Test the prediction script:
```bash
echo '{"nitrogen": 50, "phosphorous": 30, "potassium": 40, "ph": 7.0, "moisture": 50, "soil_ec": 1.5, "temperature": 28, "crop": "Wheat"}' | python models/predict_fertilizer.py
```

Expected output:
```json
{
  "success": true,
  "predictions": {
    "Urea": 125.5,
    "DAP": 85.2,
    "MAP": 0.0,
    "MOP": 45.8,
    ...
  }
}
```

## API Integration

The model is integrated with the Next.js frontend via `/api/ml-recommendation` endpoint.

### Frontend Usage
1. Fill in soil sensor data in the form
2. Click "Get ML Recommendations" button
3. View predictions displayed below the form

### API Endpoint
**POST** `/api/ml-recommendation`

**Request Body:**
```json
{
  "nitrogen": 50,
  "phosphorous": 30,
  "potassium": 40,
  "ph": 7.0,
  "moisture": 50,
  "soil_ec": 1.5,
  "temperature": 28,
  "crop": "Wheat"
}
```

**Response:**
```json
{
  "success": true,
  "predictions": {
    "Urea": 125.5,
    "DAP": 85.2,
    "MAP": 0.0,
    "MOP": 45.8,
    "SOP": 0.0,
    "CAN": 0.0,
    "SSP": 30.5,
    "Ammonium Sulfate": 0.0
  }
}
```

## Model Input Requirements

The model expects these inputs (mapped from form fields):
- `sensor_nitrogen` (from form: `nitrogen`)
- `sensor_phosphorus` (from form: `phosphorous`)
- `sensor_potassium` (from form: `potassium`)
- `soil_pH` (from form: `ph`)
- `soil_moisture_percent` (from form: `moisture`)
- `soil_electrical_conductivity_us_cm` (from form: `soil_ec`)
- `soil_temperature_celsius` (from form: `temperature`)
- `crop_type` (from form: `crop`)

## Model Output

The model predicts 8 fertilizer amounts in **kg per hectare (kg/ha)**:
1. Urea
2. DAP (Diammonium Phosphate)
3. MAP (Monoammonium Phosphate)
4. MOP (Muriate of Potash)
5. SOP (Sulfate of Potash)
6. CAN (Calcium Ammonium Nitrate)
7. SSP (Single Super Phosphate)
8. Ammonium Sulfate

## Troubleshooting

### Error: "Python not found"
- Install Python 3.7+ and ensure it's in your PATH
- On Windows, you may need to use `python` instead of `python3`

### Error: "Model file not found"
- Ensure `gb_model.pkl` exists in the `models/` directory
- Check file permissions

### Error: "Scaler/LabelEncoder not found"
- Save the preprocessing components from your training code
- See "Save Preprocessing Components" section above

### Predictions are all zeros
- Check if input values are within expected ranges
- Verify crop type matches training data
- Model may correctly predict no fertilizer needed

### Predictions seem incorrect
- Ensure input values are in correct units (e.g., pH 4-9, temperature in Celsius)
- Verify crop type is one of the trained crop types
- Check if scaler and label encoder match the training data

## Notes

- The model uses feature engineering (NPK ratios, interactions) internally
- All predictions are non-negative (negative values are clamped to 0)
- The model was trained with RobustScaler, which is less sensitive to outliers
- Crop types must match those seen during training (use LabelEncoder to check)

