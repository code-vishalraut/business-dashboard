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
    document.querySelectorAll('.transInType, .transOutType, #expensePaymentType, #debtorPaymentType, #creditorPaymentType, #transferFrom, #transferTo, #settlePaymentType').forEach(select => select.innerHTML = allOpts);
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
        const ex = {
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            item: document.getElementById('expenseItem').value,
            amount: parseFloat(document.getElementById('expenseAmount').value) || 0,
            payment_type: document.getElementById('expensePaymentType').value
        };
        await apiCall('addOrUpdate', { table: 'expenses', data: ex });
        // Optimistically update UI or wait for real-time update
        expenses.unshift(ex);
        renderExpenses();
        makeStatements();
        this.reset();
        modals.expense.style.display = 'none';
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
    // Your original event listener setups
    // ...
}

// =================================================================
// ADDED: Minimal implementations for missing functions
// =================================================================

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
                <td>—</td>
                <td>—</td>
            </tr>`;
    }).join('');
}

function renderDebtors() {
    const body = document.getElementById('debtorsBody');
    if (!body) return;
    const rowsHtml = (debtors || [])
        .slice()
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
        .map(d => {
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
                    <td>—</td>
                </tr>`;
        }).join('');
    body.innerHTML = rowsHtml;
}

function renderCreditors() {
    const body = document.getElementById('creditorsBody');
    if (!body) return;
    const rowsHtml = (creditors || [])
        .slice()
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
        .map(c => {
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
                    <td>—</td>
                </tr>`;
        }).join('');
    body.innerHTML = rowsHtml;
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

function createSplitRow(direction) {
    const wrapper = document.createElement('div');
    wrapper.className = 'split-row';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '0';
    amountInput.step = '0.01';
    amountInput.placeholder = direction === 'in' ? 'Amount In' : 'Amount Out';
    amountInput.className = direction === 'in' ? 'transInAmount' : 'transOutAmount';

    const typeSelect = document.createElement('select');
    typeSelect.className = direction === 'in' ? 'transInType' : 'transOutType';

    wrapper.appendChild(amountInput);
    wrapper.appendChild(typeSelect);
    return wrapper;
}

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
        const amount = Number(ex.amount) || 0;
        totalExpenses += amount;
        const pType = (ex.payment_type || '').toLowerCase();
        if (pType === 'cash') {
            cashBalance -= amount;
        } else if (ex.payment_type) {
            bankNameToBalance[ex.payment_type] = (bankNameToBalance[ex.payment_type] || 0) - amount;
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
        (Array.isArray(tx.in_payments) ? tx.in_payments : []).forEach(p => {
            const amount = Number(p.amount) || 0;
            if ((p.type || '').toLowerCase() === 'cash') {
                cashStatements.push({ date: tx.date, description: tx.description || tx.name || 'Transaction In', in: amount, out: 0 });
            }
        });
        (Array.isArray(tx.out_payments) ? tx.out_payments : []).forEach(p => {
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
        const amount = Number(ex.amount) || 0;
        if (ex.payment_type && (ex.payment_type || '').toLowerCase() !== 'cash') {
            if (!bankStatements[ex.payment_type]) bankStatements[ex.payment_type] = [];
            bankStatements[ex.payment_type].push({ date: ex.date, description: ex.item || ex.category || 'Expense', in: 0, out: amount });
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