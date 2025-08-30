// Coastal Hazards Dashboard Charts

class DashboardCharts {
    constructor() {
        this.charts = {};
        this.chartColors = {
            primary: '#3498db',
            success: '#27ae60',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#17a2b8',
            purple: '#9b59b6'
        };
        
        this.init();
    }

    init() {
        this.setupCharts();
        this.startDataUpdates();
    }

    setupCharts() {
        this.createTideChart();
        this.createWaterQualityChart();
        this.createWeatherChart();
    }

    startDataUpdates() {
        // Update charts every 30 seconds
        setInterval(() => {
            this.updateAllCharts();
        }, 30000);

        // Initial data load
        setTimeout(() => {
            this.updateAllCharts();
        }, 1000);
    }

    async updateAllCharts() {
        try {
            await Promise.all([
                this.updateTideChart(),
                this.updateWaterQualityChart(),
                this.updateWeatherChart()
            ]);
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    createTideChart() {
        const ctx = document.getElementById('tide-chart');
        if (!ctx) return;

        this.charts.tide = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Tide Level (m)',
                    data: [],
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.hexToRgba(this.chartColors.primary, 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: '#666'
                        },
                        title: {
                            display: true,
                            text: 'Height (m)',
                            color: '#666'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createWaterQualityChart() {
        const ctx = document.getElementById('water-quality-chart');
        if (!ctx) return;

        this.charts.waterQuality = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Water Quality Index',
                    data: [],
                    borderColor: this.chartColors.success,
                    backgroundColor: this.hexToRgba(this.chartColors.success, 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.success,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.success,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: '#666'
                        },
                        title: {
                            display: true,
                            text: 'Quality Index',
                            color: '#666'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createWeatherChart() {
        const ctx = document.getElementById('weather-chart');
        if (!ctx) return;

        this.charts.weather = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Wind Speed (km/h)',
                    data: [],
                    borderColor: this.chartColors.danger,
                    backgroundColor: this.hexToRgba(this.chartColors.danger, 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.danger,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.danger,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    y: {
                        min: 0,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: '#666'
                        },
                        title: {
                            display: true,
                            text: 'Speed (km/h)',
                            color: '#666'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    async updateTideChart() {
        try {
            const response = await fetch('/api/chart-data/tide_levels');
            const data = await response.json();
            
            if (this.charts.tide && data.labels && data.datasets) {
                this.charts.tide.data.labels = data.labels;
                this.charts.tide.data.datasets[0].data = data.datasets[0].data;
                this.charts.tide.update('none');
            }
        } catch (error) {
            console.error('Error updating tide chart:', error);
        }
    }

    async updateWaterQualityChart() {
        try {
            const response = await fetch('/api/chart-data/water_quality');
            const data = await response.json();
            
            if (this.charts.waterQuality && data.labels && data.datasets) {
                this.charts.waterQuality.data.labels = data.labels;
                this.charts.waterQuality.data.datasets[0].data = data.datasets[0].data;
                
                // Color code based on quality levels
                const coloredData = data.datasets[0].data.map(value => {
                    if (value < 30) return this.chartColors.danger;
                    if (value < 50) return this.chartColors.warning;
                    if (value < 70) return this.chartColors.info;
                    return this.chartColors.success;
                });
                
                this.charts.waterQuality.data.datasets[0].pointBackgroundColor = coloredData;
                this.charts.waterQuality.update('none');
            }
        } catch (error) {
            console.error('Error updating water quality chart:', error);
        }
    }

    async updateWeatherChart() {
        try {
            const response = await fetch('/api/chart-data/weather');
            const data = await response.json();
            
            if (this.charts.weather && data.labels && data.datasets) {
                this.charts.weather.data.labels = data.labels;
                this.charts.weather.data.datasets[0].data = data.datasets[0].data;
                
                // Color code based on wind speed levels
                const coloredData = data.datasets[0].data.map(value => {
                    if (value > 50) return this.chartColors.danger;
                    if (value > 30) return this.chartColors.warning;
                    if (value > 15) return this.chartColors.info;
                    return this.chartColors.success;
                });
                
                this.charts.weather.data.datasets[0].pointBackgroundColor = coloredData;
                this.charts.weather.update('none');
            }
        } catch (error) {
            console.error('Error updating weather chart:', error);
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Method to add real-time data point
    addDataPoint(chartName, label, value) {
        if (!this.charts[chartName]) return;
        
        const chart = this.charts[chartName];
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(value);
        
        // Keep only last 20 data points
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        
        chart.update('none');
    }

    // Method to highlight anomalies on charts
    highlightAnomaly(chartName, index) {
        if (!this.charts[chartName]) return;
        
        const chart = this.charts[chartName];
        if (chart.data.datasets[0].pointBackgroundColor) {
            chart.data.datasets[0].pointBackgroundColor[index] = this.chartColors.danger;
        } else {
            chart.data.datasets[0].pointBackgroundColor = Array(chart.data.labels.length).fill(chart.data.datasets[0].borderColor);
            chart.data.datasets[0].pointBackgroundColor[index] = this.chartColors.danger;
        }
        
        chart.update('none');
    }
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCharts = new DashboardCharts();
});
