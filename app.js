// State Management
let appliances = JSON.parse(localStorage.getItem('energyWatcher_data')) || [];
let kwhRate = localStorage.getItem('energyWatcher_rate') || 0.15;
let myChart = null;

// DOM Elements
const form = document.getElementById('applianceForm');
const list = document.getElementById('applianceList');
const rateInput = document.getElementById('kwhRate');
const totalDisplay = document.getElementById('totalCost');

// Initialize
rateInput.value = kwhRate;

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
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="p-4 border-b font-medium">${item.name}<br><span class="text-xs text-gray-400">${item.wattage}W | ${item.hours}h/day</span></td>
            <td class="p-4 border-b text-center font-bold text-blue-600">$${(monthlyCost / 30).toFixed(2)}</td>
            <td class="p-4 border-b text-right space-x-2">
                <button onclick="editItem(${index})" class="text-blue-500 hover:underline">Edit</button>
                <button onclick="deleteItem(${index})" class="text-red-500 hover:underline">Delete</button>
            </td>
        `;
        list.appendChild(tr);
    });

    totalDisplay.innerText = `Monthly Total: $${grandTotal.toFixed(2)}`;
    updateChart();
};

const updateChart = () => {
    const ctx = document.getElementById('energyChart').getContext('2d');
    const labels = appliances.map(a => a.name);
    const data = appliances.map(a => (a.wattage * a.hours));

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Wh Consumption',
                data: data,
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
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

render();