# Detailed Prompt for Generating Synthetic Fertilizer Dataset

## 🎯 **Objective**
Generate a comprehensive synthetic dataset for fertilizer recommendations using the existing standard values from our soil health monitoring system as the base parameters.

## 📊 **Base Standard Values (From Our System)**

### **Crop Standards:**
```javascript
const cropOptions = [
  { name: "Wheat", values: { nitrogen: 90, phosphorous: 45, potassium: 45, temperature: 25, moisture: 15, ph: 7.0 } },
  { name: "Rice", values: { nitrogen: 110, phosphorous: 50, potassium: 60, temperature: 28, moisture: 20, ph: 6.5 } },
  { name: "Maize", values: { nitrogen: 80, phosphorous: 40, potassium: 50, temperature: 24, moisture: 12, ph: 6.8 } }
];
```

### **Fertilizer Prices (From Our System):**
```javascript
// Organic Fertilizers
const organicFertilizers = {
  nitrogen: [
    { name: "Neem Cake Fertilizer", price: 225 },
    { name: "Bio NPK Liquid Fertilizer", price: 150 }
  ],
  phosphorous: [
    { name: "Bone Meal", price: 325 },
    { name: "Rock Phosphate", price: 275 }
  ],
  potassium: [
    { name: "Wood Ash", price: 0 },
    { name: "Seaweed/Kelp Meal", price: 400 }
  ]
};

// Inorganic Fertilizers
const inorganicFertilizers = {
  nitrogen: [
    { name: "Urea", price: 5.5 },
    { name: "Ammonium Sulfate", price: 9 }
  ],
  phosphorous: [
    { name: "DAP", price: 27.5 },
    { name: "SSP", price: 9 }
  ],
  potassium: [
    { name: "MOP", price: 21 },
    { name: "Potassium Sulfate", price: 37.5 }
  ]
};
```

## 🔧 **Dataset Generation Prompt**

```
You are an agricultural data scientist tasked with generating a synthetic fertilizer recommendation dataset for machine learning training. Use the provided standard values as your base parameters and create realistic variations.

## BASE PARAMETERS TO USE:

### Crop Standards (Use as reference points):
- Wheat: N=90, P=45, K=45, Temp=25°C, Moisture=15%, pH=7.0
- Rice: N=110, P=50, K=60, Temp=28°C, Moisture=20%, pH=6.5  
- Maize: N=80, P=40, K=50, Temp=24°C, Moisture=12%, pH=6.8

### Fertilizer Prices (Use for cost calculations):
- Organic: N=₹225/kg, P=₹325/kg, K=₹400/kg
- Inorganic: N=₹5.5/kg, P=₹27.5/kg, K=₹21/kg

## GENERATION RULES:

### 1. Soil Parameter Variations:
- Generate soil values that are 60-120% of standard values
- Add realistic seasonal variations (±10-20%)
- Include soil degradation scenarios (80-95% of standards)
- Add soil improvement scenarios (105-120% of standards)

### 2. Environmental Factors:
- Generate realistic Indian agricultural locations
- Include seasonal variations (Kharif, Rabi, Summer)
- Add weather conditions (dry, humid, moderate)
- Include rainfall data (300-2000mm annually)

### 3. Plot Characteristics:
- Plot areas: 0.5-10 acres (realistic Indian farm sizes)
- Soil types: clay, loam, sandy, clay-loam
- Locations: Include major Indian agricultural states

### 4. Fertilizer Requirements Calculation:
- Calculate requirements as: max(0, (standard_value - current_soil_value) * plot_area_factor)
- Use plot_area_factor = plot_area / 100 for realistic scaling
- Apply 10-30% efficiency factors based on soil conditions

### 5. Fertilizer Type Selection:
- Organic: pH < 6.5 or pH > 8.0, or moisture < 50%
- Inorganic: pH 6.5-8.0 and good moisture conditions
- Mixed: Borderline conditions or specific crop requirements

## REQUIRED OUTPUT FORMAT:

Generate exactly 2000 records in CSV format with these columns:

```csv
soil_nitrogen,soil_phosphorous,soil_potassium,soil_ph,soil_moisture,soil_temperature,soil_ec,soil_humidity,crop_type,plot_area,season,soil_type,location_state,location_district,rainfall,weather_condition,nitrogen_requirement,phosphorous_requirement,potassium_requirement,fertilizer_type,recommended_fertilizer_name,application_method,application_timing,cost_per_acre
```

## DATA DISTRIBUTION REQUIREMENTS:

### Crop Distribution:
- Wheat: 35% (700 records)
- Rice: 35% (700 records)  
- Maize: 30% (600 records)

### Season Distribution:
- Kharif: 40% (800 records)
- Rabi: 40% (800 records)
- Summer: 20% (400 records)

### Soil Type Distribution:
- Loam: 40% (800 records)
- Clay: 30% (600 records)
- Sandy: 20% (400 records)
- Clay-loam: 10% (200 records)

### Location Distribution (Indian States):
- Maharashtra: 20% (400 records)
- Karnataka: 15% (300 records)
- Tamil Nadu: 15% (300 records)
- Uttar Pradesh: 10% (200 records)
- Gujarat: 10% (200 records)
- Punjab: 10% (200 records)
- Others: 20% (400 records)

## REALISTIC VALUE RANGES:

### Soil Parameters:
- soil_nitrogen: 20-150 ppm
- soil_phosphorous: 5-80 ppm
- soil_potassium: 30-200 ppm
- soil_ph: 5.5-8.5
- soil_moisture: 30-85%
- soil_temperature: 15-40°C
- soil_ec: 0.2-3.0 dS/m
- soil_humidity: 40-90%

### Plot Characteristics:
- plot_area: 0.5-10.0 acres
- rainfall: 300-2000 mm/year

### Requirements (Based on Standards):
- nitrogen_requirement: 0-50 kg/acre
- phosphorous_requirement: 0-30 kg/acre
- potassium_requirement: 0-40 kg/acre
- cost_per_acre: ₹1000-₹8000

## QUALITY REQUIREMENTS:

1. **Realistic Correlations**: High nitrogen soil should have lower nitrogen requirements
2. **Seasonal Logic**: Kharif crops should have higher moisture requirements
3. **Geographic Logic**: Coastal areas should have higher humidity
4. **Economic Logic**: Organic fertilizers should be more expensive per acre
5. **Agricultural Logic**: Acidic soils should prefer organic fertilizers

## VALIDATION RULES:

- All soil values must be positive
- Requirements cannot be negative
- pH must be between 4.0-9.0
- Moisture cannot exceed 100%
- Temperature must be realistic for Indian climate
- Cost must correlate with fertilizer type and quantities

Generate the dataset now, ensuring all values are realistic and follow agricultural principles while using the provided standard values as your foundation.
```

## 🎯 **Usage Instructions:**

1. **Copy the prompt above** and use it with any AI model (ChatGPT, Claude, Gemini, etc.)
2. **The AI will generate 2000 realistic records** based on your standard values
3. **Save the output as CSV** for ML model training
4. **Validate the data** using the quality requirements mentioned

## 📋 **Expected Output:**

The AI will generate a CSV file with 2000 records that:
- Uses your exact standard values as base parameters
- Creates realistic variations around those standards
- Includes proper correlations between soil conditions and fertilizer needs
- Follows Indian agricultural patterns and practices
- Maintains data quality and consistency

This approach ensures your synthetic dataset is grounded in your actual system's standard values while providing enough variation for effective ML model training! 🚀

