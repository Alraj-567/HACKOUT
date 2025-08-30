# Coastal Hazards Monitoring Dashboard

## Overview

This is a real-time coastal hazards monitoring system built with Flask that tracks environmental conditions through simulated sensor networks. The application provides a web-based dashboard for monitoring tide levels, weather conditions, and water quality across coastal locations. It features anomaly detection using machine learning to identify unusual patterns in sensor data and generates hazard alerts for potential threats like storms, pollution, or erosion.

The system simulates sensor networks around Sydney Harbour area with tide gauges, weather stations, and water quality monitors. It uses temporal patterns to generate realistic data and employs isolation forest algorithms for anomaly detection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5 for responsive UI
- **Interactive Components**: Leaflet.js for mapping, Chart.js for data visualization
- **Real-time Updates**: JavaScript polling every 30 seconds for live data refresh
- **Responsive Design**: Mobile-first approach with Bootstrap grid system

### Backend Architecture
- **Web Framework**: Flask with SQLAlchemy ORM for database operations
- **API Design**: RESTful endpoints serving JSON data for dashboard consumption
- **Data Flow**: Route handlers coordinate between data simulation, anomaly detection, and database storage
- **Session Management**: Flask sessions with configurable secret key

### Data Storage
- **Primary Database**: SQLite for development (configurable to PostgreSQL via DATABASE_URL)
- **Schema Design**: Three main entities - SensorData, HazardAlert, and AnomalyDetection
- **Data Models**: 
  - SensorData tracks readings from sensors with geolocation
  - HazardAlert manages severity-based coastal hazard warnings
  - AnomalyDetection stores ML-generated anomaly scores

### Machine Learning Components
- **Anomaly Detection**: Isolation Forest algorithm from scikit-learn
- **Data Preprocessing**: StandardScaler for feature normalization
- **Model Training**: Per-sensor-type models trained on historical baseline data
- **Pattern Recognition**: Temporal pattern simulation for realistic tidal, weather, and quality data

### Data Simulation System
- **Sensor Network**: Predefined sensor locations around Sydney Harbour
- **Temporal Patterns**: Mathematical models for tidal cycles (12.42h) and daily weather patterns
- **Realistic Ranges**: Appropriate value ranges for each sensor type with noise injection
- **Geographic Distribution**: Multiple sensor types across different coastal locations

## External Dependencies

### Core Framework Dependencies
- **Flask**: Web application framework with SQLAlchemy integration
- **SQLAlchemy**: ORM for database operations with declarative base model
- **Werkzeug**: WSGI utilities including ProxyFix middleware

### Machine Learning Libraries
- **scikit-learn**: Isolation Forest for anomaly detection and StandardScaler
- **NumPy**: Numerical computing for data processing and mathematical operations

### Frontend Libraries (CDN)
- **Bootstrap 5**: CSS framework for responsive design and UI components
- **Font Awesome**: Icon library for dashboard visual elements
- **Leaflet.js**: Interactive mapping library for sensor and hazard visualization
- **Chart.js**: Data visualization library for time-series charts

### Database Configuration
- **SQLite**: Default development database (file-based)
- **PostgreSQL**: Production database option via DATABASE_URL environment variable
- **Connection Pooling**: Configured with pool recycling and pre-ping health checks

### Environment Configuration
- **SESSION_SECRET**: Configurable secret key for Flask sessions
- **DATABASE_URL**: Database connection string with fallback to SQLite
- **Debug Mode**: Configurable Flask debug mode for development