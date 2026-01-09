// State Management
let appliances = JSON.parse(localStorage.getItem('energyWatcher_data')) || [];
let kwhRate = localStorage.getItem('energyWatcher_rate') || 0.15;
let isDark = localStorage.getItem('energyWatcher_theme') === 'dark';
let myChart = null;

// DOM Elements
const form = document.getElementById('applianceForm');
const list = document.getElementById('applianceList');
const rateInput = document.getElementById('kwhRate');
const totalDisplay = document.getElementById('totalCost');

// Initialize
rateInput.value = kwhRate;

// Theme Logic
const toggleBtn = document.createElement('button');
toggleBtn.onclick = () => {
    isDark = !isDark;
    applyTheme();
};
document.body.appendChild(toggleBtn);

const applyTheme = () => {
    const html = document.documentElement;

    if (isDark) {
        html.classList.add('dark');
        document.body.classList.add('bg-gray-900', 'text-gray-100');
        document.body.classList.remove('bg-white', 'text-gray-800');
        toggleBtn.innerHTML = '☀️';
        toggleBtn.className = "fixed top-4 right-4 p-3 rounded-full shadow-lg transition-transform hover:scale-110 z-50 bg-gray-800 text-yellow-400 border border-gray-700";
    } else {
        html.classList.remove('dark');
        document.body.classList.add('bg-white', 'text-gray-800');
        document.body.classList.remove('bg-gray-900', 'text-gray-100');
        toggleBtn.innerHTML = '🌙';
        toggleBtn.className = "fixed top-4 right-4 p-3 rounded-full shadow-lg transition-transform hover:scale-110 z-50 bg-white text-gray-800";
    }
    localStorage.setItem('energyWatcher_theme', isDark ? 'dark' : 'light');
    if (myChart) updateChart();
};
applyTheme();

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
    let grandTotal = 0;

    appliances.forEach((item, index) => {
        const monthlyCost = calculateMonthlyCost(item.wattage, item.hours);
        grandTotal += monthlyCost;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 dark:hover:bg-gray-800 transition duration-200 fade-in group border-b dark:border-gray-700";
        tr.innerHTML = `
            <td class="p-4">
                <div class="font-semibold text-gray-800 dark:text-gray-200">${item.name}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${item.wattage}W | ${item.hours}h/day</div>
            </td>
            <td class="p-4 text-center">
                <div class="font-bold text-blue-600 dark:text-blue-400">$${(monthlyCost / 30).toFixed(2)}</div>
                <div class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Daily</div>
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

    totalDisplay.innerHTML = `Monthly Total: <span class="text-2xl font-bold text-gray-800 dark:text-white">$${grandTotal.toFixed(2)}</span>`;
    updateChart();
};

const updateChart = () => {
    const ctx = document.getElementById('energyChart').getContext('2d');
    const labels = appliances.map(a => a.name);
    const data = appliances.map(a => (a.wattage * a.hours));
    const textColor = isDark ? '#e5e7eb' : '#374151';

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
    save();
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

list.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { action, index } = btn.dataset;
    if (action === 'edit') editItem(parseInt(index));
    if (action === 'delete') deleteItem(parseInt(index));
});

render();