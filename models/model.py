# fertilizer_recommender_train.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import tensorflow as tf
from tensorflow.keras import Input, Model
from tensorflow.keras.layers import Dense, Concatenate
from tensorflow.keras.optimizers import Adam

# 1. Load and preprocess dataset
df = pd.read_csv("../data/authenticated_agriculture_dataset.csv")

# 2. Rename column typo
df = df.rename(columns={"soil_moure_percent": "soil_moisture_percent"})

# 3. Define feature and target columns
sensor_features = [
    "sensor_nitrogen",
    "sensor_phosphorus",
    "sensor_potassium",
    "soil_pH",
    "soil_moisture_percent",
    "soil_electrical_conductivity_us_cm",
    "soil_temperature_celsius",
]
categorical_features = ["crop_type", "season"]
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

X = df[sensor_features + categorical_features]
y = df[target_features]

# 4. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5. Build preprocessing pipeline
numeric_pipeline = Pipeline([
    ("scaler", StandardScaler())
])
categorical_pipeline = Pipeline([
    ("onehot", OneHotEncoder(sparse=False, handle_unknown="ignore"))
])
preprocessor = ColumnTransformer([
    ("num", numeric_pipeline, sensor_features),
    ("cat", categorical_pipeline, categorical_features),
])

# 6. Prepare inputs for model
X_train_proc = preprocessor.fit_transform(X_train)
X_test_proc = preprocessor.transform(X_test)

n_num = len(sensor_features)
X_num_train = X_train_proc[:, :n_num]
X_cat_train = X_train_proc[:, n_num:]
X_num_test = X_test_proc[:, :n_num]
X_cat_test = X_test_proc[:, n_num:]

# 7. Build neural network with dual inputs
input_num = Input(shape=(n_num,), name="numeric_input")
input_cat = Input(shape=(X_cat_train.shape[1],), name="categorical_input")

# numeric branch
x_num = Dense(32, activation="relu")(input_num)
x_num = Dense(16, activation="relu")(x_num)

# categorical branch
x_cat = Dense(16, activation="relu")(input_cat)

# merge
x = Concatenate()([x_num, x_cat])
x = Dense(64, activation="relu")(x)
x = Dense(32, activation="relu")(x)

# outputs
outputs = []
for feat in target_features:
    outputs.append(Dense(1, activation="relu", name=feat)(x))

model = Model(inputs=[input_num, input_cat], outputs=outputs)
model.compile(
    optimizer=Adam(learning_rate=1e-3),
    loss="mse",
    metrics=["mae"]
)

# 8. Train model
history = model.fit(
    {"numeric_input": X_num_train, "categorical_input": X_cat_train},
    {feat: y_train[feat].values for feat in target_features},
    validation_data=(
        {"numeric_input": X_num_test, "categorical_input": X_cat_test},
        {feat: y_test[feat].values for feat in target_features}
    ),
    epochs=100,
    batch_size=32,
    verbose=2
)

# 9. Save model and preprocessor
model.save("fertilizer_recommender_model.keras")
joblib.dump(preprocessor, "preprocessor.pkl")

# 10. Example inference function
def recommend(sample: dict):
    """
    sample dict must include:
      - sensor_nitrogen, sensor_phosphorus, sensor_potassium,
      - soil_pH, soil_moisture_percent,
      - soil_electrical_conductivity_us_cm, soil_temperature_celsius,
      - crop_type, season
    """
    df_s = pd.DataFrame([sample])
    proc = preprocessor.transform(df_s)
    Xn = proc[:, :n_num]
    Xc = proc[:, n_num:]
    preds = model.predict({"numeric_input": Xn, "categorical_input": Xc})
    return {target_features[i]: float(preds[i][0]) for i in range(len(target_features))}

# Usage:
# sample_input = {
#     "sensor_nitrogen": 120, ...,
#     "crop_type": "Maize", "season": "Kharif"
# }
# print(recommend(sample_input))
