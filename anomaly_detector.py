import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import random

class AnomalyDetector:
    def __init__(self):
        # Initialize with simple threshold-based detection only
        self.models = {}
        self.scalers = {}
        self.historical_data = {
            'tide_gauge': [],
            'weather_station': [],
            'water_quality': []
        }

    def _initialize_baseline_data(self):
        """Initialize with baseline historical data for training"""
        # Generate baseline data for each sensor type
        for sensor_type in self.historical_data.keys():
            if sensor_type == 'tide_gauge':
                # Tidal data typically ranges from -0.5 to 2.5 meters
                baseline = np.random.normal(1.2, 0.4, 100)
                baseline = np.clip(baseline, -0.5, 2.5)
            elif sensor_type == 'weather_station':
                # Wind speed typically ranges from 0 to 50 km/h
                baseline = np.random.normal(15, 8, 100)
                baseline = np.clip(baseline, 0, 50)
            elif sensor_type == 'water_quality':
                # Water quality index ranges from 0 to 100
                baseline = np.random.normal(75, 10, 100)
                baseline = np.clip(baseline, 0, 100)
            else:
                baseline = np.random.normal(50, 10, 100)
            
            self.historical_data[sensor_type] = baseline.tolist()

    def _train_models(self):
        """Train isolation forest models for each sensor type"""
        for sensor_type, data in self.historical_data.items():
            if len(data) > 10:  # Need minimum data points
                # Prepare data
                X = np.array(data).reshape(-1, 1)
                
                # Scale data
                scaler = StandardScaler()
                X_scaled = scaler.fit_transform(X)
                
                # Train isolation forest
                try:
                    model = IsolationForest(contamination=0.1, random_state=42)
                    model.fit(X_scaled)
                except Exception as e:
                    print(f"Error training model for {sensor_type}: {e}")
                    # Use simple threshold detection instead
                    model = None
                
                self.models[sensor_type] = model
                self.scalers[sensor_type] = scaler

    def detect_anomaly(self, value, sensor_type):
        """Detect if a sensor reading is anomalous"""
        # Always use simple threshold-based detection to avoid ML training issues
        return self._simple_anomaly_detection(value, sensor_type)

    def _simple_anomaly_detection(self, value, sensor_type):
        """Fallback simple threshold-based anomaly detection"""
        thresholds = {
            'tide_gauge': {'min': -1.0, 'max': 3.0},
            'weather_station': {'min': 0, 'max': 80},
            'water_quality': {'min': 0, 'max': 100}
        }
        
        if sensor_type in thresholds:
            threshold = thresholds[sensor_type]
            is_anomaly = value < threshold['min'] or value > threshold['max']
            
            # Calculate simple score based on distance from normal range
            score = 0.0
            if sensor_type == 'tide_gauge':
                normal_center = 1.2
                distance = abs(value - normal_center)
                score = min(1.0, distance / 2.0)
            elif sensor_type == 'weather_station':
                normal_center = 15.0
                distance = abs(value - normal_center)
                score = min(1.0, distance / 30.0)
            elif sensor_type == 'water_quality':
                normal_center = 75.0
                distance = abs(value - normal_center)
                score = min(1.0, distance / 25.0)
            
            return {
                'score': round(score, 3),
                'is_anomaly': is_anomaly
            }
        
        return {'score': 0.0, 'is_anomaly': False}
