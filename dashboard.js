// =================================================================
// NEW: SUPABASE & AUTHENTICATION SETUP
// =================================================================
const SUPABASE_URL = 'https://clcqdjmfkkvqzxcjbvdm.supabase.co';
// !!! IMPORTANT: PASTE YOUR 'anon public' KEY FROM YOUR SUPABASE PROJECT HERE !!!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsY3Fkam1ma2t2cXp4Y2pidmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTY4MDEsImV4cCI6MjA3MDM5MjgwMX0.C57KA-Ck1YPckr49pH3hfH4fJ5bNzklkINaeseGOFAE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- In-Memory Data Storage (loaded from Supabase) ---
let transactions = [], expenses = [], debtors = [], creditors = [], transfers = [];
let banks = []; // This will now be an array of bank name strings
let categories = [];
let cashStatements = [];
let bankStatements = {};
let balances = { cash: 0, bank: 0 };
let realtimeChannel;
let trendChart, bankPieChart;

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const dashboardWrapper = document.getElementById('dashboard-wrapper');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logoutBtn');
// All other DOM element selectors from your original file are kept below in their original context

// =================================================================
// NEW: AUTH & DATA LOADING LOGIC
// =================================================================

// --- Login/Logout & Session Handling ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('auth-error').textContent = '';
    const { data, error } = await supabase.auth.signInWithPassword({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    });
    if (error) document.getElementById('auth-error').textContent = error.message;
});

logoutBtn.addEventListener('click', async () => {
    try {
        await supabase.auth.signOut();
    } catch (err) {
        console.error('Error during logout:', err);
    } finally {
        // Fallback UI switch in case the auth event is delayed
        if (dashboardWrapper) dashboardWrapper.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
    }
});

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        dashboardWrapper.style.display = 'none';
        authContainer.style.display = 'flex';
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session.user) initializeDashboard(session.user);
    }
});

async function initializeDashboard(user) {
    document.getElementById('welcome-message').textContent = `Welcome, ${user.email}`;
    authContainer.style.display = 'none';
    dashboardWrapper.style.display = 'block';
    try {
        const allData = await apiCall('fetchAll');
        transactions = allData.transactions || [];
        expenses = allData.expenses || [];
        debtors = allData.debtors || [];
        creditors = allData.creditors || [];
        transfers = allData.transfers || [];
        banks = ['Bank (Generic)'].concat((allData.banks || []).map(b => b.name));

        init(); // Call your original init function
        setupRealtimeListeners();
    } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        alert("Could not load your data. Please check the Vercel logs for a specific error message.");
    }
}

// --- API Helper ---
async function apiCall(action, payload) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session.");
    const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action, payload })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }
    return response.json();
}

// --- Real-time Setup ---
function setupRealtimeListeners() {
    // This function can be expanded later to handle live data updates without refreshing.
}


// =================================================================
// YOUR ORIGINAL CODE - MODIFIED TO WORK WITH SUPABASE
// =================================================================

// NOTE: The PIN login function is removed as it's replaced by Supabase login.
// NOTE: All 'localStorage.setItem' and 'localStorage.getItem' calls are removed.

// DOM elements
const tabs = { home: document.getElementById('tabHome'), main: document.getElementById('tabMain'), expenses: document.getElementById('tabExpenses'), debtors: document.getElementById('tabDebtors'), creditors: document.getElementById('tabCreditors'), account: document.getElementById('tabAccount'), cash: document.getElementById('tabCash'), transfers: document.getElementById('tabTransfers'), export: document.getElementById('tabExport') };
const tabContents = { home: document.getElementById('tabHomeContent'), main: document.getElementById('tabMainContent'), expenses: document.getElementById('tabExpensesContent'), debtors: document.getElementById('tabDebtorsContent'), creditors: document.getElementById('tabCreditorsContent'), account: document.getElementById('tabAccountContent'), cash: document.getElementById('tabCashContent'), transfers: document.getElementById('tabTransfersContent'), export: document.getElementById('tabExportContent') };
const stats = { income: document.getElementById('totalIncome'), expenses: document.getElementById('totalExpenses'), profit: document.getElementById('netProfit'), cash: document.getElementById('cashBalance'), bank: document.getElementById('bankBalance') };
const tables = { transactionsBody: document.getElementById('transactionsBody'), expensesBody: document.getElementById('expensesBody'), debtorsBody: document.getElementById('debtorsBody'), creditorsBody: document.getElementById('creditorsBody'), cashStatementBody: document.getElementById('cashStatementBody'), transfersBody: document.getElementById('transfersBody') };
const filters = { category: document.getElementById('filterCategory'), categoryList: document.getElementById('categoryList') };
const modals = { transaction: document.getElementById('transactionFormModal'), expense: document.getElementById('expenseFormModal'), debtor: document.getElementById('debtorFormModal'), creditor: document.getElementById('creditorFormModal'), transfer: document.getElementById('transferFormModal'), receipt: document.getElementById('receiptModal'), banks: document.getElementById('banksModal'), settle: document.getElementById('settleModal') };
const buttons = { addExpense: document.getElementById('addExpenseBtn'), addDebtor: document.getElementById('addDebtorBtn'), addCreditor: document.getElementById('addCreditorBtn'), addTransfer: document.getElementById('addTransferBtn'), quickAddTrans: document.getElementById('quickAddTransBtn'), quickAddExpense: document.getElementById('quickAddExpenseBtn'), quickAddDebtor: document.getElementById('quickAddDebtorBtn'), quickAddCreditor: document.getElementById('quickAddCreditorBtn'), quickAddTransfer: document.getElementById('quickAddTransferBtn'), reset: document.getElementById('resetAllBtn'), printReceipt: document.getElementById('printReceiptBtn'), closeReceipt: document.getElementById('closeReceiptBtn'), manageBanks: document.getElementById('manageBanksBtn'), addBank: document.getElementById('addBankBtn'), deleteTransaction: document.getElementById('deleteTransactionBtn') };
const forms = { transaction: document.getElementById('transactionForm'), expense: document.getElementById('expenseForm'), debtor: document.getElementById('debtorForm'), creditor: document.getElementById('creditorForm'), transfer: document.getElementById('transferForm'), settle: document.getElementById('settleForm') };
const exportBtns = { transactions: document.getElementById('exportMainBtn'), expenses: document.getElementById('exportExpensesBtn'), debtors: document.getElementById('exportDebtorsBtn'), creditors: document.getElementById('exportCreditorsBtn'), account: document.getElementById('exportAccountBtn'), cash: document.getElementById('exportCashBtn'), transfers: document.getElementById('exportTransfersBtn') };
let bankStatementFilter = { from: null, to: null };

// --- Tab Navigation ---
function openTab(tabName) {
    Object.values(tabContents).forEach(content => content.classList.remove('active'));
    Object.values(tabs).forEach(tab => tab.classList.remove('active'));
    tabContents[tabName].classList.add('active');
    tabs[tabName].classList.add('active');
}
Object.entries(tabs).forEach(([name, tab]) => {
    tab.addEventListener('click', () => openTab(name));
});

// --- Modals ---
function showModal(modalName) {
    if (modals[modalName]) modals[modalName].style.display = 'flex';
}
document.querySelectorAll('.modal .close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
            if (modal.id === 'transactionFormModal') resetTransactionForm();
        }
    });
});

// --- Open Form Modals (Add buttons) ---
const addTransactionBtn = document.getElementById('addTransactionBtn');
if (addTransactionBtn) {
    addTransactionBtn.addEventListener('click', () => {
        resetTransactionForm();
        ensureDefaultSplitRows();
        showModal('transaction');
    });
}

buttons.quickAddTrans && buttons.quickAddTrans.addEventListener('click', () => {
    resetTransactionForm();
    ensureDefaultSplitRows();
    showModal('transaction');
});

buttons.addExpense && buttons.addExpense.addEventListener('click', () => showModal('expense'));
buttons.addDebtor && buttons.addDebtor.addEventListener('click', () => showModal('debtor'));
buttons.addCreditor && buttons.addCreditor.addEventListener('click', () => showModal('creditor'));
buttons.addTransfer && buttons.addTransfer.addEventListener('click', () => showModal('transfer'));

buttons.quickAddExpense && buttons.quickAddExpense.addEventListener('click', () => showModal('expense'));
buttons.quickAddDebtor && buttons.quickAddDebtor.addEventListener('click', () => showModal('debtor'));
buttons.quickAddCreditor && buttons.quickAddCreditor.addEventListener('click', () => showModal('creditor'));
buttons.quickAddTransfer && buttons.quickAddTransfer.addEventListener('click', () => showModal('transfer'));

// --- Update Payment/Bank Type Options ---
function updatePaymentTypeOptions() {
    const bankOpts = banks.filter(b => b !== 'Cash' && b !== 'Bank (Generic)').map(b => `<option value="${b}">${b}</option>`).join('');
    const allOpts = `<option value="Cash">Cash</option>${bankOpts}`;
    document.querySelectorAll('.transInType, .transOutType, .expensePaymentType, .debtorPaymentType, .creditorPaymentType, #transferFrom, #transferTo, #settlePaymentType').forEach(select => {
        if (select) select.innerHTML = allOpts;
    });
}

// --- Split Payment Row ---
function setupSplitPaymentButtons() { /* Your original function here */ }
function setupRemoveSplitButtons() { /* Your original function here */ }

// --- Banks Management ---
async function renderBanksList() {
    const bankListElem = document.getElementById('banksList');
    if (!bankListElem) return;
    const currentBanks = (await apiCall('fetchAll')).banks.map(b => b.name);
    bankListElem.innerHTML = currentBanks.filter(b => b !== 'Cash').map(b => `<div>${b}</div>`).join('');
}

buttons.manageBanks.addEventListener('click', () => {
    renderBanksList();
    showModal('banks');
});
buttons.addBank.addEventListener('click', async () => {
    const bankName = document.getElementById('newBankName').value.trim();
    if (!bankName) return;
    if (!banks.includes(bankName)) {
        await apiCall('addOrUpdate', { table: 'banks', data: { name: bankName } });
        banks.push(bankName);
        updatePaymentTypeOptions();
        renderBanksList();
        document.getElementById('newBankName').value = '';
        alert(`Added bank: ${bankName}`);
        makeStatements();
    } else {
        alert(`${bankName} already exists!`);
    }
});


// ... PASTE ALL YOUR ORIGINAL FUNCTIONS HERE ...
// (`renderCategoryFilter`, `renderTransactions`, `renderExpenses`, `renderDebtors`, etc.)
// Make the necessary modifications as shown in the examples below:


// EXAMPLE MODIFICATION for renderTransactions
function renderTransactions() {
    tables.transactionsBody.innerHTML = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(tx => {
            let inTotal = tx.in_payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            let inTypes = tx.in_payments?.map(p => p.type).join(', ') || 'N/A';
            let outTotal = tx.out_payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            let outTypes = tx.out_payments?.map(p => p.type).join(', ') || 'N/A';
            let profit = inTotal - outTotal;
            return `
                <tr>
                    <td>${new Date(tx.date).toLocaleString()}</td>
                    <td>${tx.name}</td>
                    <td>${tx.phone || ''}</td>
                    <td>${tx.description}</td>
                    <td>₹${inTotal.toFixed(2)}</td>
                    <td>${inTypes}</td>
                    <td>₹${outTotal.toFixed(2)}</td>
                    <td>${outTypes}</td>
                    <td>₹${profit.toFixed(2)}</td>
                    <td class="status-${tx.status?.toLowerCase() || 'pending'}">${tx.status || 'Pending'}</td>
                    <td><button class="receipt-btn" data-id="${tx.id}"><i class="fas fa-receipt"></i></button></td>
                    <td><button class="edit-btn" data-id="${tx.id}"><i class="fas fa-pencil-alt"></i></button></td>
                    <td>${tx.notes || '-'}</td>
                </tr>`;
        }).join('');
    // You'll need to re-attach event listeners here or use event delegation
}

// EXAMPLE MODIFICATION for saving a new expense
if (forms.expense) {
    forms.expense.addEventListener('submit', async function (e) {
        e.preventDefault();
        const split = Array.from(document.querySelectorAll('#expensePayContainer .split-payment-row')).map(r => ({
            amount: parseFloat(r.querySelector('.expenseAmount').value) || 0,
            type: r.querySelector('.expensePaymentType').value
        })).filter(p => p.amount > 0);
        const total = split.reduce((s, p) => s + p.amount, 0);
        const ex = {
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            item: document.getElementById('expenseItem').value,
            amount: total,
            payment_type: split.map(p => p.type).join(', '),
            split_payments: split
        };
        // ADDED: Use apiCall to save expense to Supabase
        await apiCall('addOrUpdate', { table: 'expenses', data: ex });
        // Optimistically update UI or wait for real-time update
        expenses.unshift(ex);
        renderExpenses();
        makeStatements();
        this.reset();
        modals.expense.style.display = 'none';
    });
}

// ADDED: forms.debtor.addEventListener with Supabase integration
if (forms.debtor) {
    forms.debtor.addEventListener('submit', async function (e) {
        e.preventDefault();
        const split = Array.from(document.querySelectorAll('#debtorPayContainer .split-payment-row')).map(r => ({
            amount: parseFloat(r.querySelector('.debtorAmount').value) || 0,
            type: r.querySelector('.debtorPaymentType').value
        })).filter(p => p.amount > 0);
        const total = split.reduce((s, p) => s + p.amount, 0);
        const d = {
            date: document.getElementById('debtorDate').value,
            name: document.getElementById('debtorName').value,
            phone: document.getElementById('debtorPhone').value,
            amount: total,
            payment_type: split.map(p => p.type).join(', '),
            split_payments: split,
            description: document.getElementById('debtorDesc').value,
            status: 'Pending'
        };
        try {
            await apiCall('addOrUpdate', { table: 'debtors', data: d });
            debtors.unshift(d);
            renderDebtors();
            makeStatements();
            this.reset();
            modals.debtor.style.display = 'none';
        } catch (error) {
            console.error("Error saving debtor:", error);
            alert('Failed to save debtor. Please check the console.');
        }
    });
}

// ADDED: forms.creditor.addEventListener with Supabase integration
if (forms.creditor) {
    forms.creditor.addEventListener('submit', async function (e) {
        e.preventDefault();
        const split = Array.from(document.querySelectorAll('#creditorPayContainer .split-payment-row')).map(r => ({
            amount: parseFloat(r.querySelector('.creditorAmount').value) || 0,
            type: r.querySelector('.creditorPaymentType').value
        })).filter(p => p.amount > 0);
        const total = split.reduce((s, p) => s + p.amount, 0);
        const c = {
            date: document.getElementById('creditorDate').value,
            name: document.getElementById('creditorName').value,
            phone: document.getElementById('creditorPhone').value,
            amount: total,
            payment_type: split.map(p => p.type).join(', '),
            split_payments: split,
            description: document.getElementById('creditorDesc').value,
            status: 'Pending'
        };
        try {
            await apiCall('addOrUpdate', { table: 'creditors', data: c });
            creditors.unshift(c);
            renderCreditors();
            makeStatements();
            this.reset();
            modals.creditor.style.display = 'none';
        } catch (error) {
            console.error("Error saving creditor:", error);
            alert('Failed to save creditor. Please check the console.');
        }
    });
}

// ADDED: forms.transfer.addEventListener with Supabase integration
if (forms.transfer) {
    forms.transfer.addEventListener('submit', async function (e) {
        e.preventDefault();
        const t = {
            date: document.getElementById('transferDate').value,
            from: document.getElementById('transferFrom').value,
            to: document.getElementById('transferTo').value,
            amount: parseFloat(document.getElementById('transferAmount').value) || 0,
            description: document.getElementById('transferDesc').value
        };
        try {
            await apiCall('addOrUpdate', { table: 'transfers', data: t });
            transfers.unshift(t);
            renderTransfers();
            makeStatements();
            this.reset();
            modals.transfer.style.display = 'none';
        } catch (error) {
            console.error("Error saving transfer:", error);
            alert('Failed to save transfer. Please check the console.');
        }
    });
}

// You will need to apply similar changes to all other functions that save or edit data.
// Replace `localStorage.setItem` with `apiCall`.
// Replace `data-index` with `data-id`.

// Your original init function, now called by the new logic
function init() {
    updatePaymentTypeOptions();
    // Your original rendering calls
    renderCategoryFilter();
    renderTransactions();
    renderExpenses();
    renderDebtors();
    renderCreditors();
    renderTransfers();
    makeStatements();
    setupEventListeners();
    bindReceiptControls();
    // Your original event listener setups
    // Add these lines inside the init() function
    document.getElementById('chartPeriod').addEventListener('change', updateTrendChart);
    document.getElementById('chartDataType').addEventListener('change', updateTrendChart);
}

// =================================================================
// ADDED: Minimal implementations for missing functions
// =================================================================

function updateTrendChart() {
    const period = parseInt(document.getElementById('chartPeriod').value) || 30;
    const dataType = document.getElementById('chartDataType').value || 'profit';
    const ctx = document.getElementById('trendChart').getContext('2d');

    // Prepare data
    const labels = [];
    const dataPoints = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = period - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));

        let dayTotal = 0;
        // This is a simplified calculation. You can make it more detailed.
        if (dataType === 'income') {
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    dayTotal += (tx.in_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                }
            });
        } else if (dataType === 'expense') {
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    dayTotal += Number(ex.amount);
                }
            });
        }
        dataPoints.push(dayTotal);
    }

    // Destroy the old chart if it exists
    if (trendChart) {
        trendChart.destroy();
    }

    // Create the new chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: dataType.charAt(0).toUpperCase() + dataType.slice(1),
                data: dataPoints,
                borderColor: 'rgb(0, 150, 136)',
                backgroundColor: 'rgba(0, 150, 136, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateBankPieChart() {
    const ctx = document.getElementById('bankPieChart').getContext('2d');
    const bankBalances = {};

    // Calculate balances from transactions
    transactions.forEach(tx => {
        (tx.in_payments || []).forEach(p => {
            if (p.type !== 'Cash') {
                bankBalances[p.type] = (bankBalances[p.type] || 0) + Number(p.amount);
            }
        });
        (tx.out_payments || []).forEach(p => {
            if (p.type !== 'Cash') {
                bankBalances[p.type] = (bankBalances[p.type] || 0) - Number(p.amount);
            }
        });
    });

    // Subtract expenses paid from banks (supports split payments)
    expenses.forEach(ex => {
        const splits = Array.isArray(ex.split_payments) ? ex.split_payments : null;
        if (splits && splits.length) {
            splits.forEach(p => {
                if ((p.type || '').toLowerCase() !== 'cash') {
                    bankBalances[p.type] = (bankBalances[p.type] || 0) - Number(p.amount || 0);
                }
            });
        } else if ((ex.payment_type || '').toLowerCase() !== 'cash') {
            bankBalances[ex.payment_type] = (bankBalances[ex.payment_type] || 0) - Number(ex.amount || 0);
        }
    });

    const labels = Object.keys(bankBalances);
    const data = Object.values(bankBalances);

    if (bankPieChart) {
        bankPieChart.destroy();
    }

    bankPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bank Balance',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}
function renderCategoryFilter() {
    const categorySelect = filters.category;
    if (!categorySelect) return;
    const uniqueCategories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean))).sort();
    const optionsHtml = ['<option value="">All</option>'].concat(uniqueCategories.map(c => `<option value="${c}">${c}</option>`)).join('');
    categorySelect.innerHTML = optionsHtml;
    categorySelect.onchange = () => renderExpenses();
}

function renderExpenses() {
    if (!tables.expensesBody) return;
    const selectedCategory = filters.category ? filters.category.value : '';
    const filteredExpenses = expenses
        .filter(ex => !selectedCategory || ex.category === selectedCategory)
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0));

    tables.expensesBody.innerHTML = filteredExpenses.map(ex => {
        const amount = Number(ex.amount) || 0;
        const dateStr = ex.date ? new Date(ex.date).toLocaleDateString() : '';
        return `
            <tr>
                <td>${dateStr}</td>
                <td>${ex.category || ''}</td>
                <td>${ex.item || ''}</td>
                <td>₹${amount.toFixed(2)}</td>
                <td>${ex.payment_type || ''}</td>
                <td><button class="receipt-btn" data-type="expense" data-id="${ex.id}"><i class="fas fa-receipt"></i></button></td>
                <td>—</td>
            </tr>`;
    }).join('');
    // ADDED: Event listener for expense receipt buttons
    document.querySelectorAll('#expensesBody .receipt-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const expenseId = this.getAttribute('data-id');
            const expense = expenses.find(e => e.id === expenseId);
            if (expense) {
                showReceipt('expense', expense);
            }
        });
    });
}

function renderDebtors() {
    const body = document.getElementById('debtorsBody');
    if (!body) return;
    const rowsHtml = (debtors || [])
        .slice()
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
        .map((d, index) => {
            const amount = Number(d.amount) || 0;
            const dateStr = d.date ? new Date(d.date).toLocaleDateString() : '';
            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${d.name || ''}</td>
                    <td>${d.phone || ''}</td>
                    <td>₹${amount.toFixed(2)}</td>
                    <td>${d.payment_type || ''}</td>
                    <td>${d.description || ''}</td>
                    <td>${d.status || 'Pending'}</td>
                    <td><button class="settle-btn" data-type="debtor" data-id="${d.id}" ${d.status === 'Settled' ? 'disabled' : ''}>${d.status === 'Settled' ? 'Settled' : 'Settle'}</button></td>
                </tr>`;
        }).join('');
    body.innerHTML = rowsHtml;
    // ADDED: Event listener for debtor settle buttons
    document.querySelectorAll('#debtorsBody .settle-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const debtorId = this.getAttribute('data-id');
            const debtor = debtors.find(d => d.id === debtorId);
            if (debtor) {
                openSettleModal('debtor', debtorId); // Pass type and ID
            }
        });
    });
}

function renderCreditors() {
    const body = document.getElementById('creditorsBody');
    if (!body) return;
    const rowsHtml = (creditors || [])
        .slice()
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
        .map((c, index) => {
            const amount = Number(c.amount) || 0;
            const dateStr = c.date ? new Date(c.date).toLocaleDateString() : '';
            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${c.name || ''}</td>
                    <td>${c.phone || ''}</td>
                    <td>₹${amount.toFixed(2)}</td>
                    <td>${c.payment_type || ''}</td>
                    <td>${c.description || ''}</td>
                    <td>${c.status || 'Pending'}</td>
                    <td><button class="settle-btn" data-type="creditor" data-id="${c.id}" ${c.status === 'Settled' ? 'disabled' : ''}>${c.status === 'Settled' ? 'Settled' : 'Settle'}</button></td>
                </tr>`;
        }).join('');
    body.innerHTML = rowsHtml;
    // ADDED: Event listener for creditor settle buttons
    document.querySelectorAll('#creditorsBody .settle-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const creditorId = this.getAttribute('data-id');
            const creditor = creditors.find(c => c.id === creditorId);
            if (creditor) {
                openSettleModal('creditor', creditorId);
            }
        });
    });
}

function renderTransfers() {
    if (!tables.transfersBody) return;
    const rowsHtml = (transfers || [])
        .slice()
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
        .map(t => {
            const amount = Number(t.amount) || 0;
            const dateStr = t.date ? new Date(t.date).toLocaleDateString() : '';
            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${t.from || ''}</td>
                    <td>${t.to || ''}</td>
                    <td>₹${amount.toFixed(2)}</td>
                    <td>${t.description || ''}</td>
                    <td>—</td>
                </tr>`;
        }).join('');
    tables.transfersBody.innerHTML = rowsHtml;
}

// Add this entire function to your dashboard.js file
forms.transaction.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log("Step 1: 'Save Transaction' button clicked.");

    const editingId = this.dataset.editingId;

    // Gather data from the form's input fields
    const inPayments = Array.from(document.querySelectorAll('#transInContainer .split-payment-row')).map(row => ({
        amount: parseFloat(row.querySelector('.transInAmount').value) || 0,
        type: row.querySelector('.transInType').value
    })).filter(p => p.amount > 0);

    const outPayments = Array.from(document.querySelectorAll('#transOutContainer .split-payment-row')).map(row => ({
        amount: parseFloat(row.querySelector('.transOutAmount').value) || 0,
        type: row.querySelector('.transOutType').value
    })).filter(p => p.amount > 0);

    const txData = {
        date: document.getElementById('transDate').value,
        name: document.getElementById('transName').value,
        phone: document.getElementById('transPhone').value,
        description: document.getElementById('transDesc').value,
        status: document.getElementById('transStatus').value,
        notes: document.getElementById('transNotes').value,
        in_payments: inPayments,
        out_payments: outPayments
    };

    console.log("Step 2: Data gathered from form:", txData);

    if (editingId) {
        txData.id = editingId;
    }

    try {
        console.log("Step 3: Sending data to the server...");
        const savedTx = await apiCall('addOrUpdate', { table: 'transactions', data: txData });
        console.log("Step 4: Server responded successfully! Saved data:", savedTx);

        // Update the local data array
        if (editingId) {
            const index = transactions.findIndex(t => t.id === editingId);
            if (index !== -1) transactions[index] = savedTx;
        } else {
            transactions.unshift(savedTx);
        }

        renderTransactions();
        makeStatements();
        modals.transaction.style.display = 'none';
        console.log("Step 5: UI updated successfully.");

    } catch (error) {
        console.error("Step 6: ERROR! The save operation failed.", error);
        alert('Failed to save transaction. Please check the console for a detailed red error message.');
    }
});


function editTransaction(txId) {
    const transaction = transactions.find(t => t.id === txId);
    if (!transaction) {
        alert('Transaction not found!');
        return;
    }

    // Populate the form with the transaction's data
    document.getElementById('transDate').value = new Date(transaction.date).toISOString().slice(0, 16);
    document.getElementById('transName').value = transaction.name;
    document.getElementById('transPhone').value = transaction.phone || '';
    document.getElementById('transDesc').value = transaction.description;
    document.getElementById('transStatus').value = transaction.status;
    document.getElementById('transNotes').value = transaction.notes || '';

    // Store the ID for saving later
    forms.transaction.dataset.editingId = txId;

    // Change modal title and show delete button
    document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
    buttons.deleteTransaction.style.display = 'block';

    // Populate split payment rows
    const inContainer = document.getElementById('transInContainer');
    inContainer.innerHTML = ''; // Clear previous rows
    (transaction.in_payments && transaction.in_payments.length > 0 ? transaction.in_payments : [{ amount: 0, type: 'Cash' }]).forEach(p => {
        const row = createSplitRow('in');
        row.querySelector('.transInAmount').value = p.amount;
        row.querySelector('.transInType').value = p.type;
        inContainer.appendChild(row);
    });

    const outContainer = document.getElementById('transOutContainer');
    outContainer.innerHTML = ''; // Clear previous rows
    (transaction.out_payments && transaction.out_payments.length > 0 ? transaction.out_payments : [{ amount: 0, type: 'Cash' }]).forEach(p => {
        const row = createSplitRow('out');
        row.querySelector('.transOutAmount').value = p.amount;
        row.querySelector('.transOutType').value = p.type;
        outContainer.appendChild(row);
    });

    showModal('transaction');
}

// ADDED: Delete Transaction Logic with Supabase
buttons.deleteTransaction.addEventListener('click', async function () {
    const txId = forms.transaction.dataset.editingId;
    if (!txId) return;

    if (confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
        try {
            await apiCall('delete', { table: 'transactions', id: txId });
            transactions = transactions.filter(t => t.id !== txId); // Update local array
            renderTransactions();
            makeStatements();
            modals.transaction.style.display = 'none';
            resetTransactionForm();
            alert('Transaction deleted successfully.');
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert('Failed to delete transaction. Please check the console.');
        }
    }
});


function showReceipt(type, data) {
    // Guard against missing data
    if (!data) return;

    // Map to new V2 receipt IDs present in index.html
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '';
    };

    // Client info
    setText('receiptClientName', data.name || data.category || 'N/A');
    setText('receiptClientAddress', data.address || '');
    setText('receiptClientPhone', data.phone || '');

    // Receipt meta
    const dateObj = data.date ? new Date(data.date) : new Date();
    setText('receiptDate', dateObj.toLocaleString());
    setText('receiptNo', (data.id ? String(data.id).slice(0, 8) : 'DW-' + (Math.floor(Math.random() * 9000) + 1000)));

    // Items and totals
    let itemsHtml = '';
    let totalAmount = 0;
    let itemNumber = 1;

    if (type === 'transaction') {
        const amount = (data.in_payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        totalAmount += amount;
        itemsHtml += `<tr><td>${itemNumber++}</td><td>${data.description || 'Transaction'}</td><td>₹${amount.toFixed(2)}</td></tr>`;
    } else if (type === 'expense') {
        const amount = Number(data.amount) || 0;
        totalAmount += amount;
        itemsHtml += `<tr><td>${itemNumber++}</td><td>${(data.category || 'Expense') + (data.item ? ': ' + data.item : '')}</td><td>₹${amount.toFixed(2)}</td></tr>`;
    }

    const itemsBody = document.getElementById('receiptItemsBody');
    if (itemsBody) itemsBody.innerHTML = itemsHtml;

    // Subtotal, taxes (0), total
    setText('receiptSubTotal', `₹${totalAmount.toFixed(2)}`);
    setText('receiptTaxes', `₹${(0).toFixed(2)}`);
    setText('receiptGrandTotal', `₹${totalAmount.toFixed(2)}`);

    // Finally show modal
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'flex';
}

// Print/Close handlers for receipt
function handlePrintReceipt() {
    try { window.print(); } catch (e) { console.error(e); }
}
function handleCloseReceipt() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}
function bindReceiptControls() {
    const printBtn = document.getElementById('printReceiptBtn');
    if (printBtn) {
        printBtn.onclick = handlePrintReceipt;
    }
    const closeBtn = document.getElementById('closeReceiptBtn');
    if (closeBtn) {
        closeBtn.onclick = handleCloseReceipt;
    }
}

function numberToWords(num) {
    // Simple number to words for rupees (up to 99999)
    const a = [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen' ];
    const b = [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ];
    if ((num = num.toString()).length > 5) return 'Amount too large';
    let n = ('00000' + num).substr(-5).match(/^(\d{2})(\d{3})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Thousand ' : '';
    str += (n[2] != 0) ? ((str != '') ? ' ' : '') + (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) : '';
    return str.trim() + ' Rupees only';
}

// Add this function to handle all button clicks in the table
function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        // Handle Edit Button clicks
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const txId = editBtn.dataset.id;
            if (txId) {
                editTransaction(txId);
            }
        }

        // Handle Receipt Button clicks
        const receiptBtn = e.target.closest('.receipt-btn');
        if (receiptBtn) {
            const txId = receiptBtn.dataset.id;
            if (txId) {
                showReceipt('transaction', transactions.find(t => t.id === txId));
            }
        }
    });
}

function resetTransactionForm() {
    const form = forms.transaction;
    if (!form) return;
    form.reset();
    const inContainer = document.getElementById('transInContainer');
    const outContainer = document.getElementById('transOutContainer');
    if (inContainer) inContainer.innerHTML = '';
    if (outContainer) outContainer.innerHTML = '';
    const deleteBtn = document.getElementById('deleteTransactionBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';
    // Ensure one default split row for in/out
    ensureDefaultSplitRows();
}

function ensureDefaultSplitRows() {
    const inContainer = document.getElementById('transInContainer');
    const outContainer = document.getElementById('transOutContainer');
    if (inContainer && inContainer.children.length === 0) {
        inContainer.appendChild(createSplitRow('in'));
    }
    if (outContainer && outContainer.children.length === 0) {
        outContainer.appendChild(createSplitRow('out'));
    }
    updatePaymentTypeOptions();
}

// Find the old createSplitRow function and replace it with this one.
function createSplitRow(direction) {
    const wrapper = document.createElement('div');
    wrapper.className = 'split-payment-row';

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '0';
    amountInput.step = '0.01';
    amountInput.value = '0';
    amountInput.placeholder = 'Amount';
    amountInput.className = direction === 'in' ? 'transInAmount' : 'transOutAmount';

    const typeSelect = document.createElement('select');
    typeSelect.className = direction === 'in' ? 'transInType' : 'transOutType';

    // --- THIS IS THE FIX ---
    // It now correctly populates the dropdown menu with your banks
    const bankOpts = banks.filter(b => b !== 'Cash').map(b => `<option value="${b}">${b}</option>`).join('');
    typeSelect.innerHTML = `<option value="Cash">Cash</option>${bankOpts}`;
    // --- END OF FIX ---

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'add-split-btn';
    addButton.innerHTML = '<i class="fas fa-plus"></i>';
    addButton.onclick = () => {
        const containerId = direction === 'in' ? 'transInContainer' : 'transOutContainer';
        document.getElementById(containerId).appendChild(createSplitRow(direction));
    };

    wrapper.appendChild(amountInput);
    wrapper.appendChild(typeSelect);
    wrapper.appendChild(addButton);

    return wrapper;
}

// Generic handler to add new split rows for other forms
document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-split-btn');
    if (!addBtn) return;
    const targetId = addBtn.getAttribute('data-target');
    const container = document.getElementById(targetId);
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'split-payment-row';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '0';
    amountInput.step = '0.01';
    amountInput.value = '0';
    amountInput.placeholder = 'Amount';
    // Choose classes based on container
    if (targetId === 'expensePayContainer') amountInput.className = 'expenseAmount';
    if (targetId === 'debtorPayContainer') amountInput.className = 'debtorAmount';
    if (targetId === 'creditorPayContainer') amountInput.className = 'creditorAmount';

    const typeSelect = document.createElement('select');
    if (targetId === 'expensePayContainer') typeSelect.className = 'expensePaymentType';
    if (targetId === 'debtorPayContainer') typeSelect.className = 'debtorPaymentType';
    if (targetId === 'creditorPayContainer') typeSelect.className = 'creditorPaymentType';
    const bankOpts = banks.filter(b => b !== 'Cash' && b !== 'Bank (Generic)').map(b => `<option value="${b}">${b}</option>`).join('');
    typeSelect.innerHTML = `<option value="Cash">Cash</option>${bankOpts}`;

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'add-split-btn';
    addButton.setAttribute('data-target', targetId);
    addButton.innerHTML = '<i class="fas fa-plus"></i>';

    row.appendChild(amountInput);
    row.appendChild(typeSelect);
    row.appendChild(addButton);
    container.appendChild(row);
});

function setupSplitPaymentButtons() {
    ensureDefaultSplitRows();
}

function setupRemoveSplitButtons() {
    // Minimal implementation: nothing to remove yet as we keep one row by default
}

function makeStatements() {
    // Compute totals
    let totalIncome = 0;
    let totalOutFromTransactions = 0;
    let totalExpenses = 0;

    let cashBalance = 0;
    const bankNameToBalance = {};

    // Transactions in/out
    (transactions || []).forEach(tx => {
        const inPayments = Array.isArray(tx.in_payments) ? tx.in_payments : [];
        const outPayments = Array.isArray(tx.out_payments) ? tx.out_payments : [];

        inPayments.forEach(p => {
            const amount = Number(p.amount) || 0;
            totalIncome += amount;
            if ((p.type || '').toLowerCase() === 'cash') {
                cashBalance += amount;
            } else if (p.type) {
                bankNameToBalance[p.type] = (bankNameToBalance[p.type] || 0) + amount;
            }
        });

        outPayments.forEach(p => {
            const amount = Number(p.amount) || 0;
            totalOutFromTransactions += amount;
            if ((p.type || '').toLowerCase() === 'cash') {
                cashBalance -= amount;
            } else if (p.type) {
                bankNameToBalance[p.type] = (bankNameToBalance[p.type] || 0) - amount;
            }
        });
    });

    // Standalone expenses
    (expenses || []).forEach(ex => {
        const splits = Array.isArray(ex.split_payments) ? ex.split_payments : null;
        if (splits && splits.length) {
            splits.forEach(p => {
                const amount = Number(p.amount) || 0;
                totalExpenses += amount;
                if ((p.type || '').toLowerCase() === 'cash') {
                    cashBalance -= amount;
                } else if (p.type) {
                    bankNameToBalance[p.type] = (bankNameToBalance[p.type] || 0) - amount;
                }
            });
        } else {
            const amount = Number(ex.amount) || 0;
            totalExpenses += amount;
            const pType = (ex.payment_type || '').toLowerCase();
            if (pType === 'cash') {
                cashBalance -= amount;
            } else if (ex.payment_type) {
                bankNameToBalance[ex.payment_type] = (bankNameToBalance[ex.payment_type] || 0) - amount;
            }
        }
    });

    // Transfers between accounts do not affect net total, just move balances
    (transfers || []).forEach(tr => {
        const amount = Number(tr.amount) || 0;
        const fromType = (tr.from || '').toLowerCase();
        const toType = (tr.to || '').toLowerCase();
        if (fromType === 'cash') cashBalance -= amount;
        else if (tr.from) bankNameToBalance[tr.from] = (bankNameToBalance[tr.from] || 0) - amount;
        if (toType === 'cash') cashBalance += amount;
        else if (tr.to) bankNameToBalance[tr.to] = (bankNameToBalance[tr.to] || 0) + amount;
    });

    const totalTransactionalExpenses = totalOutFromTransactions + totalExpenses;
    const netProfit = totalIncome - totalTransactionalExpenses;

    // Update top stats
    if (stats.income) stats.income.textContent = totalIncome.toFixed(2);
    if (stats.expenses) stats.expenses.textContent = totalTransactionalExpenses.toFixed(2);
    if (stats.profit) stats.profit.textContent = netProfit.toFixed(2);
    if (stats.cash) stats.cash.textContent = cashBalance.toFixed(2);
    const totalBankBalance = Object.values(bankNameToBalance).reduce((a, b) => a + b, 0);
    if (stats.bank) stats.bank.textContent = totalBankBalance.toFixed(2);

    const cashBalanceElem = document.getElementById('cashBalanceCash');
    if (cashBalanceElem) cashBalanceElem.textContent = cashBalance.toFixed(2);

    // Build cash statement
    cashStatements = [];
    (transactions || []).forEach(tx => {
        const { date, name, description, in_payments, out_payments } = tx;
        (Array.isArray(in_payments) ? in_payments : []).forEach(p => {
            const amount = Number(p.amount) || 0;
            if ((p.type || '').toLowerCase() === 'cash') {
                cashStatements.push({ date: tx.date, description: tx.description || tx.name || 'Transaction In', in: amount, out: 0 });
            }
        });
        (Array.isArray(out_payments) ? out_payments : []).forEach(p => {
            const amount = Number(p.amount) || 0;
            if ((p.type || '').toLowerCase() === 'cash') {
                cashStatements.push({ date: tx.date, description: tx.description || tx.name || 'Transaction Out', in: 0, out: amount });
            }
        });
    });
    (expenses || []).forEach(ex => {
        const amount = Number(ex.amount) || 0;
        if ((ex.payment_type || '').toLowerCase() === 'cash') {
            cashStatements.push({ date: ex.date, description: ex.item || ex.category || 'Expense', in: 0, out: amount });
        }
    });
    (transfers || []).forEach(tr => {
        const amount = Number(tr.amount) || 0;
        if ((tr.from || '').toLowerCase() === 'cash') {
            cashStatements.push({ date: tr.date, description: tr.description || `Transfer to ${tr.to}`, in: 0, out: amount });
        }
        if ((tr.to || '').toLowerCase() === 'cash') {
            cashStatements.push({ date: tr.date, description: tr.description || `Transfer from ${tr.from}`, in: amount, out: 0 });
        }
    });

    // Process Debtors (Loan Given -> Money OUT)
    (debtors || []).forEach(d => {
        if (d.status !== 'Settled') {
            const splits = Array.isArray(d.split_payments) ? d.split_payments : null;
            if (splits && splits.length) {
                splits.forEach(p => {
                    const amount = Number(p.amount) || 0;
                    if ((p.type || '').toLowerCase() === 'cash') {
                        cashStatements.push({ date: d.date, description: `Loan to ${d.name}`, in: 0, out: amount });
                    } else {
                        if (!bankStatements[p.type]) bankStatements[p.type] = [];
                        bankStatements[p.type].push({ date: d.date, description: `Loan to ${d.name}`, in: 0, out: amount });
                    }
                });
            } else {
                const amount = Number(d.amount) || 0;
                if ((d.payment_type || '').toLowerCase() === 'cash') {
                    cashStatements.push({ date: d.date, description: `Loan to ${d.name}`, in: 0, out: amount });
                } else if (d.payment_type) {
                    if (!bankStatements[d.payment_type]) bankStatements[d.payment_type] = [];
                    bankStatements[d.payment_type].push({ date: d.date, description: `Loan to ${d.name}`, in: 0, out: amount });
                }
            }
        }
    });

    // Process Creditors (Loan Taken -> Money IN)
    (creditors || []).forEach(c => {
        if (c.status !== 'Settled') {
            const splits = Array.isArray(c.split_payments) ? c.split_payments : null;
            if (splits && splits.length) {
                splits.forEach(p => {
                    const amount = Number(p.amount) || 0;
                    if ((p.type || '').toLowerCase() === 'cash') {
                        cashStatements.push({ date: c.date, description: `Loan from ${c.name}`, in: amount, out: 0 });
                    } else {
                        if (!bankStatements[p.type]) bankStatements[p.type] = [];
                        bankStatements[p.type].push({ date: c.date, description: `Loan from ${c.name}`, in: amount, out: 0 });
                    }
                });
            } else {
                const amount = Number(c.amount) || 0;
                if ((c.payment_type || '').toLowerCase() === 'cash') {
                    cashStatements.push({ date: c.date, description: `Loan from ${c.name}`, in: amount, out: 0 });
                } else if (c.payment_type) {
                    if (!bankStatements[c.payment_type]) bankStatements[c.payment_type] = [];
                    bankStatements[c.payment_type].push({ date: c.date, description: `Loan from ${c.name}`, in: amount, out: 0 });
                }
            }
        }
    });

    cashStatements.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    let runningCash = 0;
    const cashRowsHtml = cashStatements.map(entry => {
        runningCash += Number(entry.in) - Number(entry.out);
        return `
            <tr>
                <td>${entry.date ? new Date(entry.date).toLocaleDateString() : ''}</td>
                <td>${entry.description || ''}</td>
                <td>₹${(Number(entry.in) || 0).toFixed(2)}</td>
                <td>₹${(Number(entry.out) || 0).toFixed(2)}</td>
                <td>₹${runningCash.toFixed(2)}</td>
            </tr>`;
    }).join('');
    if (tables.cashStatementBody) tables.cashStatementBody.innerHTML = cashRowsHtml;

    // Build bank statements per bank
    bankStatements = {};
    const allBankNames = new Set(
        banks.filter(b => b && b !== 'Cash' && b !== 'Bank (Generic)')
            .concat(Object.keys(bankNameToBalance))
    );

    allBankNames.forEach(bankName => { bankStatements[bankName] = []; });

    (transactions || []).forEach(tx => {
        (Array.isArray(tx.in_payments) ? tx.in_payments : []).forEach(p => {
            const amount = Number(p.amount) || 0;
            if (p.type && (p.type || '').toLowerCase() !== 'cash') {
                if (!bankStatements[p.type]) bankStatements[p.type] = [];
                bankStatements[p.type].push({ date: tx.date, description: tx.description || tx.name || 'Transaction In', in: amount, out: 0 });
            }
        });
        (Array.isArray(tx.out_payments) ? tx.out_payments : []).forEach(p => {
            const amount = Number(p.amount) || 0;
            if (p.type && (p.type || '').toLowerCase() !== 'cash') {
                if (!bankStatements[p.type]) bankStatements[p.type] = [];
                bankStatements[p.type].push({ date: tx.date, description: tx.description || tx.name || 'Transaction Out', in: 0, out: amount });
            }
        });
    });
    (expenses || []).forEach(ex => {
        const splits = Array.isArray(ex.split_payments) ? ex.split_payments : null;
        if (splits && splits.length) {
            splits.forEach(p => {
                const amount = Number(p.amount) || 0;
                if ((p.type || '').toLowerCase() !== 'cash') {
                    if (!bankStatements[p.type]) bankStatements[p.type] = [];
                    bankStatements[p.type].push({ date: ex.date, description: ex.item || ex.category || 'Expense', in: 0, out: amount });
                }
            });
        } else {
            const amount = Number(ex.amount) || 0;
            if (ex.payment_type && (ex.payment_type || '').toLowerCase() !== 'cash') {
                if (!bankStatements[ex.payment_type]) bankStatements[ex.payment_type] = [];
                bankStatements[ex.payment_type].push({ date: ex.date, description: ex.item || ex.category || 'Expense', in: 0, out: amount });
            }
        }
    });
    (transfers || []).forEach(tr => {
        const amount = Number(tr.amount) || 0;
        if (tr.from && (tr.from || '').toLowerCase() !== 'cash') {
            if (!bankStatements[tr.from]) bankStatements[tr.from] = [];
            bankStatements[tr.from].push({ date: tr.date, description: tr.description || `Transfer to ${tr.to}`, in: 0, out: amount });
        }
        if (tr.to && (tr.to || '').toLowerCase() !== 'cash') {
            if (!bankStatements[tr.to]) bankStatements[tr.to] = [];
            bankStatements[tr.to].push({ date: tr.date, description: tr.description || `Transfer from ${tr.from}`, in: amount, out: 0 });
        }
    });
    (debtors || []).forEach(d => {
        if (d.status !== 'Settled') {
            const amount = Number(d.amount) || 0;
            if (d.payment_type && (d.payment_type || '').toLowerCase() !== 'cash') {
                if (!bankStatements[d.payment_type]) bankStatements[d.payment_type] = [];
                bankStatements[d.payment_type].push({ date: d.date, description: `Loan to ${d.name}`, in: 0, out: amount });
            }
        }
    });
    (creditors || []).forEach(c => {
        if (c.status !== 'Settled') {
            const amount = Number(c.amount) || 0;
            if (c.payment_type && (c.payment_type || '').toLowerCase() !== 'cash') {
                if (!bankStatements[c.payment_type]) bankStatements[c.payment_type] = [];
                bankStatements[c.payment_type].push({ date: c.date, description: `Loan from ${c.name}`, in: amount, out: 0 });
            }
        }
    });

    Object.values(bankStatements).forEach(statements => {
        statements.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    });

    // Render bank balances list
    const bankBalancesElem = document.getElementById('bankBalances');
    if (bankBalancesElem) {
        const entries = Array.from(allBankNames).sort().map(bankName => {
            const bal = bankNameToBalance[bankName] || 0;
            return `<div class="bank-balance-item" data-bank="${bankName}" style="display:flex;justify-content:space-between;padding:6px 8px;border-bottom:1px solid #eee;cursor:pointer;">
                        <span>${bankName}</span>
                        <span>₹${bal.toFixed(2)}</span>
                    </div>`;
        }).join('');
        bankBalancesElem.innerHTML = entries || '<div style="color:#777;">No banks yet</div>';

        bankBalancesElem.onclick = (e) => {
            const item = e.target.closest('[data-bank]');
            if (!item) return;
            const bankName = item.getAttribute('data-bank');
            renderBankStatement(bankName);
        };
    }

    // Default render first bank statement if exists
    const firstBank = Object.keys(bankStatements)[0];
    if (firstBank) renderBankStatement(firstBank);

    // Add these lines at the end of the makeStatements() function
    updateTrendChart();
    updateBankPieChart();
}

function renderBankStatement(bankName) {
    const selectedNameElem = document.getElementById('selectedBankName');
    if (selectedNameElem) selectedNameElem.textContent = bankName || 'None';
    const container = document.getElementById('bankStatementTableContainer');
    if (!container) return;
    const entries = (bankStatements[bankName] || []).slice().sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    let running = 0;
    const rows = entries.map(en => {
        running += Number(en.in) - Number(en.out);
        return `<tr>
            <td>${en.date ? new Date(en.date).toLocaleDateString() : ''}</td>
            <td>${en.description || ''}</td>
            <td>₹${(Number(en.in) || 0).toFixed(2)}</td>
            <td>₹${(Number(en.out) || 0).toFixed(2)}</td>
            <td>₹${running.toFixed(2)}</td>
        </tr>`;
    }).join('');
    const tableHtml = `
        <table class="desktop-view" style="width:100%">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>In (₹)</th>
                    <th>Out (₹)</th>
                    <th>Balance (₹)</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    container.innerHTML = tableHtml;
}

// --- Settle Debt Logic ---
async function openSettleModal(type, id) {
    const item = type === 'debtor' ? debtors.find(d => d.id === id) : creditors.find(c => c.id === id);
    if (!item) return;

    const modalTitle = document.getElementById('settleModalTitle');
    if (modalTitle) modalTitle.textContent = `Settle ${type}`;

    document.getElementById('settleDate').value = new Date().toISOString().slice(0, 16);
    document.getElementById('settleAmount').value = item.amount;
    document.getElementById('settlePaymentType').value = item.payment_type || 'Cash';
    document.getElementById('settleDescription').value = `Settlement for ${item.name}`;

    forms.settle.dataset.editingId = id;
    showModal('settle');
}

forms.settle.addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId = this.dataset.editingId;

    const settleData = {
        date: document.getElementById('settleDate').value,
        amount: parseFloat(document.getElementById('settleAmount').value) || 0,
        payment_type: document.getElementById('settlePaymentType').value,
        description: document.getElementById('settleDescription').value,
        status: 'Settled' // Assuming settlement means settled
    };

    if (editingId) {
        settleData.id = editingId;
    }

    try {
        const savedSettle = await apiCall('addOrUpdate', { table: 'debtors', data: settleData });
        if (type === 'debtor') {
            debtors = debtors.map(d => d.id === editingId ? savedSettle : d);
            renderDebtors();
        } else {
            creditors = creditors.map(c => c.id === editingId ? savedSettle : c);
            renderCreditors();
        }
        makeStatements();
        modals.settle.style.display = 'none';
        resetSettleForm();
        alert(`${type} settled successfully.`);
    } catch (error) {
        console.error("Error settling debt:", error);
        alert('Failed to settle debt. Please check the console.');
    }
});

function resetSettleForm() {
    const form = forms.settle;
    if (!form) return;
    form.reset();
    const deleteBtn = document.getElementById('deleteSettleBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';
}

function setupRemoveSplitButtons() {
    // Minimal implementation: nothing to remove yet as we keep one row by default
}

// (Removed duplicate setupEventListeners block)

/*buttons.reset.addEventListener('click', async function () {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        try {
            await apiCall('clearAllData'); // Assuming a 'clearAllData' action in your proxy
            transactions = [];
            expenses = [];
            debtors = [];
            creditors = [];
            transfers = [];
            banks = ['Bank (Generic)'];
            categories = [];
            init();
            alert('All data reset successfully.');
        } catch (error) {
            console.error("Error resetting data:", error);
            alert('Failed to reset data. Please check the console.');
        }
    }
});
*/

// === AI Assistant Minimize/Maximize ===
function toggleAIChat() {
    const aiBox = document.getElementById('aiAssistant');
    if (!aiBox) return;
    aiBox.classList.toggle('minimized');
    // Change icon
    const icon = document.getElementById('aiToggleIcon');
    if (icon) {
        icon.textContent = aiBox.classList.contains('minimized') ? '+' : '−';
    }
}
