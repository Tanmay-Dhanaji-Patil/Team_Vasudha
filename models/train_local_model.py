import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
import os
import warnings
warnings.filterwarnings('ignore')

# Use correct local path
# Use correct local path
DATA_PATH = r"D:\v4\Team_Vasudha\data\realistic_fertilizer_dataset_10k.csv"
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

def train_and_save():
    print("Loading local dataset...")
    if not os.path.exists(DATA_PATH):
        # Try absolute path based on workspace structure
        data_path_alt = os.path.join(MODEL_DIR, "../data/realistic_fertilizer_dataset_10k.csv")
        if os.path.exists(data_path_alt):
            df = pd.read_csv(data_path_alt)
        else:
            print(f"Error: Dataset not found at {DATA_PATH} or {data_path_alt}")
            return
    else:
        df = pd.read_csv(DATA_PATH)
        
    print("Dataset loaded successfully.")

    # Define columns matches Mainmodel.py
    sensor_features = [
        "sensor_nitrogen", "sensor_phosphorus", "sensor_potassium",
        "soil_pH", "soil_moisture_percent",
        "soil_electrical_conductivity_us_cm", "soil_temperature_celsius",
    ]
    target_features = [
        "fertilizer_urea_kg_per_ha", "fertilizer_dap_kg_per_ha",
        "fertilizer_map_kg_per_ha", "fertilizer_mop_kg_per_ha",
        "fertilizer_sop_kg_per_ha", "fertilizer_can_kg_per_ha",
        "fertilizer_ssp_kg_per_ha", "fertilizer_ammonium_sulfate_kg_per_ha",
    ]

    # Preprocessing (Outlier removal, Median fill) from Mainmodel.py
    # Fill missing
    for col in sensor_features + target_features:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
            
    # Outliers removal matching Mainmodel.py
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

    df = remove_outliers(df, sensor_features + target_features, threshold=3)
    
    # Feature Engineering
    le = LabelEncoder()
    df['crop_type_encoded'] = le.fit_transform(df['crop_type'])
    
    df['NPK_ratio'] = df['sensor_nitrogen'] + df['sensor_phosphorus'] + df['sensor_potassium']
    df['N_P_ratio'] = df['sensor_nitrogen'] / (df['sensor_phosphorus'] + 1)
    df['N_K_ratio'] = df['sensor_nitrogen'] / (df['sensor_potassium'] + 1)
    df['pH_moisture'] = df['soil_pH'] * df['soil_moisture_percent']
    df['temp_moisture'] = df['soil_temperature_celsius'] * df['soil_moisture_percent']

    feature_list = sensor_features + ['crop_type_encoded', 'NPK_ratio', 'N_P_ratio', 'N_K_ratio', 'pH_moisture', 'temp_moisture']
    
    X = df[feature_list]
    y = df[target_features]

    # Scaling
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    # Train GB Model (as used in Mainmodel.py)
    print("Training Gradient Boosting Model...")
    gb_model = MultiOutputRegressor(
        GradientBoostingRegressor(
            n_estimators=200, max_depth=10, learning_rate=0.1,
            subsample=0.8, min_samples_split=5, min_samples_leaf=2,
            max_features='sqrt', random_state=42
        )
    )
    gb_model.fit(X_scaled, y)
    print("Model trained.")

    # Save artifacts
    print("Saving model and preprocessors...")
    joblib.dump(gb_model, os.path.join(MODEL_DIR, "gb_model.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    joblib.dump(le, os.path.join(MODEL_DIR, "label_encoder.pkl"))
    
    # Redundant saves for compatibility
    joblib.dump(scaler, os.path.join(MODEL_DIR, "feature_scaler.pkl"))
    joblib.dump(le, os.path.join(MODEL_DIR, "crop_type_encoder.pkl"))
    
    print("✓ Model artifacts saved successfully.")

if __name__ == "__main__":
    train_and_save()
