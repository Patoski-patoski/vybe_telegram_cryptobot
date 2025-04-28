import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import { registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

export async function createOHLCVChart(ohlcvData: any[]) {
    // Sort data by time in ascending order
    const sortedData = [...ohlcvData].sort((a, b) => a.time - b.time);

    const width = 1000;  // Increased width for better detail
    const height = 600;  // Increased height for better visualization

    const chartCallback = (ChartJS: any) => {
        ChartJS.defaults.color = '#FFFFFF';
        ChartJS.defaults.font.family = 'Roboto, Arial, sans-serif';
        ChartJS.defaults.font.weight = '500';
    };

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width,
        height,
        chartCallback,
        backgroundColour: '#131722'  // Dark theme like TradingView
    });

    // Prepare data for the chart
    // Convert Unix timestamps to formatted date strings
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const labels = sortedData.map(data => formatDate(data.time));
    const closeData = sortedData.map(data => parseFloat(data.close));
    const openData = sortedData.map(data => parseFloat(data.open));
    const highData = sortedData.map(data => parseFloat(data.high));
    const lowData = sortedData.map(data => parseFloat(data.low));
    const volumeData = sortedData.map(data => parseFloat(data.volumeUsd));
    const timestamps = sortedData.map(data => data.time * 1000); // Keep timestamps for reference

    // Calculate price change colors
    const priceChangeColors = sortedData.map((data, i, arr) => {
        if (i === 0) return 'rgba(76, 175, 80, 0.8)';  // Default to green for first point

        const prev = parseFloat(arr[i - 1].close);
        const current = parseFloat(data.close);

        return current >= prev ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 82, 82, 0.8)';
    });

    // Calculate price change percentage for title
    const firstClose = parseFloat(sortedData[0].close);
    const lastClose = parseFloat(sortedData[sortedData.length - 1].close);
    const priceChangePercent = ((lastClose - firstClose) / firstClose) * 100;

    // Calculate date range for title
    const startDate = formatDate(sortedData[0].time);
    const endDate = formatDate(sortedData[sortedData.length - 1].time);

    // Custom candlestick renderer
    const drawCandlestick = (ctx: any, data: any) => {
        data.points.forEach((point: any) => {
            // Draw candlestick body
            const x = point.x;
            const top = Math.min(point.o, point.c);
            const bottom = Math.max(point.o, point.c);
            const width = Math.max(3, point.width * 0.8);  // Min width of 3px

            // Draw high-low line
            ctx.beginPath();
            ctx.strokeStyle = point.color;
            ctx.lineWidth = 1;
            ctx.moveTo(x, point.h);
            ctx.lineTo(x, point.l);
            ctx.stroke();

            // Draw body
            ctx.fillStyle = point.color;
            ctx.fillRect(
                x - width / 2,
                top,
                width,
                Math.max(bottom - top, 1)  // Ensure minimum height of 1px
            );
        });
    };

    const configuration: ChartConfiguration = {
        type: 'line',
        data: {
            labels,
            datasets: [
                // Line chart for closing prices
                {
                    label: 'Close Price',
                    data: closeData,
                    borderColor: '#5383FF',  // Professional blue
                    backgroundColor: 'rgba(83, 131, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,  // Hide points
                    tension: 0.1,
                    fill: true,
                    yAxisID: 'price'
                },
                // Volume bars
                {
                    label: 'Volume',
                    data: volumeData,
                    backgroundColor: priceChangeColors,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    type: 'bar',
                    yAxisID: 'volume'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,  // Disable animation for faster rendering
            interaction: {
                mode: 'index',
                intersect: false,
            },
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        font: {
                            size: 10
                        }
                    }
                },
                price: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function (value) {
                            return '$' + parseFloat(value as string).toFixed(2);
                        },
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: 'Price (USD)',
                        color: '#9CA3AF'
                    }
                },
                volume: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                        drawBorder: false,
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        callback: function (value) {
                            const val = parseFloat(value as string);
                            if (val >= 1000000000) return '$' + (val / 1000000000).toFixed(1) + 'B';
                            if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
                            if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'K';
                            return '$' + val.toFixed(0);
                        },
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: 'Volume (USD)',
                        color: '#9CA3AF'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false  // Hide legend for cleaner look
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 11
                    },
                    callbacks: {
                        title: function (tooltipItems: any) {
                            return labels[tooltipItems[0].dataIndex];
                        },
                        label: function (context: any) {
                            const dataIndex = context.dataIndex;
                            const datasetIndex = context.datasetIndex;
                            if (datasetIndex === 0) {
                                return `Close: $${closeData[dataIndex].toFixed(4)}`;
                            } else if (datasetIndex === 1) {
                                const volume = volumeData[dataIndex];
                                if (volume >= 1000000000) return `Volume: $${(volume / 1000000000).toFixed(2)}B`;
                                if (volume >= 1000000) return `Volume: $${(volume / 1000000).toFixed(2)}M`;
                                if (volume >= 1000) return `Volume: $${(volume / 1000).toFixed(2)}K`;
                                return `Volume: $${volume.toFixed(2)}`;
                            }

                            // Add OHLC data to tooltip
                            const open = openData[dataIndex];
                            const high = highData[dataIndex];
                            const low = lowData[dataIndex];
                            const close = closeData[dataIndex];

                            return [
                                `Open: $${open.toFixed(4)}`,
                                `High: $${high.toFixed(4)}`,
                                `Low: $${low.toFixed(4)}`,
                                `Close: $${close.toFixed(4)}`
                            ];
                        }
                    }
                },
                title: {
                    display: true,
                    text: [
                        `Token Price Chart (${startDate} - ${endDate})`,
                        `${priceChangePercent >= 0 ? '▲' : '▼'} ${Math.abs(priceChangePercent).toFixed(2)}% | Last: $${lastClose.toFixed(4)}`
                    ],
                    color: '#FFFFFF',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                }
            }
        } as ChartOptions
    };

    // Add custom candlestick drawing after main chart drawing
    const plugin = {
        id: 'candlestickOverlay',
        afterDraw: (chart: any) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const priceAxis = chart.scales.price;

            sortedData.forEach((data, i) => {
                const x = xAxis.getPixelForValue(i);
                const open = priceAxis.getPixelForValue(parseFloat(data.open));
                const high = priceAxis.getPixelForValue(parseFloat(data.high));
                const low = priceAxis.getPixelForValue(parseFloat(data.low));
                const close = priceAxis.getPixelForValue(parseFloat(data.close));

                const isUp = parseFloat(data.close) >= parseFloat(data.open);
                const color = isUp ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 82, 82, 0.8)';
                const width = Math.max(3, (chart.chartArea.right - chart.chartArea.left) / labels.length * 0.6);

                // Draw high-low line
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.moveTo(x, high);
                ctx.lineTo(x, low);
                ctx.stroke();

                // Draw body
                ctx.fillStyle = color;
                const top = Math.min(open, close);
                const bottom = Math.max(open, close);

                ctx.fillRect(
                    x - width / 2,
                    top,
                    width,
                    Math.max(bottom - top, 1)  // Ensure minimum height of 1px
                );
            });
        }
    };

    if (!configuration.plugins) {
        configuration.plugins = [plugin];
    } else {
        configuration.plugins.push(plugin);
    }

    // Render chart to buffer
    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    return image;
}