// Coastal Hazards Map Component

class HazardMap {
    constructor() {
        this.map = null;
        this.sensorMarkers = new Map();
        this.hazardMarkers = new Map();
        this.allSensorData = [];
        this.allHazardData = [];
        this.filters = {
            hazardType: '',
            severity: ''
        };
        
        this.init();
    }

    init() {
        this.initializeMap();
        this.setupMapLayers();
    }

    initializeMap() {
        // Initialize Leaflet map centered on Sydney Harbour area
        this.map = L.map('hazard-map').setView([-33.8688, 151.2093], 11);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Add a custom control for legend
        this.addLegendControl();
    }

    setupMapLayers() {
        // Create layer groups for different types of markers
        this.sensorLayer = L.layerGroup().addTo(this.map);
        this.hazardLayer = L.layerGroup().addTo(this.map);
        
        // Add layer control
        const overlayMaps = {
            "Sensors": this.sensorLayer,
            "Hazard Alerts": this.hazardLayer
        };
        
        L.control.layers(null, overlayMaps, { position: 'topright' }).addTo(this.map);
    }

    addLegendControl() {
        const legend = L.control({ position: 'bottomleft' });
        
        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'map-legend');
            div.style.cssText = `
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-size: 12px;
                line-height: 1.4;
            `;
            
            div.innerHTML = `
                <strong>Legend</strong><br>
                <div style="margin-top: 5px;">
                    <span style="color: #3498db;">🌊</span> Tide Gauge<br>
                    <span style="color: #e74c3c;">🌪️</span> Weather Station<br>
                    <span style="color: #27ae60;">💧</span> Water Quality<br>
                    <hr style="margin: 5px 0;">
                    <span style="color: #9b59b6;">⚠️</span> Storm Alert<br>
                    <span style="color: #e67e22;">🏭</span> Pollution<br>
                    <span style="color: #f39c12;">🏖️</span> Erosion<br>
                    <span style="color: #e74c3c;">🚨</span> Illegal Activity<br>
                </div>
            `;
            return div;
        };
        
        legend.addTo(this.map);
    }

    updateSensorData(sensorData) {
        // Store all sensor data for filtering
        this.allSensorData = sensorData;
        
        // Clear existing sensor markers
        this.sensorLayer.clearLayers();
        this.sensorMarkers.clear();

        sensorData.forEach(sensor => {
            const marker = this.createSensorMarker(sensor);
            this.sensorMarkers.set(sensor.sensor_id, marker);
            this.sensorLayer.addLayer(marker);
        });
    }

    createSensorMarker(sensor) {
        const icon = this.getSensorIcon(sensor.sensor_type);
        const status = this.getSensorStatus(sensor);
        
        const marker = L.marker([sensor.latitude, sensor.longitude], {
            icon: icon
        });

        const popupContent = `
            <div class="sensor-popup">
                <h6><strong>${sensor.sensor_id}</strong></h6>
                <p><strong>Type:</strong> ${sensor.sensor_type.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Value:</strong> ${sensor.value} ${sensor.unit}</p>
                <p><strong>Status:</strong> <span class="badge bg-${status.color}">${status.text}</span></p>
                <p><strong>Location:</strong> ${sensor.latitude.toFixed(4)}, ${sensor.longitude.toFixed(4)}</p>
                <p><strong>Updated:</strong> ${new Date(sensor.timestamp).toLocaleTimeString()}</p>
            </div>
        `;

        marker.bindPopup(popupContent);
        
        // Add hover effect
        marker.on('mouseover', function() {
            this.openPopup();
        });

        return marker;
    }

    getSensorIcon(sensorType) {
        const iconSettings = {
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
            className: 'sensor-marker'
        };

        let iconHtml;
        switch(sensorType) {
            case 'tide_gauge':
                iconHtml = '<div style="background: #3498db; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🌊</div>';
                break;
            case 'weather_station':
                iconHtml = '<div style="background: #e74c3c; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🌪️</div>';
                break;
            case 'water_quality':
                iconHtml = '<div style="background: #27ae60; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">💧</div>';
                break;
            default:
                iconHtml = '<div style="background: #95a5a6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">📡</div>';
        }

        return L.divIcon({
            ...iconSettings,
            html: iconHtml
        });
    }

    getSensorStatus(sensor) {
        // Determine sensor status based on values
        if (sensor.sensor_type === 'tide_gauge') {
            if (sensor.value > 2.5 || sensor.value < -0.5) {
                return { color: 'danger', text: 'ANOMALY' };
            }
        } else if (sensor.sensor_type === 'weather_station') {
            if (sensor.value > 50) {
                return { color: 'warning', text: 'HIGH WIND' };
            }
        } else if (sensor.sensor_type === 'water_quality') {
            if (sensor.value < 50) {
                return { color: 'danger', text: 'POOR' };
            }
        }
        
        return { color: 'success', text: 'NORMAL' };
    }

    updateHazardAlerts(alerts) {
        // Store all hazard data for filtering
        this.allHazardData = alerts;
        
        // Apply current filters
        const filteredAlerts = this.filterAlerts(alerts);
        
        // Clear existing hazard markers
        this.hazardLayer.clearLayers();
        this.hazardMarkers.clear();

        filteredAlerts.forEach(alert => {
            const marker = this.createHazardMarker(alert);
            this.hazardMarkers.set(alert.id, marker);
            this.hazardLayer.addLayer(marker);
        });
    }

    createHazardMarker(alert) {
        const icon = this.getHazardIcon(alert.hazard_type, alert.severity);
        
        const marker = L.marker([alert.latitude, alert.longitude], {
            icon: icon
        });

        const severityColor = this.getSeverityColor(alert.severity);
        const popupContent = `
            <div class="hazard-popup">
                <h6 style="color: ${severityColor};">
                    <strong>${alert.hazard_type.replace('_', ' ').toUpperCase()}</strong>
                    <span class="badge bg-${this.getSeverityBadgeColor(alert.severity)} ms-2">${alert.severity.toUpperCase()}</span>
                </h6>
                <p>${alert.description}</p>
                <p><strong>Location:</strong> ${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}</p>
                <p><strong>Reported:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            </div>
        `;

        marker.bindPopup(popupContent);
        
        // Add pulsing effect for critical alerts
        if (alert.severity === 'critical') {
            marker.on('add', function() {
                this.getElement().style.animation = 'pulse 1s infinite';
            });
        }

        // Auto-open popup for critical alerts
        if (alert.severity === 'critical') {
            setTimeout(() => {
                marker.openPopup();
            }, 1000);
        }

        return marker;
    }

    getHazardIcon(hazardType, severity) {
        const iconSettings = {
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            className: `hazard-marker ${hazardType} severity-${severity}`
        };

        let iconHtml, emoji, bgColor;
        
        switch(hazardType) {
            case 'storm':
                emoji = '⚠️';
                bgColor = '#9b59b6';
                break;
            case 'pollution':
                emoji = '🏭';
                bgColor = '#e67e22';
                break;
            case 'erosion':
                emoji = '🏖️';
                bgColor = '#f39c12';
                break;
            case 'illegal_activity':
                emoji = '🚨';
                bgColor = '#e74c3c';
                break;
            default:
                emoji = '⚠️';
                bgColor = '#95a5a6';
        }

        // Adjust opacity based on severity
        const opacity = severity === 'critical' ? 1 : severity === 'high' ? 0.9 : severity === 'medium' ? 0.8 : 0.7;

        iconHtml = `
            <div style="
                background: ${bgColor}; 
                color: white; 
                border-radius: 50%; 
                width: 40px; 
                height: 40px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 20px;
                opacity: ${opacity};
                border: 3px solid white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            ">${emoji}</div>
        `;

        return L.divIcon({
            ...iconSettings,
            html: iconHtml
        });
    }

    getSeverityColor(severity) {
        const colors = {
            'low': '#27ae60',
            'medium': '#f39c12',
            'high': '#e67e22',
            'critical': '#e74c3c'
        };
        return colors[severity] || colors['low'];
    }

    getSeverityBadgeColor(severity) {
        const colors = {
            'low': 'success',
            'medium': 'warning',
            'high': 'danger',
            'critical': 'dark'
        };
        return colors[severity] || 'secondary';
    }

    // Method to focus on a specific location
    focusOnLocation(lat, lon, zoom = 15) {
        this.map.setView([lat, lon], zoom);
    }

    // Method to add custom overlay
    addCustomOverlay(name, layer) {
        this.map.addLayer(layer);
    }

    // Enhanced filtering and search methods
    applyFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        
        // Re-apply filters to hazard alerts
        const filteredAlerts = this.filterAlerts(this.allHazardData);
        
        // Clear and re-add filtered markers
        this.hazardLayer.clearLayers();
        this.hazardMarkers.clear();
        
        filteredAlerts.forEach(alert => {
            const marker = this.createHazardMarker(alert);
            this.hazardMarkers.set(alert.id, marker);
            this.hazardLayer.addLayer(marker);
        });
    }

    filterAlerts(alerts) {
        return alerts.filter(alert => {
            const typeMatch = !this.filters.hazardType || alert.hazard_type === this.filters.hazardType;
            const severityMatch = !this.filters.severity || alert.severity === this.filters.severity;
            
            return typeMatch && severityMatch;
        });
    }

    searchLocation(query) {
        // Simple location search - in a real implementation, this would use geocoding
        const locationCoords = {
            'sydney harbour': [-33.8688, 151.2093],
            'botany bay': [-33.9249, 151.2424],
            'circular quay': [-33.8765, 151.2052],
            'bondi beach': [-33.8900, 151.2500],
            'coogee beach': [-33.9100, 151.2300]
        };

        const normalizedQuery = query.toLowerCase();
        const coords = locationCoords[normalizedQuery];
        
        if (coords) {
            this.focusOnLocation(coords[0], coords[1], 14);
            
            // Add a temporary marker
            const searchMarker = L.marker(coords)
                .bindPopup(`<strong>Search Result:</strong><br>${query}`)
                .addTo(this.map)
                .openPopup();
            
            // Remove the search marker after 5 seconds
            setTimeout(() => {
                this.map.removeLayer(searchMarker);
            }, 5000);
        }
    }

    focusOnAlert(alertId) {
        const marker = this.hazardMarkers.get(alertId);
        if (marker) {
            const latLng = marker.getLatLng();
            this.map.setView(latLng, 15);
            marker.openPopup();
        }
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hazardMap = new HazardMap();
});
