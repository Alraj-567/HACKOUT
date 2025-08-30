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

    setupOverviewChart() {
        const ctx = document.getElementById('overview-chart');
        if (!ctx) return;

        this.charts.overview = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Tide Level (m)',
                        data: [],
                        borderColor: this.chartColors.primary,
                        backgroundColor: this.hexToRgba(this.chartColors.primary, 0.1),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Water Quality',
                        data: [],
                        borderColor: this.chartColors.success,
                        backgroundColor: this.hexToRgba(this.chartColors.success, 0.1),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Wind Speed (km/h)',
                        data: [],
                        borderColor: this.chartColors.danger,
                        backgroundColor: this.hexToRgba(this.chartColors.danger, 0.1),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Tide Level (m)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Water Quality Index'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        position: 'right'
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    setupAnalyticsCharts() {
        this.setupTrendChart();
        this.setupAnomalyChart();
    }

    setupTrendChart() {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        this.charts.trend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Tide', 'Weather', 'Water Quality'],
                datasets: [{
                    label: 'Trend Score',
                    data: [75, 60, 85],
                    backgroundColor: [
                        this.hexToRgba(this.chartColors.primary, 0.6),
                        this.hexToRgba(this.chartColors.danger, 0.6),
                        this.hexToRgba(this.chartColors.success, 0.6)
                    ],
                    borderColor: [
                        this.chartColors.primary,
                        this.chartColors.danger,
                        this.chartColors.success
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Trend Score (%)'
                        }
                    }
                }
            }
        });
    }

    setupAnomalyChart() {
        const ctx = document.getElementById('anomaly-chart');
        if (!ctx) return;

        this.charts.anomaly = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Anomalies'],
                datasets: [{
                    data: [85, 15],
                    backgroundColor: [
                        this.chartColors.success,
                        this.chartColors.danger
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    startDataUpdates() {
        // Update charts every 30 seconds
        setInterval(() => {
            this.updateAllCharts();
        }, 30000);

        // Initial data load
        setTimeout(() => {
            this.updateAllCharts();
            this.setupOverviewChart();
            this.setupAnalyticsCharts();
        }, 1000);
    }

    async updateAllCharts() {
        try {
            await Promise.all([
                this.updateTideChart(),
                this.updateWaterQualityChart(),
                this.updateWeatherChart(),
                this.updateOverviewChart()
            ]);
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    async updateOverviewChart() {
        if (!this.charts.overview) return;

        try {
            const [tideData, qualityData, weatherData] = await Promise.all([
                fetch('/api/chart-data/tide_levels').then(r => r.json()),
                fetch('/api/chart-data/water_quality').then(r => r.json()),
                fetch('/api/chart-data/weather').then(r => r.json())
            ]);

            // Use tide data for time labels
            this.charts.overview.data.labels = tideData.labels || [];
            
            // Update datasets
            if (tideData.datasets && tideData.datasets[0]) {
                this.charts.overview.data.datasets[0].data = tideData.datasets[0].data;
            }
            
            if (qualityData.datasets && qualityData.datasets[0]) {
                this.charts.overview.data.datasets[1].data = qualityData.datasets[0].data;
            }
            
            if (weatherData.datasets && weatherData.datasets[0]) {
                this.charts.overview.data.datasets[2].data = weatherData.datasets[0].data;
            }

            this.charts.overview.update('none');
        } catch (error) {
            console.error('Error updating overview chart:', error);
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

    // Method to update analytics data
    updateAnalyticsCharts() {
        // Update trend chart with random data for demo
        if (this.charts.trend) {
            this.charts.trend.data.datasets[0].data = [
                Math.floor(Math.random() * 40) + 60,
                Math.floor(Math.random() * 40) + 40,
                Math.floor(Math.random() * 40) + 70
            ];
            this.charts.trend.update('none');
        }

        // Update anomaly chart
        if (this.charts.anomaly) {
            const normal = Math.floor(Math.random() * 20) + 80;
            const anomaly = 100 - normal;
            this.charts.anomaly.data.datasets[0].data = [normal, anomaly];
            this.charts.anomaly.update('none');
        }
    }

    // Fix chart data replacement to prevent growth
    async updateChartDataSafely(chart, response_promise, dataIndex = 0) {
        try {
            const data = await response_promise;
            if (chart && data && data.datasets && data.datasets[dataIndex]) {
                // Completely replace the data arrays to prevent growth
                chart.data.labels = data.labels ? data.labels.slice(-20) : [];
                chart.data.datasets[dataIndex].data = data.datasets[dataIndex].data ? data.datasets[dataIndex].data.slice(-20) : [];
                chart.update('none');
            }
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCharts = new DashboardCharts();
    
    // Update analytics charts periodically
    setInterval(() => {
        if (window.dashboardCharts) {
            window.dashboardCharts.updateAnalyticsCharts();
        }
    }, 45000); // Every 45 seconds for variety
});
