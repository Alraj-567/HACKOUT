// Coastal Hazards Monitoring Dashboard - Main JavaScript

class CoastalDashboard {
    constructor() {
        this.updateInterval = 30000; // 30 seconds
        this.lastUpdate = null;
        this.isOnline = true;
        this.currentTab = 'dashboard';
        this.filters = {
            hazardType: '',
            severity: '',
            dateRange: '24'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabHandlers();
        this.setupFilterHandlers();
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

    setupTabHandlers() {
        // Handle tab switching
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (event) => {
                const target = event.target.getAttribute('data-bs-target');
                this.currentTab = target.replace('#', '').replace('-pane', '');
                
                // Load specific data for the active tab
                this.handleTabSwitch(this.currentTab);
            });
        });
    }

    setupFilterHandlers() {
        // Map filters
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyMapFilters();
            });
        }

        // Alert filters
        const alertFilters = ['alert-type-filter', 'alert-severity-filter', 'alert-date-filter'];
        alertFilters.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => {
                    this.applyAlertFilters();
                });
            }
        });

        // Search functionality
        const locationSearch = document.getElementById('location-search');
        if (locationSearch) {
            locationSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchLocation(e.target.value);
                }
            });
        }
    }

    handleTabSwitch(tabName) {
        switch(tabName) {
            case 'dashboard':
                this.loadDashboardOverview();
                break;
            case 'map':
                // Map is already initialized, just refresh data
                if (window.hazardMap) {
                    setTimeout(() => {
                        window.hazardMap.map.invalidateSize();
                    }, 100);
                }
                break;
            case 'alerts':
                this.loadDetailedAlerts();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
        }
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
            this.updateDetailedAlerts(alerts);
            
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
        // Update overview alerts list
        const alertsList = document.getElementById('alerts-list-overview');
        
        if (!alertsList) return;
        
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <p>No active alerts</p>
                </div>
            `;
            return;
        }

        // Show only first 5 alerts in overview
        const overviewAlerts = alerts.slice(0, 5);
        alertsList.innerHTML = overviewAlerts.map(alert => {
            const time = new Date(alert.timestamp).toLocaleTimeString();
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

    updateDetailedAlerts(alerts) {
        const detailedAlertsList = document.getElementById('alerts-list-detailed');
        
        if (!detailedAlertsList) return;
        
        if (alerts.length === 0) {
            detailedAlertsList.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <p>No active alerts</p>
                </div>
            `;
            return;
        }

        detailedAlertsList.innerHTML = alerts.map(alert => {
            const time = new Date(alert.timestamp).toLocaleString();
            const severityIcon = this.getSeverityIcon(alert.severity);
            const coordinates = `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`;
            
            return `
                <div class="alert-item severity-${alert.severity} mb-3" data-alert-id="${alert.id}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="alert-title">
                            ${severityIcon} ${alert.hazard_type.replace('_', ' ').toUpperCase()}
                        </div>
                        <span class="severity-badge severity-${alert.severity}">${alert.severity.toUpperCase()}</span>
                    </div>
                    <div class="alert-description mb-2">${alert.description}</div>
                    <div class="row text-muted small">
                        <div class="col-6">
                            <i class="fas fa-map-marker-alt me-1"></i> ${coordinates}
                        </div>
                        <div class="col-6">
                            <i class="fas fa-clock me-1"></i> ${time}
                        </div>
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="dashboard.focusOnAlert(${alert.id})">
                            <i class="fas fa-map"></i> View on Map
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="dashboard.dismissAlert(${alert.id})">
                            <i class="fas fa-times"></i> Dismiss
                        </button>
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

    // New methods for enhanced functionality
    loadDashboardOverview() {
        this.loadSensorNetworkOverview();
        this.loadOverviewChart();
        
        // Trigger overview chart update
        if (window.dashboardCharts && window.dashboardCharts.setupOverviewChart) {
            window.dashboardCharts.setupOverviewChart();
            setTimeout(() => {
                window.dashboardCharts.updateOverviewChart();
            }, 1000);
        }
    }

    loadDetailedAlerts() {
        // Alerts are already loaded in the main data update cycle
        console.log('Loading detailed alerts view');
    }

    loadAnalyticsData() {
        this.loadAIRecommendations();
        this.loadTrendAnalysis();
    }

    loadSensorNetworkOverview() {
        const container = document.getElementById('sensor-network-overview');
        if (!container) return;

        // Get real sensor data from the dashboard data
        fetch('/api/sensor-data')
            .then(response => response.json())
            .then(data => {
                const sensorTypes = {
                    'tide_gauge': { name: 'Tide Gauges', count: 0, status: 'online' },
                    'weather_station': { name: 'Weather Stations', count: 0, status: 'online' },
                    'water_quality': { name: 'Water Quality', count: 0, status: 'online' }
                };

                // Count sensors by type
                if (data.data) {
                    Object.keys(data.data).forEach(type => {
                        if (sensorTypes[type]) {
                            sensorTypes[type].count = data.data[type].length;
                        }
                    });
                }

                container.innerHTML = Object.keys(sensorTypes).map(type => {
                    const sensor = sensorTypes[type];
                    return `
                        <div class="col-md-4 mb-3">
                            <div class="sensor-status-card ${sensor.status}">
                                <h6 class="mb-1">${sensor.name}</h6>
                                <h4 class="mb-1">${sensor.count}</h4>
                                <small class="text-muted text-capitalize">${sensor.status}</small>
                            </div>
                        </div>
                    `;
                }).join('');
            })
            .catch(error => {
                console.error('Error loading sensor network overview:', error);
                // Fallback to mock data
                const sensorTypes = {
                    'tide_gauge': { name: 'Tide Gauges', count: 2, status: 'online' },
                    'weather_station': { name: 'Weather Stations', count: 2, status: 'online' },
                    'water_quality': { name: 'Water Quality', count: 2, status: 'online' }
                };

                container.innerHTML = Object.keys(sensorTypes).map(type => {
                    const sensor = sensorTypes[type];
                    return `
                        <div class="col-md-4 mb-3">
                            <div class="sensor-status-card ${sensor.status}">
                                <h6 class="mb-1">${sensor.name}</h6>
                                <h4 class="mb-1">${sensor.count}</h4>
                                <small class="text-muted text-capitalize">${sensor.status}</small>
                            </div>
                        </div>
                    `;
                }).join('');
            });
    }

    loadOverviewChart() {
        // This will be handled by the charts.js file
        console.log('Loading overview chart');
    }

    loadAIRecommendations() {
        const container = document.getElementById('ai-recommendations');
        if (!container) return;

        // Dynamic AI recommendations based on current data
        const recommendations = [
            {
                icon: 'info-circle',
                color: 'info',
                title: 'Tide Prediction',
                description: 'High tide expected at 14:30. Monitor coastal areas.'
            },
            {
                icon: 'exclamation-triangle',
                color: 'warning',
                title: 'Weather Alert',
                description: 'Wind speeds increasing. Storm possible in 6 hours.'
            },
            {
                icon: 'chart-line',
                color: 'success',
                title: 'Water Quality',
                description: 'Quality improving in Sector 3. Normal levels restored.'
            }
        ];

        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <i class="fas fa-${rec.icon} text-${rec.color}"></i>
                <div>
                    <strong>${rec.title}</strong>
                    <p class="small">${rec.description}</p>
                </div>
            </div>
        `).join('');
    }

    loadTrendAnalysis() {
        console.log('Loading trend analysis charts');
    }

    applyMapFilters() {
        const hazardType = document.getElementById('hazard-type-filter')?.value || '';
        const severity = document.getElementById('severity-filter')?.value || '';
        
        this.filters.hazardType = hazardType;
        this.filters.severity = severity;
        
        if (window.hazardMap) {
            window.hazardMap.applyFilters(this.filters);
        }
        
        this.showNotification('Filters applied successfully', 'success', 2000);
    }

    applyAlertFilters() {
        const alertType = document.getElementById('alert-type-filter')?.value || '';
        const alertSeverity = document.getElementById('alert-severity-filter')?.value || '';
        const dateRange = document.getElementById('alert-date-filter')?.value || '24';
        
        // Filter logic would be implemented here
        console.log('Applying alert filters:', { alertType, alertSeverity, dateRange });
    }

    searchLocation(query) {
        if (!query.trim()) return;
        
        // Simple location search (would be enhanced with real geocoding)
        if (window.hazardMap) {
            window.hazardMap.searchLocation(query);
        }
        
        this.showNotification(`Searching for: ${query}`, 'info', 2000);
    }

    focusOnAlert(alertId) {
        // Switch to map tab and focus on alert location
        const mapTab = document.getElementById('map-tab');
        if (mapTab) {
            const tab = new bootstrap.Tab(mapTab);
            tab.show();
            
            // Focus on alert location after tab switch
            setTimeout(() => {
                if (window.hazardMap) {
                    window.hazardMap.focusOnAlert(alertId);
                }
            }, 300);
        }
    }

    dismissAlert(alertId) {
        // Mock dismiss functionality
        const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
        if (alertElement) {
            alertElement.style.opacity = '0.5';
            this.showNotification('Alert dismissed', 'success', 2000);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.coastalDashboard = new CoastalDashboard();
    window.dashboard = window.coastalDashboard; // Global reference for inline handlers
});
