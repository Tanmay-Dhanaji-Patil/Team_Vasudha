# Training Script Integration Guide

## 📝 **What to Add to Your Training Script**

Add these lines at the **END** of your training script, after model training is complete:

```python
# ===== SAVE MODEL AND PREPROCESSORS =====
import joblib
from pathlib import Path

# Define output directory
MODEL_DIR = Path("models")  # or your model directory path
MODEL_DIR.mkdir(exist_ok=True)

# Save the trained model
joblib.dump(gb_model, MODEL_DIR / "gb_model.pkl")
print("✓ Gradient Boosting model saved")

# Save the scaler (RobustScaler used during training)
joblib.dump(scaler, MODEL_DIR / "scaler.pkl")
print("✓ RobustScaler saved")

# Save the label encoder (LabelEncoder used for crop_type)
joblib.dump(le, MODEL_DIR / "label_encoder.pkl")
print("✓ LabelEncoder saved")

# Optional: Save crop types list for reference
crop_types_path = MODEL_DIR / "crop_types.txt"
with open(crop_types_path, 'w') as f:
    f.write('\n'.join(le.classes_))
print(f"✓ Crop types saved: {list(le.classes_)}")

print("\n" + "="*60)
print("✅ All model files saved successfully!")
print("="*60)
```

## 🔍 **Where to Add These Lines**

Add them **AFTER** these sections in your training code:

1. ✅ After model training completes
2. ✅ After `scaler.fit()` or `scaler.fit_transform()` is called
3. ✅ After `le.fit()` or `le.fit_transform()` is called
4. ✅ Before the script ends

## 📋 **Complete Example Integration**

Here's how it should look in your training script:

```python
# ... your existing training code ...

# After feature engineering and before train-test split
scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# After encoding crop type
le = LabelEncoder()
df['crop_type_encoded'] = le.fit_transform(df['crop_type'])

# ... train your models ...

# Train Gradient Boosting
gb_model = MultiOutputRegressor(
    GradientBoostingRegressor(...)
)
gb_model.fit(X_train_scaled, y_train)

# ... evaluation code ...

# ===== ADD THESE LINES AT THE END =====
import joblib
from pathlib import Path

MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

# Save everything
joblib.dump(gb_model, MODEL_DIR / "gb_model.pkl")
joblib.dump(scaler, MODEL_DIR / "scaler.pkl")
joblib.dump(le, MODEL_DIR / "label_encoder.pkl")

print("✅ Model and preprocessors saved!")
```

## ✅ **Checklist Before Retraining**

- [ ] Make sure `scaler` variable name matches (RobustScaler)
- [ ] Make sure `le` variable name matches (LabelEncoder)
- [ ] Make sure `gb_model` variable name matches (your Gradient Boosting model)
- [ ] Verify the `models/` directory exists or will be created
- [ ] Test that the script runs without errors

## 📦 **After Retraining - What to Provide**

Once you retrain, please provide:

1. ✅ **Training script** (the complete Python file)
2. ✅ **gb_model.pkl** (the trained model file)
3. ✅ **scaler.pkl** (the RobustScaler)
4. ✅ **label_encoder.pkl** (the LabelEncoder)

## 🔄 **Integration Steps**

Once you provide the files, I will:

1. ✅ Verify the model files are compatible
2. ✅ Test the prediction script with your model
3. ✅ Ensure the API endpoint works correctly
4. ✅ Update any necessary configurations
5. ✅ Test end-to-end integration

## 🚨 **Common Issues**

### Issue: "Variable not defined"
- Make sure you're saving `scaler` and `le` after they're created
- Check variable names match exactly

### Issue: "Directory not found"
- Create the `models/` directory first, or
- Update `MODEL_DIR` path to match your structure

### Issue: "Model file too large"
- This is normal - gb_model.pkl is ~47MB
- Make sure you have enough disk space

## 📞 **Ready to Integrate**

Once you've retrained and have the files ready, share:
- The training script
- The model files

And I'll complete the integration! 🚀

