import random
import math
from datetime import datetime, timedelta

class DataSimulator:
    def __init__(self):
        # Define sensor locations around a coastal area
        self.sensors = {
            'TG001': {'type': 'tide_gauge', 'lat': -33.8688, 'lon': 151.2093, 'name': 'Sydney Harbour'},
            'TG002': {'type': 'tide_gauge', 'lat': -33.9249, 'lon': 151.2424, 'name': 'Botany Bay'},
            'WS001': {'type': 'weather_station', 'lat': -33.8765, 'lon': 151.2052, 'name': 'Circular Quay'},
            'WS002': {'type': 'weather_station', 'lat': -33.8900, 'lon': 151.2500, 'name': 'Bondi Beach'},
            'WQ001': {'type': 'water_quality', 'lat': -33.8600, 'lon': 151.2000, 'name': 'Harbour Bridge'},
            'WQ002': {'type': 'water_quality', 'lat': -33.9100, 'lon': 151.2300, 'name': 'Coogee Beach'},
        }
        
        # Base values for realistic simulation
        self.base_values = {
            'tide_gauge': 1.2,  # meters
            'weather_station': 15.0,  # km/h wind speed
            'water_quality': 75.0  # quality index 0-100
        }
        
        # Track time for cyclical patterns
        self.start_time = datetime.utcnow()

    def generate_sensor_readings(self):
        """Generate realistic sensor readings with temporal patterns"""
        readings = []
        current_time = datetime.utcnow()
        
        for sensor_id, sensor_info in self.sensors.items():
            # Calculate time-based variations
            hours_since_start = (current_time - self.start_time).total_seconds() / 3600
            
            if sensor_info['type'] == 'tide_gauge':
                # Simulate tidal patterns (12.42 hour cycle)
                tidal_factor = math.sin(2 * math.pi * hours_since_start / 12.42)
                base_value = self.base_values['tide_gauge']
                value = base_value + (0.8 * tidal_factor) + random.uniform(-0.2, 0.2)
                unit = 'm'
                
            elif sensor_info['type'] == 'weather_station':
                # Simulate weather patterns with daily cycle
                daily_factor = math.sin(2 * math.pi * hours_since_start / 24)
                base_value = self.base_values['weather_station']
                value = base_value + (5 * daily_factor) + random.uniform(-3, 8)
                value = max(0, value)  # Wind speed can't be negative
                unit = 'km/h'
                
            elif sensor_info['type'] == 'water_quality':
                # Simulate water quality with some random variation
                base_value = self.base_values['water_quality']
                # Add pollution events randomly
                pollution_event = random.random() < 0.05  # 5% chance
                if pollution_event:
                    value = base_value - random.uniform(20, 40)
                else:
                    value = base_value + random.uniform(-5, 5)
                value = max(0, min(100, value))  # Clamp between 0-100
                unit = 'index'
            
            readings.append({
                'sensor_id': sensor_id,
                'sensor_type': sensor_info['type'],
                'latitude': sensor_info['lat'],
                'longitude': sensor_info['lon'],
                'value': round(value, 2),
                'unit': unit
            })
        
        return readings

    def generate_hazard_alerts(self):
        """Generate realistic hazard alerts based on conditions"""
        alerts = []
        
        # Random chance for different types of hazards
        hazard_types = [
            {'type': 'storm', 'probability': 0.1, 'severities': ['medium', 'high', 'critical']},
            {'type': 'pollution', 'probability': 0.15, 'severities': ['low', 'medium', 'high']},
            {'type': 'erosion', 'probability': 0.08, 'severities': ['low', 'medium', 'high']},
            {'type': 'illegal_activity', 'probability': 0.05, 'severities': ['medium', 'high']}
        ]
        
        for hazard in hazard_types:
            if random.random() < hazard['probability']:
                # Generate alert location near one of our sensors
                sensor_id = random.choice(list(self.sensors.keys()))
                sensor = self.sensors[sensor_id]
                
                # Add some random offset to the location
                lat_offset = random.uniform(-0.02, 0.02)
                lon_offset = random.uniform(-0.02, 0.02)
                
                severity = random.choice(hazard['severities'])
                
                descriptions = {
                    'storm': f"Severe weather system detected with high winds and dangerous surf conditions",
                    'pollution': f"Water quality degradation detected - possible contamination event",
                    'erosion': f"Accelerated coastal erosion observed - infrastructure at risk",
                    'illegal_activity': f"Suspicious vessel activity detected in protected marine area"
                }
                
                alerts.append({
                    'hazard_type': hazard['type'],
                    'severity': severity,
                    'latitude': sensor['lat'] + lat_offset,
                    'longitude': sensor['lon'] + lon_offset,
                    'description': descriptions[hazard['type']]
                })
        
        return alerts
