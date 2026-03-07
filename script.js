// using existing JS code from previous version.

// ---------- AUTH + ROLES ----------
const loginBtn = document.getElementById('loginBtn');
const username = document.getElementById('username');
const password = document.getElementById('password');
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginError = document.getElementById('loginError');
const currentAdminDisplay = document.getElementById('currentAdmin');
const currentRoleDisplay = document.getElementById('currentRole');

const adminPanel = document.getElementById('adminPanel');
const addAdminForm = document.getElementById('addAdminForm');
const adminList = document.getElementById('adminList');

let admins = JSON.parse(localStorage.getItem('kinfleetAdmins')) || [];

function hashPassword(pw) {
    return btoa(pw);
}

// Create default OWNER if none exist
// Ensure Owner always exists
const ownerExists = admins.find(a => a.role === "Owner");

if (!ownerExists) {
    admins.push({
        username: "owner",
        password: hashPassword("owner123"),
        role: "Owner"
    });
    localStorage.setItem('kinfleetAdmins', JSON.stringify(admins));
}

function showDashboard() {
    loginPage.classList.add('hidden');
    dashboard.classList.remove('hidden');

    const user = localStorage.getItem('kinfleetCurrentAdmin');
    const role = localStorage.getItem('kinfleetCurrentRole');

    currentAdminDisplay.textContent = user;
    currentRoleDisplay.textContent = role;

    // Only Owner can see admin panel button
    if (role !== "Owner") {
        adminPanel.classList.add('hidden');
        document.querySelector('[onclick="toggleAdminPanel()"]')?.classList.add('hidden');
    }
}

function showLogin() {
    loginPage.classList.remove('hidden');
    dashboard.classList.add('hidden');
}

loginBtn.onclick = () => {
    const user = username.value.trim();
    const pass = hashPassword(password.value.trim());

    const match = admins.find(a => a.username === user && a.password === pass);

    if (match) {
        localStorage.setItem('kinfleetLoggedIn', 'true');
        localStorage.setItem('kinfleetCurrentAdmin', match.username);
        localStorage.setItem('kinfleetCurrentRole', match.role);
        showDashboard();
        username.value = "";
        password.value = "";
    } else {
        loginError.classList.remove('hidden');
    }
};

function logout() {
    localStorage.removeItem('kinfleetLoggedIn');
    localStorage.removeItem('kinfleetCurrentAdmin');
    localStorage.removeItem('kinfleetCurrentRole');
    showLogin();
}

// Auto login
if (localStorage.getItem('kinfleetLoggedIn') === 'true') {
    showDashboard();
} else {
    showLogin();
}

// ---------- ADMIN MANAGEMENT ----------
function toggleAdminPanel() {
    const role = localStorage.getItem('kinfleetCurrentRole');
    if (role !== "Owner") return;
    adminPanel.classList.toggle('hidden');
    renderAdminList();
}

function renderAdminList() {
    admins = JSON.parse(localStorage.getItem('kinfleetAdmins')) || [];

    adminList.innerHTML = admins.map(a => `
        <li class="flex justify-between border-b py-1">
        <span>${a.username} (${a.role})</span>
        ${
            a.role === "Owner"
            ? '<span class="text-gray-400">Protected</span>'
            : `<span class="text-red-600 cursor-pointer" onclick="deleteAdmin('${a.username}')">✖</span>`
        }
        </li>`
    ).join('');
}

addAdminForm.onsubmit = e => {
    e.preventDefault();

    const role = localStorage.getItem('kinfleetCurrentRole');
    if (role !== "Owner") return;

    const newUser = newAdminUser.value.trim();
    const newPass = hashPassword(newAdminPass.value.trim());

    if (admins.find(a => a.username === newUser)) {
        alert("Username already exists");
        return;
    }

    admins.push({
        username: newUser,
        password: newPass,
        role: "Admin"
    });

    localStorage.setItem('kinfleetAdmins', JSON.stringify(admins));
    e.target.reset();
    renderAdminList();
};

function deleteAdmin(user) {
    const role = localStorage.getItem('kinfleetCurrentRole');
    if (role !== "Owner") return;

    const target = admins.find(a => a.username === user);
    if (!target || target.role === "Owner") return;

    if (!confirm("Delete this admin?")) return;

    admins = admins.filter(a => a.username !== user);
    localStorage.setItem('kinfleetAdmins', JSON.stringify(admins));
    renderAdminList();
}

// ---------- EXISTING DATA SYSTEM ----------
let entries = JSON.parse(localStorage.getItem('entries')) || [];
let maintenance = JSON.parse(localStorage.getItem('maintenance')) || [];

function saveData() {
    localStorage.setItem('entries', JSON.stringify(entries));
    localStorage.setItem('maintenance', JSON.stringify(maintenance));
    renderAll();
}

const entryForm = document.getElementById('entryForm');
const maintenanceForm = document.getElementById('maintenanceForm');
const monthFilter = document.getElementById('monthFilter');
const totalEarnings = document.getElementById('totalEarnings');
const totalMaintenance = document.getElementById('totalMaintenance');
const netProfit = document.getElementById('netProfit');
const leaderboard = document.getElementById('leaderboard');
const dataTable = document.getElementById('dataTable');
const maintenanceTable = document.getElementById('maintenanceTable');

entryForm.onsubmit = e => {
    e.preventDefault();
    entries.push({
      date: date.value,
      driver: driver.value,
      motorId: motorId.value,
      earnings: parseFloat(earnings.value)
    });
    saveData();
    e.target.reset();
};

maintenanceForm.onsubmit = e => {
    e.preventDefault();
    maintenance.push({
      date: mDate.value,
      motorId: mMotorId.value,
      description: mDescription.value,
      cost: parseFloat(mCost.value)
    });
    saveData();
    e.target.reset();
};

monthFilter.onchange = renderAll;

function renderAll() {
    const month = monthFilter.value;
    const eFilt = month ? entries.filter(e => e.date.startsWith(month)) : entries;
    const mFilt = month ? maintenance.filter(e => e.date.startsWith(month)) : maintenance;
    renderTables(eFilt, mFilt);
    updateSummary(eFilt, mFilt);
    updateLeaderboard(eFilt);
    updateChart(eFilt, mFilt);
}

function renderTables(eFilt, mFilt) {
    dataTable.innerHTML = eFilt.map(e =>
      `<tr>
        <td class="p-2">${e.date}</td>
        <td class="p-2">${e.driver}</td>
        <td class="p-2">${e.earnings}</td>
        <td class="p-2 text-center">
          <span class="delete-btn" onclick="deleteEntry(${entries.indexOf(e)})">✖</span>
        </td>
      </tr>`).join('');

    maintenanceTable.innerHTML = mFilt.map(e =>
      `<tr>
        <td class="p-2">${e.date}</td>
        <td class="p-2">${e.motorId}</td>
        <td class="p-2">${e.cost}</td>
        <td class="p-2 text-center">
          <span class="delete-btn" onclick="deleteMaintenance(${maintenance.indexOf(e)})">✖</span>
        </td>
      </tr>`).join('');
}

function deleteEntry(i) {
    if (confirm("Delete this daily log?")) {
      entries.splice(i, 1);
      saveData();
    }
}

function deleteMaintenance(i) {
    if (confirm("Delete this maintenance record?")) {
      maintenance.splice(i, 1);
      saveData();
    }
}

function updateSummary(eFilt, mFilt) {
    const earnings = eFilt.reduce((a, b) => a + b.earnings, 0);
    const costs = mFilt.reduce((a, b) => a + b.cost, 0);

    totalEarnings.textContent = `$${earnings.toLocaleString()}`;
    totalMaintenance.textContent = `$${costs.toLocaleString()}`;
    netProfit.textContent = `$${(earnings - costs).toLocaleString()}`;
}

function updateLeaderboard(eFilt) {
    const byDriver = {};
    eFilt.forEach(e => {
      byDriver[e.driver] = (byDriver[e.driver] || 0) + e.earnings;
    });

    const sorted = Object.entries(byDriver).sort((a, b) => b[1] - a[1]);

    leaderboard.innerHTML = sorted.map(([d, v]) =>
      `<tr>
        <td class="p-2">${d}</td>
        <td class="p-2">${v}</td>
      </tr>`
    ).join('');
}

let chart;

function updateChart(eFilt, mFilt) {
    // Sum earnings by date
    const earningsByDate = {};
    eFilt.forEach(e => earningsByDate[e.date] = (earningsByDate[e.date] || 0) + e.earnings);

    // Sum maintenance cost by date
    const maintenanceByDate = {};
    mFilt.forEach(m => maintenanceByDate[m.date] = (maintenanceByDate[m.date] || 0) + m.cost);

    // Combine all dates
    const allDates = Array.from(new Set([...Object.keys(earningsByDate), ...Object.keys(maintenanceByDate)])).sort();

    // Prepare data arrays
    const earningsData = allDates.map(d => earningsByDate[d] || 0);
    const maintenanceData = allDates.map(d => maintenanceByDate[d] || 0);
    const netProfitData = allDates.map((d,i) => earningsData[i] - maintenanceData[i]);

    // Destroy previous chart if exists
    if(chart) chart.destroy();

    // Create new chart
    chart = new Chart(profitChart.getContext('2d'), {
      type: 'line',
      data: {
        labels: allDates,
        datasets: [
          {
            label: 'Earnings ($)',
            data: earningsData,
            borderColor: '#000',
            borderWidth: 2,
            fill: false,
            tension: 0.3
          },
          {
            label: 'Maintenance ($)',
            data: maintenanceData,
            borderColor: 'red',
            borderWidth: 2,
            fill: false,
            tension: 0.3
          },
          {
            label: 'Net Profit ($)',
            data: netProfitData,
            borderColor: 'green',
            borderWidth: 2,
            fill: false,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // lets CSS height control chart height
        scales: { y: { beginAtZero: true } }
      }
    });
}

function exportExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(entries), "Daily Logs");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(maintenance), "Maintenance Logs");
    XLSX.writeFile(wb, "KinFleet_Data.xlsx");
}

renderAll();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}