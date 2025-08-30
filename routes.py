from flask import render_template, jsonify, request
from app import app, db
from models import SensorData, HazardAlert, AnomalyDetection
from data_simulator import DataSimulator
from anomaly_detector import AnomalyDetector
from datetime import datetime, timedelta
import json

# Initialize data simulator and anomaly detector
data_simulator = DataSimulator()
anomaly_detector = AnomalyDetector()

@app.route('/')
def dashboard():
    """Main dashboard route"""
    return render_template('dashboard.html')

@app.route('/api/sensor-data')
def get_sensor_data():
    """Get current sensor data for the dashboard"""
    # Generate and store new sensor data
    new_data = data_simulator.generate_sensor_readings()
    
    for reading in new_data:
        sensor_data = SensorData()
        sensor_data.sensor_id = reading['sensor_id']
        sensor_data.sensor_type = reading['sensor_type']
        sensor_data.latitude = reading['latitude']
        sensor_data.longitude = reading['longitude']
        sensor_data.value = reading['value']
        sensor_data.unit = reading['unit']
        db.session.add(sensor_data)
    
    db.session.commit()
    
    # Get recent data (last hour)
    recent_data = SensorData.query.filter(
        SensorData.timestamp >= datetime.utcnow() - timedelta(hours=1)
    ).order_by(SensorData.timestamp.desc()).all()
    
    return jsonify([{
        'id': data.id,
        'sensor_id': data.sensor_id,
        'sensor_type': data.sensor_type,
        'latitude': data.latitude,
        'longitude': data.longitude,
        'value': data.value,
        'unit': data.unit,
        'timestamp': data.timestamp.isoformat()
    } for data in recent_data])

@app.route('/api/hazard-alerts')
def get_hazard_alerts():
    """Get active hazard alerts"""
    # Generate new alerts based on sensor data
    alerts = data_simulator.generate_hazard_alerts()
    
    for alert in alerts:
        hazard_alert = HazardAlert()
        hazard_alert.hazard_type = alert['hazard_type']
        hazard_alert.severity = alert['severity']
        hazard_alert.latitude = alert['latitude']
        hazard_alert.longitude = alert['longitude']
        hazard_alert.description = alert['description']
        db.session.add(hazard_alert)
    
    db.session.commit()
    
    # Get active alerts
    active_alerts = HazardAlert.query.filter(
        HazardAlert.is_active == True,
        HazardAlert.timestamp >= datetime.utcnow() - timedelta(hours=24)
    ).order_by(HazardAlert.timestamp.desc()).all()
    
    return jsonify([{
        'id': alert.id,
        'hazard_type': alert.hazard_type,
        'severity': alert.severity,
        'latitude': alert.latitude,
        'longitude': alert.longitude,
        'description': alert.description,
        'timestamp': alert.timestamp.isoformat()
    } for alert in active_alerts])

@app.route('/api/anomaly-detection')
def get_anomaly_detection():
    """Get anomaly detection results"""
    # Get recent sensor data for anomaly detection
    recent_sensors = SensorData.query.filter(
        SensorData.timestamp >= datetime.utcnow() - timedelta(hours=1)
    ).all()
    
    anomalies = []
    for sensor in recent_sensors:
        anomaly_result = anomaly_detector.detect_anomaly(sensor.value, sensor.sensor_type)
        
        anomaly_detection = AnomalyDetection()
        anomaly_detection.sensor_id = sensor.sensor_id
        anomaly_detection.anomaly_score = float(anomaly_result['score'])
        anomaly_detection.is_anomaly = anomaly_result['is_anomaly']
        db.session.add(anomaly_detection)
        anomalies.append({
            'sensor_id': sensor.sensor_id,
            'sensor_type': sensor.sensor_type,
            'value': sensor.value,
            'anomaly_score': anomaly_result['score'],
            'is_anomaly': anomaly_result['is_anomaly'],
            'timestamp': sensor.timestamp.isoformat()
        })
    
    db.session.commit()
    return jsonify(anomalies)

@app.route('/api/dashboard-stats')
def get_dashboard_stats():
    """Get dashboard statistics"""
    total_sensors = len(data_simulator.sensors)
    active_alerts = HazardAlert.query.filter(
        HazardAlert.is_active == True,
        HazardAlert.timestamp >= datetime.utcnow() - timedelta(hours=24)
    ).count()
    
    recent_anomalies = AnomalyDetection.query.filter(
        AnomalyDetection.is_anomaly == True,
        AnomalyDetection.timestamp >= datetime.utcnow() - timedelta(hours=1)
    ).count()
    
    return jsonify({
        'total_sensors': total_sensors,
        'active_alerts': active_alerts,
        'recent_anomalies': recent_anomalies,
        'system_status': 'operational'
    })

@app.route('/api/chart-data/<chart_type>')
def get_chart_data(chart_type):
    """Get data for different chart types"""
    if chart_type == 'tide_levels':
        data = SensorData.query.filter(
            SensorData.sensor_type == 'tide_gauge',
            SensorData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(SensorData.timestamp).all()
        
        return jsonify({
            'labels': [d.timestamp.strftime('%H:%M') for d in data[-20:]],
            'datasets': [{
                'label': 'Tide Level (m)',
                'data': [d.value for d in data[-20:]],
                'borderColor': '#3498db',
                'backgroundColor': 'rgba(52, 152, 219, 0.1)'
            }]
        })
    
    elif chart_type == 'water_quality':
        data = SensorData.query.filter(
            SensorData.sensor_type == 'water_quality',
            SensorData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(SensorData.timestamp).all()
        
        return jsonify({
            'labels': [d.timestamp.strftime('%H:%M') for d in data[-20:]],
            'datasets': [{
                'label': 'Water Quality Index',
                'data': [d.value for d in data[-20:]],
                'borderColor': '#2ecc71',
                'backgroundColor': 'rgba(46, 204, 113, 0.1)'
            }]
        })
    
    elif chart_type == 'weather':
        data = SensorData.query.filter(
            SensorData.sensor_type == 'weather_station',
            SensorData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(SensorData.timestamp).all()
        
        return jsonify({
            'labels': [d.timestamp.strftime('%H:%M') for d in data[-20:]],
            'datasets': [{
                'label': 'Wind Speed (km/h)',
                'data': [d.value for d in data[-20:]],
                'borderColor': '#e74c3c',
                'backgroundColor': 'rgba(231, 76, 60, 0.1)'
            }]
        })
    
    return jsonify({'error': 'Invalid chart type'})
