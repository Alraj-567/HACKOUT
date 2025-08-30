// Coastal Hazards Monitoring Dashboard - Main JavaScript

class CoastalDashboard {
    constructor() {
        this.updateInterval = 30000; // 30 seconds
        this.lastUpdate = null;
        this.isOnline = true;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startDataUpdates();
        this.updateLastUpdateTime();
        
        // Initial data load
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadDashboardData();
            }
        });

        // Handle network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('Connection restored', 'success');
            this.loadDashboardData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('Connection lost', 'warning');
        });
    }

    startDataUpdates() {
        // Update data every 30 seconds
        setInterval(() => {
            if (this.isOnline && !document.hidden) {
                this.loadDashboardData();
            }
        }, this.updateInterval);

        // Update time display every second
        setInterval(() => {
            this.updateLastUpdateTime();
        }, 1000);
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadDashboardStats(),
                this.loadSensorData(),
                this.loadHazardAlerts(),
                this.loadAnomalyDetection()
            ]);
            
            this.lastUpdate = new Date();
            console.log('Dashboard data updated successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading data', 'danger');
        }
    }

    async loadDashboardStats() {
        try {
            const response = await fetch('/api/dashboard-stats');
            const stats = await response.json();
            
            document.getElementById('total-sensors').textContent = stats.total_sensors;
            document.getElementById('active-alerts').textContent = stats.active_alerts;
            document.getElementById('recent-anomalies').textContent = stats.recent_anomalies;
            document.getElementById('system-status').textContent = stats.system_status.toUpperCase();
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    async loadSensorData() {
        try {
            const response = await fetch('/api/sensor-data');
            const sensorData = await response.json();
            
            this.updateSensorTable(sensorData);
            
            // Update map with sensor locations
            if (window.hazardMap) {
                window.hazardMap.updateSensorData(sensorData);
            }
        } catch (error) {
            console.error('Error loading sensor data:', error);
        }
    }

    async loadHazardAlerts() {
        try {
            const response = await fetch('/api/hazard-alerts');
            const alerts = await response.json();
            
            this.updateAlertsPanel(alerts);
            
            // Update map with alerts
            if (window.hazardMap) {
                window.hazardMap.updateHazardAlerts(alerts);
            }
            
            // Show notifications for new critical alerts
            this.checkForNewCriticalAlerts(alerts);
        } catch (error) {
            console.error('Error loading hazard alerts:', error);
        }
    }

    async loadAnomalyDetection() {
        try {
            const response = await fetch('/api/anomaly-detection');
            const anomalies = await response.json();
            
            // Process anomaly data for display
            this.processAnomalies(anomalies);
        } catch (error) {
            console.error('Error loading anomaly detection data:', error);
        }
    }

    updateSensorTable(sensorData) {
        const tableBody = document.getElementById('sensor-data-table');
        
        if (sensorData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No sensor data available
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = sensorData.map(sensor => {
            const status = this.getSensorStatus(sensor);
            const time = new Date(sensor.timestamp).toLocaleTimeString();
            const location = `${sensor.latitude.toFixed(4)}, ${sensor.longitude.toFixed(4)}`;
            
            return `
                <tr>
                    <td><strong>${sensor.sensor_id}</strong></td>
                    <td>
                        <span class="badge bg-info">${sensor.sensor_type.replace('_', ' ').toUpperCase()}</span>
                    </td>
                    <td><small>${location}</small></td>
                    <td><strong>${sensor.value}</strong></td>
                    <td>${sensor.unit}</td>
                    <td>
                        <span class="sensor-status ${status.class}">${status.text}</span>
                    </td>
                    <td><small>${time}</small></td>
                </tr>
            `;
        }).join('');
    }

    getSensorStatus(sensor) {
        // Simple status logic based on sensor type and value
        if (sensor.sensor_type === 'tide_gauge') {
            if (sensor.value > 2.5 || sensor.value < -0.5) {
                return { class: 'anomaly', text: 'ANOMALY' };
            }
        } else if (sensor.sensor_type === 'weather_station') {
            if (sensor.value > 50) {
                return { class: 'anomaly', text: 'HIGH WIND' };
            }
        } else if (sensor.sensor_type === 'water_quality') {
            if (sensor.value < 50) {
                return { class: 'anomaly', text: 'POOR QUALITY' };
            }
        }
        
        return { class: 'online', text: 'NORMAL' };
    }

    updateAlertsPanel(alerts) {
        const alertsList = document.getElementById('alerts-list');
        
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <p>No active alerts</p>
                </div>
            `;
            return;
        }

        alertsList.innerHTML = alerts.map(alert => {
            const time = new Date(alert.timestamp).toLocaleString();
            const severityIcon = this.getSeverityIcon(alert.severity);
            
            return `
                <div class="alert-item severity-${alert.severity}" data-alert-id="${alert.id}">
                    <div class="alert-title">
                        ${severityIcon} ${alert.hazard_type.replace('_', ' ')}
                        <span class="severity-badge severity-${alert.severity}">${alert.severity}</span>
                    </div>
                    <div class="alert-description">${alert.description}</div>
                    <div class="alert-time">
                        <i class="fas fa-clock"></i> ${time}
                    </div>
                </div>
            `;
        }).join('');
    }

    getSeverityIcon(severity) {
        const icons = {
            'low': '<i class="fas fa-info-circle" style="color: #27ae60;"></i>',
            'medium': '<i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i>',
            'high': '<i class="fas fa-exclamation-circle" style="color: #e67e22;"></i>',
            'critical': '<i class="fas fa-skull-crossbones" style="color: #e74c3c;"></i>'
        };
        return icons[severity] || icons['low'];
    }

    processAnomalies(anomalies) {
        // Count anomalies by type for potential dashboard display
        const anomalyCounts = anomalies.reduce((counts, anomaly) => {
            if (anomaly.is_anomaly) {
                counts[anomaly.sensor_type] = (counts[anomaly.sensor_type] || 0) + 1;
            }
            return counts;
        }, {});

        console.log('Anomaly counts:', anomalyCounts);
        
        // Highlight sensors with anomalies in the table
        anomalies.forEach(anomaly => {
            if (anomaly.is_anomaly) {
                this.highlightAnomalySensor(anomaly.sensor_id);
            }
        });
    }

    highlightAnomalySensor(sensorId) {
        // Add visual highlighting to anomalous sensors
        const sensorRows = document.querySelectorAll('#sensor-data-table tr');
        sensorRows.forEach(row => {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell && firstCell.textContent.trim() === sensorId) {
                row.classList.add('table-warning');
            }
        });
    }

    checkForNewCriticalAlerts(alerts) {
        const criticalAlerts = alerts.filter(alert => 
            alert.severity === 'critical' && 
            new Date(alert.timestamp) > (this.lastUpdate || new Date(0))
        );

        criticalAlerts.forEach(alert => {
            this.showNotification(
                `CRITICAL: ${alert.hazard_type.replace('_', ' ')} detected`,
                'danger',
                5000
            );
        });
    }

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('alert-container');
        const alertId = 'alert-' + Date.now();
        
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-notification alert-dismissible fade show" role="alert">
                <i class="fas fa-${this.getNotificationIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto dismiss after duration
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const bsAlert = new bootstrap.Alert(alertElement);
                bsAlert.close();
            }
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    updateLastUpdateTime() {
        const updateTimeElement = document.getElementById('update-time');
        if (this.lastUpdate) {
            const now = new Date();
            const diffSeconds = Math.floor((now - this.lastUpdate) / 1000);
            
            if (diffSeconds < 60) {
                updateTimeElement.textContent = `${diffSeconds}s ago`;
            } else {
                updateTimeElement.textContent = this.lastUpdate.toLocaleTimeString();
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.coastalDashboard = new CoastalDashboard();
});
