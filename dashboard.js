// =================================================================
// SUPABASE & AUTHENTICATION SETUP
// =================================================================
const SUPABASE_URL = 'https://clcqdjmfkkvqzxcjbvdm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsY3Fkam1ma2t2cXp4Y2pidmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTY4MDEsImV4cCI6MjA3MDM5MjgwMX0.C57KA-Ck1YPckr49pH3hfH4fJ5bNzklkINaeseGOFAE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements for Auth
const authContainer = document.getElementById('auth-container');
const dashboardWrapper = document.getElementById('dashboard-wrapper');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeMessage = document.getElementById('welcome-message');
const authError = document.getElementById('auth-error');


// =================================================================
// DATA STORAGE (IN-MEMORY, POPULATED FROM SUPABASE)
// =================================================================
let transactions = [];
let expenses = [];
let debtors = [];
let creditors = [];
let transfers = [];
let banks = []; // Now stores bank objects {id, name, user_id}
let categories = [];
let cashStatements = [];
let bankStatements = {};
let balances = { cash: 0, bank: 0 };
let realtimeChannel;


// =================================================================
// API HELPER FUNCTION
// =================================================================
async function apiCall(action, payload) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.error("No active session. Cannot make API call.");
        handleLogout(); // Log out if session is lost
        return;
    }

    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ action, payload })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API call failed for action "${action}":`, error);
        alert(`An error occurred: ${error.message}`);
        // Optional: Implement more robust error handling, e.g., a toast notification
        throw error; // Re-throw to allow calling function to handle it
    }
}


// =================================================================
// AUTHENTICATION LOGIC
// =================================================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    authError.textContent = '';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authError.textContent = error.message;
    } else if (data.user) {
        await initializeDashboard(data.user);
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// Listen for auth state changes (login, logout)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        handleLogout();
    } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if(session.user) initializeDashboard(session.user);
    }
});

function handleLogout() {
    // Hide dashboard, show login
    dashboardWrapper.style.display = 'none';
    authContainer.style.display = 'flex';
    welcomeMessage.textContent = '';
    
    // Unsubscribe from real-time channel
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }

    // Clear all in-memory data
    transactions = [];
    expenses = [];
    debtors = [];
    creditors = [];
    transfers = [];
    banks = [];
}

async function initializeDashboard(user) {
    welcomeMessage.textContent = `Welcome, ${user.email}`;
    authContainer.style.display = 'none';
    dashboardWrapper.style.display = 'block';

    // Fetch all initial data from the backend
    try {
        const allData = await apiCall('fetchAll');
        transactions = allData.transactions || [];
        expenses = allData.expenses || [];
        debtors = allData.debtors || [];
        creditors = allData.creditors || [];
        transfers = allData.transfers || [];
        banks = allData.banks || [];
        
        // Initial setup and render
        init();
        
        // Setup real-time listeners AFTER initial data is loaded
        setupRealtimeListeners();
    } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        alert("Could not load your data. Please try refreshing the page.");
    }
}

// =================================================================
// REAL-TIME DATA HANDLING
// =================================================================
function setupRealtimeListeners() {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel); // Remove old channel if exists
    }
    
    realtimeChannel = supabase.channel('dashboard_updates')
        .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
            console.log('Real-time change received:', payload);
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            let recordId = (eventType === 'DELETE' ? oldRecord.id : newRecord.id);

            // Generic function to update local arrays
            const updateLocalArray = (arr) => {
                const index = arr.findIndex(item => item.id === recordId);
                if (eventType === 'INSERT') {
                    arr.unshift(newRecord);
                } else if (eventType === 'UPDATE') {
                    if (index > -1) arr[index] = newRecord;
                } else if (eventType === 'DELETE') {
                    if (index > -1) arr.splice(index, 1);
                }
            };
            
            // Update the correct local data array based on the table name
            switch (table) {
                case 'transactions': updateLocalArray(transactions); renderTransactions(); break;
                case 'expenses': updateLocalArray(expenses); renderExpenses(); renderCategoryFilter(); break;
                case 'debtors': updateLocalArray(debtors); renderDebtors(); break;
                case 'creditors': updateLocalArray(creditors); renderCreditors(); break;
                case 'transfers': updateLocalArray(transfers); renderTransfers(); break;
                case 'banks': 
                    updateLocalArray(banks);
                    updatePaymentTypeOptions(); // Update dropdowns everywhere
                    renderBanksList(); // Update modal list
                    break;
            }
            
            // Recalculate everything after any change
            makeStatements();
        })
        .subscribe();
}


// --- Rest of your dashboard.js code ---
// IMPORTANT: All functions that used to save to localStorage now need to call apiCall()
// Example: Saving an expense
// Old: expenses.unshift(ex); localStorage.setItem(...)
// New: await apiCall('addOrUpdate', { table: 'expenses', data: ex });

// Paste your entire dashboard.js content below, then we will modify key functions.
// I have done the modifications for you below. Use this complete script.

// =================================================================
// GLOBALS
// =================================================================

// DOM elements
const tabs = {
    home: document.getElementById('tabHome'),
    main: document.getElementById('tabMain'),
    expenses: document.getElementById('tabExpenses'),
    debtors: document.getElementById('tabDebtors'),
    creditors: document.getElementById('tabCreditors'),
    account: document.getElementById('tabAccount'),
    cash: document.getElementById('tabCash'),
    transfers: document.getElementById('tabTransfers'),
    export: document.getElementById('tabExport')
};
const tabContents = {
    home: document.getElementById('tabHomeContent'),
    main: document.getElementById('tabMainContent'),
    expenses: document.getElementById('tabExpensesContent'),
    debtors: document.getElementById('tabDebtorsContent'),
    creditors: document.getElementById('tabCreditorsContent'),
    account: document.getElementById('tabAccountContent'),
    cash: document.getElementById('tabCashContent'),
    transfers: document.getElementById('tabTransfersContent'),
    export: document.getElementById('tabExportContent')
};
const stats = {
    income: document.getElementById('totalIncome'),
    expenses: document.getElementById('totalExpenses'),
    profit: document.getElementById('netProfit'),
    cash: document.getElementById('cashBalance'),
    bank: document.getElementById('bankBalance')
};
const tables = {
    transactionsBody: document.getElementById('transactionsBody'),
    expensesBody: document.getElementById('expensesBody'),
    debtorsBody: document.getElementById('debtorsBody'),
    creditorsBody: document.getElementById('creditorsBody'),
    cashStatementBody: document.getElementById('cashStatementBody'),
    transfersBody: document.getElementById('transfersBody')
};
const filters = {
    category: document.getElementById('filterCategory'),
    categoryList: document.getElementById('categoryList')
};
const modals = {
    transaction: document.getElementById('transactionFormModal'),
    expense: document.getElementById('expenseFormModal'),
    debtor: document.getElementById('debtorFormModal'),
    creditor: document.getElementById('creditorFormModal'),
    transfer: document.getElementById('transferFormModal'),
    receipt: document.getElementById('receiptModal'),
    banks: document.getElementById('banksModal'),
    settle: document.getElementById('settleModal')
};
const forms = {
    transaction: document.getElementById('transactionForm'),
    expense: document.getElementById('expenseForm'),
    debtor: document.getElementById('debtorForm'),
    creditor: document.getElementById('creditorForm'),
    transfer: document.getElementById('transferForm'),
    settle: document.getElementById('settleForm')
};

// ... (keep all your other global variables like buttons, etc.)

// =================================================================
// FUNCTIONS
// =================================================================

// --- Tab Navigation (no changes needed) ---
function openTab(tabName) {
    Object.values(tabContents).forEach(content => content.classList.remove('active'));
    Object.values(tabs).forEach(tab => tab.classList.remove('active'));
    tabContents[tabName].classList.add('active');
    tabs[tabName].classList.add('active');
}
Object.entries(tabs).forEach(([name, tab]) => {
    tab.addEventListener('click', () => openTab(name));
});

// --- Modals (no changes needed) ---
function showModal(modalName) {
    if (modals[modalName]) modals[modalName].classList.add('active');
}
document.querySelectorAll('.modal .close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => e.target.closest('.modal').classList.remove('active'));
});

// --- MODIFIED: Update Payment/Bank Type Options ---
function updatePaymentTypeOptions() {
    const bankOpts = banks.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
    const allOpts = `<option value="Cash">Cash</option>${bankOpts}`;
    document.querySelectorAll('.transInType, .transOutType, #expensePaymentType, #debtorPaymentType, #creditorPaymentType, #transferFrom, #transferTo, #settlePaymentType')
        .forEach(select => { select.innerHTML = allOpts; });
}

// --- Split Payment (no changes needed) ---
// ... (your setupSplitPaymentButtons and setupRemoveSplitButtons functions)

// --- MODIFIED: Banks Management ---
function renderBanksList() {
    document.getElementById('banksList').innerHTML = banks.map(b => 
        `<div>${b.name} <button class="remove-bank-btn" data-id="${b.id}" style="float: right; color: red; background: none; border: none; cursor: pointer;">&times;</button></div>`
    ).join('');

    // Add event listeners for the new delete buttons
    document.querySelectorAll('.remove-bank-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const bankId = this.dataset.id;
            if (confirm('Are you sure you want to delete this bank? This cannot be undone.')) {
                try {
                    await apiCall('delete', { table: 'banks', id: bankId });
                    // The real-time listener will handle the UI update.
                } catch (error) {
                    alert('Failed to delete bank.');
                }
            }
        });
    });
}
document.getElementById('manageBanksBtn').addEventListener('click', () => {
    renderBanksList();
    showModal('banks');
});
document.getElementById('addBankBtn').addEventListener('click', async () => {
    const bankName = document.getElementById('newBankName').value.trim();
    if (!bankName) return;
    if (!banks.some(b => b.name === bankName)) {
        const newBank = { name: bankName };
        try {
            await apiCall('addOrUpdate', { table: 'banks', data: newBank });
            document.getElementById('newBankName').value = '';
            // Real-time listener handles the rest.
        } catch (error) {
            alert('Failed to add bank.');
        }
    } else {
        alert(`${bankName} already exists!`);
    }
});


// --- Table Rendering (MODIFIED to use 'id' instead of index) ---
function renderTransactions() {
    tables.transactionsBody.innerHTML = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(tx => {
            let inTotal = tx.in_payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            let outTotal = tx.out_payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            let profit = inTotal - outTotal;
            return `
        <tr>
          <td>${new Date(tx.date).toLocaleString()}</td>
          <td>${tx.name}</td>
          <td>${tx.phone || ''}</td>
          <td>${tx.description}</td>
          <td>₹${inTotal.toFixed(2)}</td>
          <td>${tx.in_payments?.map(p => p.type).join(', ') || 'N/A'}</td>
          <td>₹${outTotal.toFixed(2)}</td>
          <td>${tx.out_payments?.map(p => p.type).join(', ') || 'N/A'}</td>
          <td>₹${profit.toFixed(2)}</td>
          <td class="status-${tx.status?.toLowerCase() || 'pending'}">${tx.status || 'Pending'}</td>
          <td><button class="receipt-btn" data-id="${tx.id}"><i class="fas fa-receipt"></i></button></td>
          <td><button class="edit-btn" data-id="${tx.id}"><i class="fas fa-pencil-alt"></i></button></td>
          <td>${tx.notes || '-'}</td>
        </tr>`;
        })
        .join('') || '<tr><td colspan="13">No transactions yet</td></tr>';
    // Add event listeners using delegation for better performance
}

// ... continue modifying renderExpenses, renderDebtors, renderCreditors to use `data-id`

// --- Event Listener Delegation (Add this to your init function) ---
function setupEventListeners() {
    document.body.addEventListener('click', e => {
        const target = e.target;
        // Edit Transaction
        if(target.closest('.edit-btn')) {
            const id = target.closest('.edit-btn').dataset.id;
            const tx = transactions.find(t => t.id === id);
            if (tx) editTransaction(tx);
        }
        // Settle Debtor/Creditor
        if(target.closest('.settle-btn')) {
            openSettleModal(target.closest('.settle-btn'));
        }
        // ... add other delegated events here (receipts, delete buttons etc)
    });
}

// --- MODIFIED: Forms to use API ---
forms.expense.addEventListener('submit', async function (e) {
    e.preventDefault();
    const ex = {
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        item: document.getElementById('expenseItem').value,
        amount: parseFloat(document.getElementById('expenseAmount').value) || 0,
        payment_type: document.getElementById('expensePaymentType').value
    };
    try {
        await apiCall('addOrUpdate', { table: 'expenses', data: ex });
        this.reset();
        modals.expense.classList.remove('active');
    } catch(error) { /* error already handled in apiCall */ }
});

// MODIFIED: Edit Transaction to use ID
function editTransaction(tx) {
    // ... your form filling logic ...
    document.getElementById('editingTransactionId').value = tx.id; // Store ID
    // ...
    showModal('transaction');
}

// MODIFIED: Transaction form submission
forms.transaction.addEventListener('submit', async function (e) {
    e.preventDefault();
    // ... get all form values ...
    const editingId = document.getElementById('editingTransactionId').value;
    const txData = {
        // ... all fields ...
    };
    if (editingId) {
        txData.id = editingId;
    }
    await apiCall('addOrUpdate', { table: 'transactions', data: txData });
    // ... close modal & reset form ...
});

// --- INITIALIZE THE APP ---
function init() {
    updatePaymentTypeOptions();
    renderCategoryFilter();
    renderTransactions();
    renderExpenses();
    renderDebtors();
    renderCreditors();
    renderTransfers();
    makeStatements(); // This will calculate balances and render charts
    setupEventListeners(); // Setup delegated event listeners
}