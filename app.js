// State Management
let appliances = JSON.parse(localStorage.getItem('energyWatcher_data')) || [];
let kwhRate = localStorage.getItem('energyWatcher_rate') || 0.15;
let isDark = localStorage.getItem('energyWatcher_theme') === 'dark';
let sortOrder = 'original';
let costPeriod = 'monthly';
let budgetLimit = parseFloat(localStorage.getItem('energyWatcher_budget')) || 0;
let myChart = null;

// DOM Elements
const form = document.getElementById('applianceForm');
const list = document.getElementById('applianceList');
const rateInput = document.getElementById('kwhRate');
const totalDisplay = document.getElementById('totalCost');
const co2Display = document.getElementById('co2Display');
const presetSelect = document.getElementById('presetSelect');
const budgetInput = document.getElementById('budgetInput');
const tipDisplay = document.getElementById('energyTip');

// New static elements
const toggleBtn = document.getElementById('themeToggle');
const sortBtn = document.getElementById('sortBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const periodBtn = document.getElementById('periodBtn');

// Initialize
rateInput.value = kwhRate;
if (budgetLimit > 0) budgetInput.value = budgetLimit;

// Theme Logic
toggleBtn.onclick = () => {
    isDark = !isDark;
    applyTheme();
};
// document.body.appendChild(toggleBtn); // REMOVED

const applyTheme = () => {
    const html = document.documentElement;

    if (isDark) {
        html.classList.add('dark');
        document.body.classList.add('bg-gray-900');
        document.body.classList.remove('bg-white');
        toggleBtn.innerHTML = '☀️';
        toggleBtn.className = "fixed top-4 right-4 p-3 rounded-full shadow-lg transition-transform hover:scale-110 z-50 bg-gray-800 text-yellow-400 border border-gray-700";
    } else {
        html.classList.remove('dark');
        document.body.classList.add('bg-white');
        document.body.classList.remove('bg-gray-900');
        toggleBtn.innerHTML = '🌙';
        toggleBtn.className = "fixed top-4 right-4 p-3 rounded-full shadow-lg transition-transform hover:scale-110 z-50 bg-white text-gray-800";
    }
    localStorage.setItem('energyWatcher_theme', isDark ? 'dark' : 'light');
    if (myChart) updateChart();
};
applyTheme();

// Sort Logic
// sortBtn created in HTML
sortBtn.onclick = () => {
    if (sortOrder === 'original') {
        sortOrder = 'desc';
        sortBtn.innerText = "Sort: High to Low";
    } else if (sortOrder === 'desc') {
        sortOrder = 'asc';
        sortBtn.innerText = "Sort: Low to High";
    } else {
        sortOrder = 'original';
        sortBtn.innerText = "Sort: Default";
    }
    render();
};

// Export Logic
// exportBtn created in HTML
exportBtn.onclick = () => {
    if (appliances.length === 0) {
        alert("No data to export!");
        return;
    }

    const headers = ["Name,Wattage (W),Hours/Day,Weekly Cost ($),Monthly Cost ($)"];
    const rows = appliances.map(item => {
        const monthlyCost = calculateMonthlyCost(item.wattage, item.hours);
        const weeklyCost = (monthlyCost / 30) * 7;
        const name = `"${item.name.replace(/"/g, '""')}"`;
        return `${name},${item.wattage},${item.hours},${weeklyCost.toFixed(2)},${monthlyCost.toFixed(2)}`;
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "energy_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Clear All Logic
// clearBtn created in HTML
clearBtn.onclick = () => {
    if (appliances.length === 0) return;

    if (confirm("Are you sure you want to delete all appliances?")) {
        appliances = [];
        save();
    }
};

// Period Toggle Logic
// periodBtn created in HTML
periodBtn.onclick = () => {
    if (costPeriod === 'monthly') {
        costPeriod = 'weekly';
        periodBtn.innerText = "Switch to Monthly";
    } else {
        costPeriod = 'monthly';
        periodBtn.innerText = "Switch to Weekly";
    }
    render();
};

// Insertion logic removed as elements are static

const save = () => {
    localStorage.setItem('energyWatcher_data', JSON.stringify(appliances));
    localStorage.setItem('energyWatcher_rate', kwhRate);
    render();
};

const calculateMonthlyCost = (wattage, hours) => {
    // Formula: (W / 1000) * hours * 30 days * rate
    return (wattage / 1000) * hours * 30 * kwhRate;
};

const render = () => {
    list.innerHTML = '';
    let totalDailyCost = 0;

    // Create a mapped array to preserve original indices for editing/deleting
    let displayItems = appliances.map((item, index) => ({ ...item, originalIndex: index }));

    if (sortOrder === 'desc') {
        displayItems.sort((a, b) => (b.wattage * b.hours) - (a.wattage * a.hours));
    } else if (sortOrder === 'asc') {
        displayItems.sort((a, b) => (a.wattage * a.hours) - (b.wattage * b.hours));
    }

    displayItems.forEach((item) => {
        const index = item.originalIndex; // Use original index for actions
        const monthlyCost = calculateMonthlyCost(item.wattage, item.hours);
        totalDailyCost += (monthlyCost / 30);

        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 dark:hover:bg-gray-800 transition duration-200 fade-in group border-b dark:border-gray-700";
        tr.innerHTML = `
            <td class="p-4">
                <div class="font-semibold text-gray-800">${item.name}</div>
                <div class="text-xs text-gray-500 mt-1">${item.wattage}W | ${item.hours}h/day</div>
            </td>
            <td class="p-4 text-center">
                <div class="font-bold text-blue-600">$${(monthlyCost / 30).toFixed(2)}</div>
                <div class="text-[10px] text-gray-400 uppercase tracking-wider">Daily</div>
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-action="edit" data-index="${index}" class="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition" title="Edit">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button data-action="delete" data-index="${index}" class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition" title="Delete">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });

    let finalTotal = 0;
    let label = "";

    if (costPeriod === 'monthly') {
        finalTotal = totalDailyCost * 30;
        label = "Monthly Total";
    } else {
        finalTotal = totalDailyCost * 7;
        label = "Weekly Total";
    }

    let costColor = "text-blue-600";
    // Only warn for monthly budget if in monthly view, or convert appropriately. 
    // For simplicity, we just check against the displayed total if it's the tracked period.
    // If budget is set and total > budget, warn.
    if (budgetLimit > 0 && finalTotal > budgetLimit && costPeriod === 'monthly') {
        costColor = "text-red-500";
    }

    totalDisplay.innerHTML = `${label}: <span class="text-2xl font-bold ${costColor}">$${finalTotal.toFixed(2)}</span>`;

    // CO2 Calculation (Approx 0.4 kg per kWh)
    const totalDailyKWh = appliances.reduce((acc, item) => acc + (item.wattage * item.hours / 1000), 0);
    const monthlyCO2 = totalDailyKWh * 30 * 0.4;
    co2Display.innerHTML = `🌱 Est. CO2: ${monthlyCO2.toFixed(1)} kg/mo`;

    updateChart();
    updateTips();
};

const updateTips = () => {
    if (appliances.length === 0) {
        tipDisplay.innerText = "Add appliances to generate personalized saving tips!";
        return;
    }

    // Find highest consumer
    const highest = appliances.reduce((prev, current) => {
        return (prev.wattage * prev.hours) > (current.wattage * current.hours) ? prev : current;
    });

    const consumption = highest.wattage * highest.hours; // Wh per day

    if (consumption > 2000) {
        tipDisplay.innerText = `Your ${highest.name} uses a lot of energy! Consider upgrading to a more efficient model or reducing usage time.`;
    } else if (highest.hours > 8) {
        tipDisplay.innerText = `Your ${highest.name} is on for long periods. Ensure it has an 'Eco' mode enabled if available.`;
    } else if (highest.name.toLowerCase().includes('cond') || highest.name.toLowerCase().includes('ac')) {
        tipDisplay.innerText = "For Air Conditioners, every degree higher in summer can save ~6% energy!";
    } else if (highest.name.toLowerCase().includes('fridge')) {
        tipDisplay.innerText = "Keep your Fridge full! Empty space wastes more energy to cool down air when opened.";
    } else {
        const genericTips = [
            "Unplug electronics when not in use to stop 'vampire' energy drain.",
            "LED bulbs use 75% less energy than incandescent lighting.",
            "Using cold water for laundry can save significant heating costs.",
            "Natural light is free! Open curtains instead of using lamps during the day."
        ];
        tipDisplay.innerText = genericTips[Math.floor(Math.random() * genericTips.length)];
    }
};

const updateChart = () => {
    const ctx = document.getElementById('energyChart').getContext('2d');
    const labels = appliances.map(a => a.name);
    const data = appliances.map(a => (a.wattage * a.hours));
    const textColor = '#374151';

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Wh Consumption',
                data: data,
                backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor }
                }
            }
        }
    });
};

// Handlers
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const editIndex = parseInt(document.getElementById('editIndex').value);
    const newItem = {
        name: document.getElementById('name').value,
        wattage: parseFloat(document.getElementById('wattage').value),
        hours: parseFloat(document.getElementById('hours').value)
    };

    if (isNaN(newItem.wattage) || newItem.wattage <= 0 || isNaN(newItem.hours) || newItem.hours <= 0) {
        alert('Please enter valid positive numbers for Wattage and Hours.');
        return;
    }

    if (newItem.hours > 24) {
        alert('Daily usage cannot exceed 24 hours.');
        return;
    }

    if (editIndex > -1) {
        appliances[editIndex] = newItem;
    } else {
        appliances.push(newItem);
    }

    form.reset();
    document.getElementById('editIndex').value = "-1";
    document.getElementById('submitBtn').innerText = "Add Appliance";
    presetSelect.value = ""; // Reset preset
    save();
});

presetSelect.addEventListener('change', (e) => {
    const option = e.target.selectedOptions[0];
    if (option.value === "") return;

    const name = option.dataset.name;
    const watts = option.dataset.watts;

    document.getElementById('name').value = name;
    document.getElementById('wattage').value = watts;
});

const deleteItem = (i) => {
    appliances.splice(i, 1);
    save();
};

const editItem = (i) => {
    const item = appliances[i];
    document.getElementById('name').value = item.name;
    document.getElementById('wattage').value = item.wattage;
    document.getElementById('hours').value = item.hours;
    document.getElementById('editIndex').value = i;
    document.getElementById('submitBtn').innerText = "Update Appliance";
};

rateInput.addEventListener('input', (e) => {
    kwhRate = parseFloat(e.target.value) || 0;
    save();
});

budgetInput.addEventListener('input', (e) => {
    budgetLimit = parseFloat(e.target.value) || 0;
    localStorage.setItem('energyWatcher_budget', budgetLimit);
    render();
});

list.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { action, index } = btn.dataset;
    if (action === 'edit') editItem(parseInt(index));
    if (action === 'delete') deleteItem(parseInt(index));
});

render();