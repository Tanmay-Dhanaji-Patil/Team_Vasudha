import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.linear_model import Ridge
import warnings
warnings.filterwarnings('ignore')

# Load  dataset
df = pd.read_csv('/content/realistic_fertilizer_dataset_10k.csv')

# Define features
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

# DATA PREPROCESSING
print("=" * 60)
print("DATA PREPROCESSING & EXPLORATION")
print("=" * 60)

# Check for missing columns
all_required_cols = sensor_features + categorical_features + target_features
missing_cols = [col for col in all_required_cols if col not in df.columns]
if missing_cols:
    print(f"ERROR: Missing columns: {missing_cols}")
    print(f"Available columns: {df.columns.tolist()}")
    raise ValueError("Missing required columns in dataset")

print(f"✓ All required columns present")
print(f"Dataset shape: {df.shape}")

# Check data statistics
print("\n--- Data Statistics ---")
print(f"Total samples: {len(df)}")
print(f"\nFeature ranges:")
for col in sensor_features:
    print(f"  {col}: [{df[col].min():.2f}, {df[col].max():.2f}]")

print(f"\nTarget ranges:")
for col in target_features:
    print(f"  {col}: [{df[col].min():.2f}, {df[col].max():.2f}]")

print(f"\nCrop types: {df['crop_type'].unique()}")
print(f"Crop type counts:\n{df['crop_type'].value_counts()}")

# Handle missing values
print("\n--- Handling Missing Values ---")
missing_counts = df[all_required_cols].isnull().sum()
if missing_counts.sum() > 0:
    print("Missing values found:")
    print(missing_counts[missing_counts > 0])
    # Fill missing values
    for col in sensor_features:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
    for col in target_features:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
    print("✓ Missing values filled with median")
else:
    print("✓ No missing values")

# Remove outliers using IQR method
print("\n--- Outlier Detection ---")
def remove_outliers(df, columns, threshold=3):
    df_clean = df.copy()
    for col in columns:
        Q1 = df_clean[col].quantile(0.25)
        Q3 = df_clean[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - threshold * IQR
        upper_bound = Q3 + threshold * IQR
        outlier_count = ((df_clean[col] < lower_bound) | (df_clean[col] > upper_bound)).sum()
        if outlier_count > 0:
            print(f"  {col}: {outlier_count} outliers")
        df_clean = df_clean[(df_clean[col] >= lower_bound) & (df_clean[col] <= upper_bound)]
    return df_clean

original_size = len(df)
df_clean = remove_outliers(df, sensor_features + target_features, threshold=3)
print(f"Removed {original_size - len(df_clean)} outlier samples")
print(f"Clean dataset size: {len(df_clean)}")

# Use cleaned data
df = df_clean.copy()

# Encode categorical features
print("\n--- Encoding Categorical Features ---")
le = LabelEncoder()
df['crop_type_encoded'] = le.fit_transform(df['crop_type'])
print(f"✓ Encoded {len(le.classes_)} crop types: {list(le.classes_)}")

# Create feature interactions (important for better predictions)
print("\n--- Feature Engineering ---")
df['NPK_ratio'] = df['sensor_nitrogen'] + df['sensor_phosphorus'] + df['sensor_potassium']
df['N_P_ratio'] = df['sensor_nitrogen'] / (df['sensor_phosphorus'] + 1)
df['N_K_ratio'] = df['sensor_nitrogen'] / (df['sensor_potassium'] + 1)
df['pH_moisture'] = df['soil_pH'] * df['soil_moisture_percent']
df['temp_moisture'] = df['soil_temperature_celsius'] * df['soil_moisture_percent']
print("✓ Created 5 engineered features")

# Prepare features and targets
feature_list = sensor_features + ['crop_type_encoded', 'NPK_ratio', 'N_P_ratio', 'N_K_ratio', 'pH_moisture', 'temp_moisture']
X = df[feature_list]
y = df[target_features]

print(f"\nFinal Features shape: {X.shape}")
print(f"Targets shape: {y.shape}")

# Check for any remaining issues
if X.isnull().sum().sum() > 0 or y.isnull().sum().sum() > 0:
    print("WARNING: Still have missing values!")
    X = X.fillna(X.median())
    y = y.fillna(y.median())

# ===== TRAIN-TEST SPLIT =====
print("\n" + "=" * 60)
print("TRAIN-TEST SPLIT")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

print(f"Training set size: {X_train.shape[0]}")
print(f"Test set size: {X_test.shape[0]}")

# ===== FEATURE SCALING =====
print("\n--- Feature Scaling ---")
# Using RobustScaler which is less sensitive to outliers
scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print("✓ Features scaled using RobustScaler")

# ===== MODEL TRAINING =====
print("\n" + "=" * 60)
print("MODEL TRAINING")
print("=" * 60)

# Model 1: Random Forest
print("\n1. Training Random Forest Regressor...")
rf_model = MultiOutputRegressor(
    RandomForestRegressor(
        n_estimators=300,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1,
        bootstrap=True
    )
)
rf_model.fit(X_train_scaled, y_train)
print("✓ Random Forest trained")

# Model 2: Extra Trees (often more robust)
print("\n2. Training Extra Trees Regressor...")
et_model = MultiOutputRegressor(
    ExtraTreesRegressor(
        n_estimators=300,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1,
        bootstrap=True
    )
)
et_model.fit(X_train_scaled, y_train)
print("✓ Extra Trees trained")

# Model 3: Gradient Boosting
print("\n3. Training Gradient Boosting Regressor...")
gb_model = MultiOutputRegressor(
    GradientBoostingRegressor(
        n_estimators=200,
        max_depth=10,
        learning_rate=0.1,
        subsample=0.8,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=42
    )
)
gb_model.fit(X_train_scaled, y_train)
print("✓ Gradient Boosting trained")

# ===== MODEL EVALUATION =====
print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

def evaluate_model(model, X_train, y_train, X_test, y_test, model_name):
    """Comprehensive model evaluation"""
    # Predictions
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)

    # Overall R² scores
    train_r2 = r2_score(y_train, y_train_pred)
    test_r2 = r2_score(y_test, y_test_pred)

    # Individual target R² scores
    individual_train_r2 = []
    individual_test_r2 = []

    for i in range(y_test.shape[1]):
        train_score = r2_score(y_train.iloc[:, i], y_train_pred[:, i])
        test_score = r2_score(y_test.iloc[:, i], y_test_pred[:, i])
        individual_train_r2.append(train_score)
        individual_test_r2.append(test_score)

    # Other metrics
    test_mae = mean_absolute_error(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))

    # Overfitting check
    overfitting_gap = train_r2 - test_r2

    print(f"\n{model_name} Results:")
    print("-" * 60)
    print(f"Overall Training R²:  {train_r2:.4f}")
    print(f"Overall Test R²:      {test_r2:.4f}")
    print(f"Overfitting Gap:      {overfitting_gap:.4f}")
    print(f"Test MAE:             {test_mae:.4f}")
    print(f"Test RMSE:            {test_rmse:.4f}")

    print(f"\nIndividual Target R² Scores (Train | Test):")
    for i, target in enumerate(target_features):
        print(f"  {target}:")
        print(f"    Train: {individual_train_r2[i]:7.4f} | Test: {individual_test_r2[i]:7.4f}")

    # Status
    if test_r2 < 0:
        print(f"\n❌ CRITICAL: Negative R² score - model worse than baseline!")
    elif test_r2 < 0.5:
        print(f"\n⚠️  WARNING: Low R² score - model needs improvement")
    elif overfitting_gap > 0.15:
        print(f"\n⚠️  WARNING: Significant overfitting detected")
    elif test_r2 >= 0.9:
        print(f"\n✓ EXCELLENT: High R² with good generalization!")
    else:
        print(f"\n✓ GOOD: Reasonable performance")

    return test_r2, individual_test_r2, y_test_pred

# Evaluate all models
print("\n" + "=" * 60)
rf_r2, rf_individual, rf_pred = evaluate_model(
    rf_model, X_train_scaled, y_train, X_test_scaled, y_test,
    "Random Forest"
)

et_r2, et_individual, et_pred = evaluate_model(
    et_model, X_train_scaled, y_train, X_test_scaled, y_test,
    "Extra Trees"
)

gb_r2, gb_individual, gb_pred = evaluate_model(
    gb_model, X_train_scaled, y_train, X_test_scaled, y_test,
    "Gradient Boosting"
)

# ===== ENSEMBLE MODEL =====
print("\n" + "=" * 60)
print("ENSEMBLE MODEL (WEIGHTED AVERAGING)")
print("=" * 60)

# Weighted ensemble based on performance
weights = np.array([max(0, rf_r2), max(0, et_r2), max(0, gb_r2)])
if weights.sum() > 0:
    weights = weights / weights.sum()
else:
    weights = np.array([1/3, 1/3, 1/3])

print(f"Model weights: RF={weights[0]:.3f}, ET={weights[1]:.3f}, GB={weights[2]:.3f}")

y_train_ensemble = (
    weights[0] * rf_model.predict(X_train_scaled) +
    weights[1] * et_model.predict(X_train_scaled) +
    weights[2] * gb_model.predict(X_train_scaled)
)

y_test_ensemble = (
    weights[0] * rf_pred +
    weights[1] * et_pred +
    weights[2] * gb_pred
)

ensemble_train_r2 = r2_score(y_train, y_train_ensemble)
ensemble_test_r2 = r2_score(y_test, y_test_ensemble)
ensemble_individual_r2 = [
    r2_score(y_test.iloc[:, i], y_test_ensemble[:, i])
    for i in range(y_test.shape[1])
]

print(f"\nEnsemble Results:")
print("-" * 60)
print(f"Overall Training R²:  {ensemble_train_r2:.4f}")
print(f"Overall Test R²:      {ensemble_test_r2:.4f}")
print(f"Overfitting Gap:      {ensemble_train_r2 - ensemble_test_r2:.4f}")

print(f"\nIndividual Target R² Scores:")
for i, target in enumerate(target_features):
    print(f"  {target}: {ensemble_individual_r2[i]:7.4f}")

print("\n" + "=" * 60)
print("FINAL MODEL SELECTION")
print("=" * 60)

all_scores = {
    'Random Forest': rf_r2,
    'Extra Trees': et_r2,
    'Gradient Boosting': gb_r2,
    'Ensemble': ensemble_test_r2
}

best_model_name = max(all_scores, key=all_scores.get)
best_score = all_scores[best_model_name]

print(f"\nModel Comparison:")
for name, score in sorted(all_scores.items(), key=lambda x: x[1], reverse=True):
    status = "✓" if score == best_score else " "
    print(f"{status} {name:20s}: {score:7.4f}")

print(f"\n{'='*60}")
if best_score >= 0.9:
    print(f"✓✓✓ SUCCESS! {best_model_name} achieves R² = {best_score:.4f} (>0.9)")
elif best_score >= 0.8:
    print(f"✓✓ GOOD! {best_model_name} achieves R² = {best_score:.4f}")
elif best_score >= 0.5:
    print(f"✓ {best_model_name} achieves R² = {best_score:.4f}")
    print("Consider: more data, better features, or hyperparameter tuning")
else:
    print(f"{best_model_name} achieves R² = {best_score:.4f}")
    print("RECOMMENDATIONS:")
    print("  1. Check data quality and feature relevance")
    print("  2. Verify target values are predictable from features")
    print("  3. Consider collecting more diverse training data")
    print("  4. Try different feature engineering approaches")

print(f"{'='*60}")

# ===== FEATURE IMPORTANCE =====
print("\n" + "=" * 60)
print("FEATURE IMPORTANCE")
print("=" * 60)

feature_importance = np.mean([
    est.feature_importances_
    for est in rf_model.estimators_
], axis=0)

importance_df = pd.DataFrame({
    'Feature': feature_list,
    'Importance': feature_importance
}).sort_values('Importance', ascending=False)

print("\nTop 10 Most Important Features:")
print(importance_df.head(10).to_string(index=False))


print("\n" + "=" * 60)
print("DIAGNOSTIC INFORMATION")
print("=" * 60)

print("\nTarget Correlation Matrix:")
corr_matrix = y_train.corr()
print(corr_matrix.round(3))

print("\n✓ Training complete! Models are ready for predictions.")
print("\nTo make predictions on new data:")
print("  1. Prepare features in the same format")
print("  2. Scale using: X_new_scaled = scaler.transform(X_new)")
print("  3. Predict using: predictions = best_model.predict(X_new_scaled)")

