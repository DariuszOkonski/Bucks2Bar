// ============================================
// DATA MANAGEMENT
// ============================================

const STORAGE_KEY = 'bucks2bar_data';
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Load data from localStorage or initialize with default values
function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with empty data
  const data = {};
  MONTHS.forEach((month) => {
    data[month.toLowerCase()] = { income: 0, expense: 0 };
  });
  return data;
}

// Save data to localStorage
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Update a specific month's data
function updateMonth(month, income, expense) {
  const data = loadData();
  const monthKey = month.toLowerCase();
  data[monthKey] = {
    income: parseFloat(income) || 0,
    expense: parseFloat(expense) || 0,
  };
  saveData(data);
  return data;
}

// Get data for a specific month
function getMonthData(month) {
  const data = loadData();
  return data[month.toLowerCase()] || { income: 0, expense: 0 };
}

// ============================================
// UI RENDERING
// ============================================

// Format number as USD currency
function formatUSD(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Render the month input grid in the Data tab
function renderMonthsGrid() {
  const container = document.getElementById('monthsContainer');
  const data = loadData();

  container.innerHTML = '';

  MONTHS.forEach((month) => {
    const monthKey = month.toLowerCase();
    const monthData = data[monthKey];
    const income = monthData.income;
    const expense = monthData.expense;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: 500;">${month}</td>
      <td>
        <div class="input-group input-group-sm" style="max-width: 150px;">
          <span class="input-group-text">$</span>
          <input
            type="number"
            class="form-control income-input"
            data-month="${monthKey}"
            value="${income}"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
      </td>
      <td>
        <div class="input-group input-group-sm" style="max-width: 150px;">
          <span class="input-group-text">$</span>
          <input
            type="number"
            class="form-control expense-input"
            data-month="${monthKey}"
            value="${expense}"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
      </td>
    `;
    container.appendChild(row);
  });

  attachInputListeners();
}

// Attach event listeners to input fields
function attachInputListeners() {
  document
    .querySelectorAll('.income-input, .expense-input')
    .forEach((input) => {
      input.addEventListener('change', handleInputChange);
    });
}

// Handle input change event
function handleInputChange(e) {
  const input = e.target;
  const month = input.dataset.month;
  const isIncome = input.classList.contains('income-input');

  const data = loadData();
  const monthData = data[month];

  if (isIncome) {
    monthData.income = parseFloat(input.value) || 0;
  } else {
    monthData.expense = parseFloat(input.value) || 0;
  }

  saveData(data);
  updateChart();
}

// ============================================
// CHART RENDERING
// ============================================

let chartInstance = null;

// Initialize and render the bar chart
function initChart() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error(
      'Chart.js library not loaded. Please check your internet connection.',
    );
    return;
  }

  const ctx = document.getElementById('expenseChart').getContext('2d');
  const data = loadData();

  const incomeData = MONTHS.map((month) => data[month.toLowerCase()].income);
  const expenseData = MONTHS.map((month) => data[month.toLowerCase()].expense);

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#28a745',
          borderColor: '#218838',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: '#dc3545',
          borderColor: '#bd2130',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Monthly Income vs Expenses',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + ': ' + formatUSD(context.parsed.y);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatUSD(value);
            },
          },
          title: {
            display: true,
            text: 'Amount (USD)',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Month',
          },
        },
      },
    },
  });
}

// Update chart when data changes
function updateChart() {
  if (chartInstance) {
    const data = loadData();
    const incomeData = MONTHS.map((month) => data[month.toLowerCase()].income);
    const expenseData = MONTHS.map(
      (month) => data[month.toLowerCase()].expense,
    );

    chartInstance.data.datasets[0].data = incomeData;
    chartInstance.data.datasets[1].data = expenseData;
    chartInstance.update();
  }
}

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('load', function () {
  // Render the months grid on Data tab
  renderMonthsGrid();

  // Initialize chart on Chart tab click
  document.getElementById('chart-tab').addEventListener('click', function () {
    if (!chartInstance) {
      initChart();
    }
  });
});
