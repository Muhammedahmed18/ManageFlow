import React, { useEffect, useRef } from 'react';

const ChartComponent = ({
  type = 'line',
  data = {},
  options = {},
  height = 300,
  width = '100%',
  className = ''
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Dynamically import Chart.js to avoid SSR issues
    const loadChart = async () => {
      try {
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);

        if (chartRef.current) {
          // Destroy existing chart if it exists
          if (chartInstance.current) {
            chartInstance.current.destroy();
          }

          const ctx = chartRef.current.getContext('2d');
          
          // Default options
          const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
              },
            },
            scales: {
              x: {
                display: true,
                grid: {
                  display: false,
                },
              },
              y: {
                display: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)',
                },
                beginAtZero: true,
              },
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false,
            },
          };

          // Merge default options with custom options
          const mergedOptions = {
            ...defaultOptions,
            ...options,
            plugins: {
              ...defaultOptions.plugins,
              ...options.plugins,
            },
            scales: {
              ...defaultOptions.scales,
              ...options.scales,
            },
          };

          chartInstance.current = new Chart(ctx, {
            type,
            data,
            options: mergedOptions,
          });
        }
      } catch (error) {
        console.error('Error loading Chart.js:', error);
      }
    };

    loadChart();

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [type, data, options]);

  // Update chart when data changes
  useEffect(() => {
    if (chartInstance.current && data) {
      chartInstance.current.data = data;
      chartInstance.current.update();
    }
  }, [data]);

  return (
    <div className={`chart-container ${className}`} style={{ width, height }}>
      <canvas ref={chartRef} />
    </div>
  );
};

// Predefined chart configurations
export const chartConfigs = {
  // Line chart for trends
  lineChart: (data, title = '') => ({
    type: 'line',
    data: {
      labels: data.labels || [],
      datasets: data.datasets || [],
    },
    options: {
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            },
          },
        },
      },
    },
  }),

  // Bar chart for comparisons
  barChart: (data, title = '') => ({
    type: 'bar',
    data: {
      labels: data.labels || [],
      datasets: data.datasets || [],
    },
    options: {
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  }),

  // Doughnut chart for proportions
  doughnutChart: (data, title = '') => ({
    type: 'doughnut',
    data: {
      labels: data.labels || [],
      datasets: [{
        data: data.values || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        legend: {
          position: 'bottom',
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  }),

  // Pie chart for distributions
  pieChart: (data, title = '') => ({
    type: 'pie',
    data: {
      labels: data.labels || [],
      datasets: [{
        data: data.values || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        legend: {
          position: 'right',
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  }),

  // Area chart for cumulative data
  areaChart: (data, title = '') => ({
    type: 'line',
    data: {
      labels: data.labels || [],
      datasets: data.datasets.map(dataset => ({
        ...dataset,
        fill: true,
        backgroundColor: dataset.backgroundColor + '20',
        borderColor: dataset.backgroundColor,
        borderWidth: 2,
      })) || [],
    },
    options: {
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  }),
};

// Helper function to create dataset
export const createDataset = (label, data, color = '#36A2EB', type = 'line') => ({
  label,
  data,
  borderColor: color,
  backgroundColor: color,
  borderWidth: 2,
  fill: false,
  tension: 0.4,
  pointRadius: 4,
  pointHoverRadius: 6,
});

// Helper function to format currency
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Helper function to format percentage
export const formatPercentage = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

export default ChartComponent;

