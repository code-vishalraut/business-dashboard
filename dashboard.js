// =================================================================
// NEW: SUPABASE & AUTHENTICATION SETUP
// =================================================================
let SUPABASE_URL = 'https://clcqdjmfkkvqzxcjbvdm.supabase.co';
// !!! IMPORTANT: PASTE YOUR 'anon public' KEY FROM YOUR SUPABASE PROJECT HERE !!!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsY3Fkam1ma2t2cXp4Y2pidmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTY4MDEsImV4cCI6MjA3MDM5MjgwMX0.C57KA-Ck1YPckr49pH3hfH4fJ5bNzklkINaeseGOFAE';

const supa_base = window.supa_base.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- In-Memory Data Storage (loaded from Supabase) ---
let transactions = [], expenses = [], debtors = [], creditors = [], transfers = [];
let banks = []; // This will now be an array of bank name strings
let categories = [];
let cashStatements = [];
let bankStatements = {};
let balances = { cash: 0, bank: 0 };
let profileData = {
    name: 'Digital World',
    phone: '7547034664',
    email: 'support@digitalworld.com',
    website: 'www.digitalworld.com',
    address: 'Your Address Here',
    image: 'pf.JPG'
};
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
    const { data, error } = await supa_base.auth.signInWithPassword({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    });
    if (error) document.getElementById('auth-error').textContent = error.message;
});

logoutBtn.addEventListener('click', async () => {
    try {
        await supa_base.auth.signOut();
    } catch (err) {
        console.error('Error during logout:', err);
    } finally {
        // Fallback UI switch in case the auth event is delayed
        if (dashboardWrapper) dashboardWrapper.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
    }
});

supa_base.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        if (dashboardWrapper) dashboardWrapper.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
        if (realtimeChannel) supa_base.removeChannel(realtimeChannel);
    } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session.user) initializeDashboard(session.user);
    }
});

async function initializeDashboard(user) {
    document.getElementById('welcome-message').textContent = `Welcome, ${user.email}`;
    if (authContainer) authContainer.style.display = 'none';
    if (dashboardWrapper) dashboardWrapper.style.display = 'block';
    try {
        const allData = await apiCall(null, 'fetchAll', null);
        transactions = allData.transactions || [];
        expenses = allData.expenses || [];
        debtors = allData.debtors || [];
        creditors = allData.creditors || [];
        transfers = allData.transfers || [];
        banks = ['Bank (Generic)'].concat((allData.banks || []).map(b => b.name));

        // Load profile data
        if (allData.profile && allData.profile.length > 0) {
            profileData = { ...profileData, ...allData.profile[0] };
        }

        init(); // Call your original init function
        setupRealtimeListeners();
        updateProfileDisplay();
    } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        alert("Could not load your data. Please check the Vercel logs for a specific error message.");
    }
}

// --- API Helper ---
async function apiCall(table, action, payload) {
    const { data: { session } } = await supa_base.auth.getSession();
    if (!session) throw new Error("No active session.");
    const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ table, action, payload })
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

// Global variables and element references with null checks
const tabs = { home: document.getElementById('tabHome'), main: document.getElementById('tabMain'), expenses: document.getElementById('tabExpenses'), debtors: document.getElementById('tabDebtors'), creditors: document.getElementById('tabCreditors'), account: document.getElementById('tabAccount'), cash: document.getElementById('tabCash'), export: document.getElementById('tabExport') };
const tabContents = { home: document.getElementById('tabHomeContent'), main: document.getElementById('tabMainContent'), expenses: document.getElementById('tabExpensesContent'), debtors: document.getElementById('tabDebtorsContent'), creditors: document.getElementById('tabCreditorsContent'), account: document.getElementById('tabAccountContent'), cash: document.getElementById('tabCashContent'), export: document.getElementById('tabExportContent') };
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
    cashStatementBody: document.getElementById('cashStatementBody') 
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
    settle: document.getElementById('settleModal'), 
    profile: document.getElementById('profileModal') 
};
const buttons = {addTransfer: document.getElementById('addTransferBtn'), addExpense: document.getElementById('addExpenseBtn'), addDebtor: document.getElementById('addDebtorBtn'), addCreditor: document.getElementById('addCreditorBtn'), quickAddTrans: document.getElementById('quickAddTransBtn'), quickAddExpense: document.getElementById('quickAddExpenseBtn'), quickAddDebtor: document.getElementById('quickAddDebtorBtn'), quickAddCreditor: document.getElementById('quickAddCreditorBtn'), reset: document.getElementById('resetAllBtn'), printReceipt: document.getElementById('printReceiptBtn'), closeReceipt: document.getElementById('closeReceiptBtn'), manageBanks: document.getElementById('manageBanksBtn'), addBank: document.getElementById('addBankBtn'), deleteTransaction: document.getElementById('deleteTransactionBtn') };
const forms = { transaction: document.getElementById('transactionForm'), expense: document.getElementById('expenseForm'), debtor: document.getElementById('debtorForm'), creditor: document.getElementById('creditorForm'),transfer: document.getElementById('transferForm'), settle: document.getElementById('settleForm') };
const exportBtns = { transactions: document.getElementById('exportMainBtn'), expenses: document.getElementById('exportExpensesBtn'), debtors: document.getElementById('exportDebtorsBtn'), creditors: document.getElementById('exportCreditorsBtn'), account: document.getElementById('exportAccountBtn'), cash: document.getElementById('exportCashBtn') };
let bankStatementFilter = { from: null, to: null };

// --- Tab Navigation ---
function openTab(tabName) {
    Object.values(tabContents).forEach(content => content.classList.remove('active'));
    Object.values(tabs).forEach(tab => tab.classList.remove('active'));

    if (tabContents[tabName]) tabContents[tabName].classList.add('active');
    if (tabs[tabName]) tabs[tabName].classList.add('active');
}

// Setup tab event listeners
function setupTabEventListeners() {
    Object.entries(tabs).forEach(([name, tab]) => {
        if (tab) {
            tab.addEventListener('click', () => {
                openTab(name);
            });
        }
    });
}

// --- Modals ---
function showModal(modalName) {
    if (modals[modalName]) modals[modalName].style.display = 'flex';
}
document.querySelectorAll('.modal .close-btn').forEach(btn => {
    if (btn) {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                if (modal.id === 'transactionFormModal') resetTransactionForm();
            }
        });
    }
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
// The new, corrected code:
buttons.addTransfer.addEventListener('click', () => {
    updatePaymentTypeOptions(); // This new line updates the dropdowns first
    showModal('transfer');      // Then it shows the form
});

buttons.addExpense && buttons.addExpense.addEventListener('click', () => showModal('expense'));
buttons.addDebtor && buttons.addDebtor.addEventListener('click', () => showModal('debtor'));
buttons.addCreditor && buttons.addCreditor.addEventListener('click', () => showModal('creditor'));


buttons.quickAddExpense && buttons.quickAddExpense.addEventListener('click', () => showModal('expense'));
buttons.quickAddDebtor && buttons.quickAddDebtor.addEventListener('click', () => showModal('debtor'));
buttons.quickAddCreditor && buttons.quickAddCreditor.addEventListener('click', () => showModal('creditor'));


// --- Update Payment/Bank Type Options ---
function updatePaymentTypeOptions() {
    const bankOpts = banks.filter(b => b !== 'Cash' && b !== 'Bank (Generic)').map(b => `<option value="${b}">${b}</option>`).join('');
    const allOpts = `<option value="Cash">Cash</option>${bankOpts}`;
    document.querySelectorAll('.transInType, .transOutType, .expensePaymentType, .debtorPaymentType, .creditorPaymentType, #settlePaymentType, #transferFrom, #transferTo').forEach(select => {
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
    const currentBanks = (await apiCall(null, 'fetchAll', null)).banks.map(b => b.name);
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
        await apiCall('banks', 'insert', { name: bankName });
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


// EXAMPLE MODIFICATION for renderTransactions
function renderTransactions() {
    // Filter out transactions that are from the 'add transaction' form only
    // This ensures debtor and creditor transactions don't appear in the main transaction list
    tables.transactionsBody.innerHTML = transactions
        .slice()
        .filter(tx => {
            // Only include transactions that were explicitly added via the add transaction form
            // Exclude transactions that were generated from debtor or creditor operations
            return !tx.source || (tx.source !== 'debtor' && tx.source !== 'creditor');
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Newest first
        .map(tx => {
            // Format date as DD/MM/YYYY
            let dateStr = '';
            if (tx.date) {
                const d = new Date(tx.date);
                dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            }
            let inTotal = tx.in_payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            let inTypes = tx.in_payments?.map(p => p.type).join(', ') || 'N/A';
            let outTotal = tx.out_payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            let outTypes = tx.out_payments?.map(p => p.type).join(', ') || 'N/A';
            let profit = inTotal - outTotal;
            return `
                <tr>
                    <td>${dateStr}</td>
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
        const localDateValue = document.getElementById('expenseDate').value; // Add this
        const properDate = new Date(localDateValue).toISOString();
        const ex = {
            date: properDate,
            category: document.getElementById('expenseCategory').value,
            item: document.getElementById('expenseItem').value,
            amount: total,
            payment_type: split.map(p => p.type).join(', '),
            split_payments: split
        };
        // ADDED: Use apiCall to save expense to Supabase
        await apiCall('expenses', 'insert', ex);
        // Optimistically update UI or wait for real-time update
        expenses.unshift(ex);
        renderExpenses();
        makeStatements();
        this.reset();
        modals.expense.style.display = 'none';
    });
}

forms.debtor.addEventListener("submit", async (e) => {
  e.preventDefault();
  const localDateValue = document.getElementById('debtorDate').value; // Add this
const properDate = new Date(localDateValue).toISOString();
  const name = document.getElementById("debtorName").value;
  const amount = parseFloat(document.querySelector(".debtorAmount").value);
  const mode = document.querySelector(".debtorPaymentType").value;
  const date = properDate;

  try {
    // सिर्फ डेटर टेबल में सेव करें
    const newDebtor = await apiCall("debtors", "insert", { name, amount, date, payment_type: mode, status: 'Pending' });
    
    // लोकल डेटा अपडेट करें और स्टेटमेंट दोबारा बनाएँ
    debtors.unshift(newDebtor); // लोकल डेटा में जोड़ें
    makeStatements(); // यह फंक्शन सही स्टेटमेंट बना देगा
    renderDebtors(); // टेबल को रिफ्रेश करें
    modals.debtor.style.display = 'none'; // मोडल बंद करें

  } catch (err) {
    console.error("Error adding debtor:", err);
  }
});


forms.creditor.addEventListener("submit", async (e) => {
  e.preventDefault();
  const localDateValue = document.getElementById('creditorDate').value; // Add this
const properDate = new Date(localDateValue).toISOString();
  const name = document.getElementById("creditorName").value;
  const amount = parseFloat(document.querySelector(".creditorAmount").value);
  const mode = document.querySelector(".creditorPaymentType").value;
  const date = properDate;
  const description = document.getElementById("creditorDesc").value; 

  try {
    // This code correctly creates ONLY the creditor record.
    const newCreditor = await apiCall("creditors", "insert", { 
        name, 
        amount, 
        date, 
        payment_type: mode, 
        description: description,
        status: 'Pending' 
    });

    // It then updates the UI correctly.
    creditors.unshift(newCreditor);
    makeStatements();
    renderCreditors();
    modals.creditor.style.display = 'none';
    
  } catch (err) {
    console.error("Error adding creditor:", err);
    alert("Failed to add creditor.");
  }
});

forms.settle.addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId = this.dataset.editingId;
    const settleType = this.dataset.settleType;

    const isDebtor = settleType === 'debtor';
    const originalItem = isDebtor 
        ? debtors.find(d => d.id == editingId) 
        : creditors.find(c => c.id == editingId);

    if (!originalItem) {
        alert("Error: Original item not found!");
        return;
    }

    const settleAmount = parseFloat(document.getElementById('settleAmount').value) || 0;
    const paymentType = document.getElementById('settlePaymentType').value;
    const localDateValue = document.getElementById('settleDate').value;
    const settleDate = new Date(localDateValue).toISOString();

    try {
        // Step 1: Create the new negative entry for the settlement payment
        const settlementEntry = {
            date: settleDate,
            name: originalItem.name,
            phone: originalItem.phone,
            amount: -settleAmount, 
            payment_type: paymentType,
            description: `Settlement for ${originalItem.name}`,
            status: 'Settled'
        };

        const table = isDebtor ? 'debtors' : 'creditors';
        const savedSettlement = await apiCall(table, 'insert', settlementEntry);
        
        if (isDebtor) {
            debtors.push(savedSettlement);
        } else {
            creditors.push(savedSettlement);
        }

        // Step 2: Update the status of the original loan entry
        const updatePayload = { ...originalItem, status: 'Settled' };
        const updatedOriginal = await apiCall(table, 'update', updatePayload);
        
        if (isDebtor) {
            debtors = debtors.map(d => d.id == editingId ? updatedOriginal : d);
        } else {
            creditors = creditors.map(c => c.id == editingId ? updatedOriginal : c);
        }

        // --- THIS IS THE NEW LOGIC YOU REQUESTED ---
        // Step 2.5: If settling a debtor linked to a transaction, update the transaction's status
        if (isDebtor && originalItem.transaction_id) {
            const linkedTx = transactions.find(t => t.id == originalItem.transaction_id);
            if (linkedTx) {
                const updatedTxPayload = { ...linkedTx, status: 'Done' };
                const updatedTx = await apiCall('transactions', 'update', updatedTxPayload);
                // Update the local transactions array
                transactions = transactions.map(t => t.id == linkedTx.id ? updatedTx : t);
            }
        }
        // --- END OF NEW LOGIC ---

        // Step 3: Refresh the entire UI
        makeStatements();
        renderTransactions(); // Re-render transactions to show the status change
        renderDebtors();
        renderCreditors();
        modals.settle.style.display = 'none';
        alert('Settlement recorded successfully!');

    } catch (error) {
        console.error("Error processing settlement:", error);
        alert('Failed to process settlement.');
    }
});


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
            const savedTransfer = await apiCall('transfers', 'insert', t);
            transfers.unshift(savedTransfer);
            makeStatements();
            this.reset();
            modals.transfer.style.display = 'none';
        } catch (error) {
            console.error("Error saving transfer:", error);
            alert('Failed to save transfer.');
        }
    });
}

function setupChartEventListeners() {
    // This handles clicks on the period tabs (7, 15, 30 days)
    document.querySelectorAll('.period-tab').forEach(tab => {
        tab.addEventListener('click', function(event) {
            // First, remove the 'active' class from all tabs
            document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
            // Then, add the 'active' class to the tab that was just clicked
            event.target.classList.add('active');
            // Finally, update the chart with the new period
            updateTrendChart();
        });
    });

    // This keeps the listener for the data type dropdown (Income vs Expenses, etc.)
    const chartDataType = document.getElementById('chartDataType');
    if (chartDataType) {
        chartDataType.addEventListener('change', updateTrendChart);
    }
}

// Your original init function, now called by the new logic
function init() {
    updatePaymentTypeOptions();
    setupTabEventListeners();
    setupChartEventListeners();
    // Your original rendering calls
    renderCategoryFilter();
    renderTransactions();
    renderExpenses();
    renderDebtors();
    renderCreditors();
    makeStatements();
    setupEventListeners();
    bindReceiptControls();
    setupProfileEventListeners();
    // Your original event listener setups
    // Add these lines inside the init() function
    const chartPeriod = document.getElementById('chartPeriod');
    if (chartPeriod) chartPeriod.addEventListener('change', updateTrendChart);
    const chartDataType = document.getElementById('chartDataType');
    if (chartDataType) chartDataType.addEventListener('change', updateTrendChart);

    // Close modal handlers with null checks
    const { transaction, expense, debtor, creditor, transfer, receipt, banks, settle, profile } = modals;
    [transaction, expense, debtor, creditor, transfer, receipt, banks, settle, profile].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }
    });

    // Close button handlers with null checks
    const closeBtns = document.querySelectorAll('.modal .close-btn');
    if (closeBtns) {
        closeBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    const modal = e.target.closest('.modal');
                    if (modal) modal.style.display = 'none';
                });
            }
        });
    }


}

// Profile management functions
function updateProfileDisplay() {
    const nameElement = document.getElementById('profileName');
    const imageElement = document.getElementById('profileImage');

    if (nameElement) {
        nameElement.textContent = profileData.name;
    }
    if (imageElement && profileData.image) {
        imageElement.src = profileData.image;
    }
}

function setupProfileEventListeners() {
    const profileHeader = document.querySelector('.top-header-center');
    const profileForm = document.getElementById('profileForm');
    const profileImageInput = document.getElementById('profileImageInput');

    if (profileHeader) {
        profileHeader.addEventListener('click', () => {
            // Populate form with current data
            document.getElementById('profileNameInput').value = profileData.name;
            document.getElementById('profilePhoneInput').value = profileData.phone;
            document.getElementById('profileEmailInput').value = profileData.email;
            document.getElementById('profileWebsiteInput').value = profileData.website;
            document.getElementById('profileAddressInput').value = profileData.address;
            showModal('profile');
        });
    }

    if (profileImageInput) {
        profileImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileData.image = e.target.result;
                    document.getElementById('profileImage').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const updatedProfile = {
                name: document.getElementById('profileNameInput').value,
                phone: document.getElementById('profilePhoneInput').value,
                email: document.getElementById('profileEmailInput').value,
                website: document.getElementById('profileWebsiteInput').value,
                address: document.getElementById('profileAddressInput').value,
                image: profileData.image
            };

            try {
                await apiCall('profile', 'insert', updatedProfile);
                profileData = updatedProfile;
                updateProfileDisplay();
                document.getElementById('profileModal').style.display = 'none';
                alert('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile. Please try again.');
            }
        });
    }
}

function getProfileData() {
    return profileData;
}

// =================================================================
// ADDED: Minimal implementations for missing functions
// =================================================================

function updateTrendChart() {
    const activePeriodTab = document.querySelector('.period-tab.active');
    const period = activePeriodTab ? parseInt(activePeriodTab.dataset.period) || 7 : 7;
    const chartCanvas = document.getElementById('trendChart');
    if (!chartCanvas) return;

    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }

    const ctx = chartCanvas.getContext('2d');
    const dataType = document.getElementById('chartDataType')?.value || 'income';

    const labels = [];
    const dataset1Data = [];
    const dataset2Data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = period - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));

        if (dataType === 'income') {
            let dayIncome = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    const inTotal = (tx.in_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    const outTotal = (tx.out_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    dayIncome += (inTotal - outTotal);
                }
            });
            let dayExpense = 0;
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    dayExpense += Number(ex.amount);
                }
            });
            dataset1Data.push(Math.max(0, dayIncome));
            dataset2Data.push(dayExpense);
        } else if (dataType === 'cash') {
            let cashIn = 0, cashOut = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    (tx.in_payments || []).forEach(p => {
                        if (p.type.toLowerCase() === 'cash') cashIn += Number(p.amount);
                    });
                    (tx.out_payments || []).forEach(p => {
                        if (p.type.toLowerCase() === 'cash') cashOut += Number(p.amount);
                    });
                }
            });
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    if ((ex.payment_type || '').toLowerCase() === 'cash') {
                        cashOut += Number(ex.amount);
                    }
                }
            });
            dataset1Data.push(cashIn);
            dataset2Data.push(cashOut);
        } else if (dataType === 'bank') {
            let bankIn = 0, bankOut = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    (tx.in_payments || []).forEach(p => {
                        if (p.type.toLowerCase() !== 'cash') bankIn += Number(p.amount);
                    });
                    (tx.out_payments || []).forEach(p => {
                        if (p.type.toLowerCase() !== 'cash') bankOut += Number(p.amount);
                    });
                }
            });
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    if ((ex.payment_type || '').toLowerCase() !== 'cash') {
                        bankOut += Number(ex.amount);
                    }
                }
            });
            dataset1Data.push(bankIn);
            dataset2Data.push(bankOut);
        } else if (dataType === 'profit') {
            let dayProfit = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    const inTotal = (tx.in_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    const outTotal = (tx.out_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    dayProfit += (inTotal - outTotal);
                }
            });
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    dayProfit -= Number(ex.amount);
                }
            });
            dataset1Data.push(dayProfit);
        }
    }

    

    // Create datasets based on data type
    let datasets;
    if (dataType === 'profit') {
        datasets = [{
            label: 'Profit',
            data: dataset1Data,
            borderColor: '#00bcd4',
            backgroundColor: 'rgba(0, 188, 212, 0.1)',
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
        }];
    } else {
        let label1, label2, color1, color2;
        if (dataType === 'income') {
            label1 = 'Income'; label2 = 'Expenses';
            color1 = '#4caf50'; color2 = '#f44336';
        } else if (dataType === 'cash') {
            label1 = 'Cash In'; label2 = 'Cash Out';
            color1 = '#2196f3'; color2 = '#ff9800';
        } else {
            label1 = 'Bank In'; label2 = 'Bank Out';
            color1 = '#9c27b0'; color2 = '#607d8b';
        }
        datasets = [{
            label: label1,
            data: dataset1Data,
            borderColor: color1,
            backgroundColor: color1.includes('rgba') ? color1 : color1.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
        }, {
            label: label2,
            data: dataset2Data,
            borderColor: color2,
            backgroundColor: color2.includes('rgba') ? color2 : color2.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
        }];
    }

    // Create the new chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1
                }
            }
        }
    });
}

function updateBankPieChart() {
    const chartCanvas = document.getElementById('bankPieChart');
    if (!chartCanvas) return;

    if (bankPieChart) {
        bankPieChart.destroy();
        bankPieChart = null;
    }

    const ctx = chartCanvas.getContext('2d');
    
    // Create a new object to hold the final balances.
    const finalBankBalances = {};

    // Loop through the 'bankStatements' object, which is already calculated by makeStatements().
    for (const bankName in bankStatements) {
        // Calculate the total balance for each bank from its existing statement entries.
        const balance = bankStatements[bankName].reduce((total, entry) => {
            return total + (Number(entry.in) || 0) - (Number(entry.out) || 0);
        }, 0);
        
        // Only add the bank to the chart if its balance is not zero.
        if (balance !== 0) {
            finalBankBalances[bankName] = balance;
        }
    }

    const labels = Object.keys(finalBankBalances);
    const data = Object.values(finalBankBalances);

    bankPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bank Balance',
                data: data,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
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
        .slice()
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.createdAt || 0))
        .reverse(); // Newest first

    tables.expensesBody.innerHTML = filteredExpenses.map(ex => {
        // Format date as DD/MM/YYYY
        let dateStr = '';
        if (ex.date) {
            const d = new Date(ex.date);
            dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
        const amount = Number(ex.amount) || 0;
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
        .filter(d => d.amount >= 0) // <-- Add this line
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((d, index) => {
            // ... the rest of the function remains the same ...
            let dateStr = '';
            if (d.date) {
                const dt = new Date(d.date);
                dateStr = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
            }
            const amount = Number(d.amount) || 0;
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

    document.querySelectorAll('#debtorsBody .settle-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const debtorId = this.getAttribute('data-id');
            openSettleModal('debtor', debtorId);
        });
    });
}

function renderCreditors() {
    const body = document.getElementById('creditorsBody');
    if (!body) return;
    const rowsHtml = (creditors || [])
        .filter(c => c.amount >= 0) // Only show positive amounts (original loans)
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((c) => {
            let dateStr = c.date ? new Date(c.date).toLocaleDateString('en-GB') : '';
            const amount = Number(c.amount) || 0;
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

    document.querySelectorAll('#creditorsBody .settle-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const creditorId = this.getAttribute('data-id');
            openSettleModal('creditor', creditorId);
        });
    });
}


forms.transaction.addEventListener('submit', async function (e) {
    e.preventDefault();
    const editingId = this.dataset.editingId;
    const received = document.getElementById('transReceived').checked;
    
    const localDateValue = document.getElementById('transDate').value;
    const properDate = new Date(localDateValue).toISOString();
    const inPayments = Array.from(document.querySelectorAll('#transInContainer .split-payment-row')).map(row => ({ amount: parseFloat(row.querySelector('.transInAmount').value) || 0, type: row.querySelector('.transInType').value })).filter(p => p.amount > 0);
    const outPayments = Array.from(document.querySelectorAll('#transOutContainer .split-payment-row')).map(row => ({ amount: parseFloat(row.querySelector('.transOutAmount').value) || 0, type: row.querySelector('.transOutType').value })).filter(p => p.amount > 0);
    
    const txData = {
        date: properDate,
        name: document.getElementById('transName').value,
        phone: document.getElementById('transPhone').value,
        description: document.getElementById('transDesc').value,
        status: received ? document.getElementById('transStatus').value : 'Pending', // Set status to 'Pending' if not received
        notes: document.getElementById('transNotes').value,
        items: Array.from(document.querySelectorAll('#txItemsContainer .tx-item-row')).map(r => ({ name: (r.querySelector('.txItemName')?.value || '').trim(), qty: parseInt(r.querySelector('.txItemQty')?.value || '1', 10) || 1, price: parseFloat(r.querySelector('.txItemPrice')?.value || '0') || 0 })).filter(it => it.name && it.qty > 0),
        in_payments: inPayments,
        out_payments: outPayments
    };

    try {
        let savedTx;
        if (editingId) {
            txData.id = editingId;
            savedTx = await apiCall('transactions', 'update', txData);
            const index = transactions.findIndex(t => t.id == editingId);
            if (index !== -1) transactions[index] = savedTx;
        } else {
            savedTx = await apiCall('transactions', 'insert', txData);
            transactions.unshift(savedTx);
        }

        // If not received, ALSO create a debtor record
        if (!received && !editingId) {
            const totalDebt = inPayments.reduce((sum, p) => sum + p.amount, 0);
            const debtor = {
                date: txData.date,
                name: txData.name,
                phone: txData.phone,
                amount: totalDebt,
                description: `From transaction: ${txData.description}`,
                status: 'Pending',
                transaction_id: savedTx.id
            };
            const newDebtor = await apiCall('debtors', 'insert', debtor);
            debtors.unshift(newDebtor);
            renderDebtors();
            alert('Transaction saved as Pending and added to Debtors.');
        }

        // Refresh UI
        renderTransactions();
        makeStatements();
        modals.transaction.style.display = 'none';
        resetTransactionForm();

    } catch (error) {
        console.error("Error saving transaction:", error);
        alert('Failed to save transaction.');
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
            await apiCall('transactions', 'delete', { id: txId });
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


// Replace the old showReceipt function with this new one
function showReceipt(type, data) {
    // Guard against missing data
    if (!data) return;

    // Helper function to set text content
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '';
    };

    // --- Client and Receipt Meta Info ---
    setText('receiptClientName', data.name || data.category || 'N/A');
    setText('receiptClientAddress', data.address || profileData.address || '');
    setText('receiptClientPhone', data.phone || '');
    const dateObj = data.date ? new Date(data.date) : new Date();
    setText('receiptDate', dateObj.toLocaleString());
    setText('receiptNo', (data.id ? String(data.id).slice(0, 8) : 'DW-' + (Math.floor(Math.random() * 9000) + 1000)));

    // --- NEW: Calculation Logic ---
    let itemsHtml = '';
    let billTotal = 0;
    let amountReceived = 0;

    if (type === 'transaction') {
        // Calculate the total bill from the items list
        if (Array.isArray(data.items) && data.items.length) {
            data.items.forEach((it, idx) => {
                const lineTotal = (Number(it.qty) || 1) * (Number(it.price) || 0);
                billTotal += lineTotal;
                // This now matches the new 5-column HTML table header
                itemsHtml += `<tr>
                    <td>${idx + 1}</td>
                    <td>${it.name || ''}</td>
                    <td>${it.qty || 1}</td>
                    <td>₹${(Number(it.price) || 0).toFixed(2)}</td>
                    <td>₹${lineTotal.toFixed(2)}</td>
                </tr>`;
            });
        } else {
             // Fallback if there are no items, use the transaction description
            const in_total = (data.in_payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            billTotal = in_total;
             itemsHtml += `<tr>
                <td>1</td>
                <td>${data.description || 'Service/Product'}</td>
                <td>1</td>
                <td>₹${billTotal.toFixed(2)}</td>
                <td>₹${billTotal.toFixed(2)}</td>
             </tr>`;
        }

        // Calculate the amount received from payments
        amountReceived = (data.in_payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    } else if (type === 'expense') {
        billTotal = Number(data.amount) || 0;
        amountReceived = billTotal; // For expenses, received is same as total
        itemsHtml += `<tr>
            <td>1</td>
            <td>${(data.category || 'Expense') + (data.item ? ': ' + data.item : '')}</td>
            <td>1</td>
            <td>₹${billTotal.toFixed(2)}</td>
            <td>₹${billTotal.toFixed(2)}</td>
        </tr>`;
    }

    const balanceDue = billTotal - amountReceived;

    // --- Update UI ---
    const itemsBody = document.getElementById('receiptItemsBody');
    if (itemsBody) itemsBody.innerHTML = itemsHtml;

    // Populate business details from profile
    setText('receiptBusinessName', profileData.name);
    setText('receiptBusinessPhone', profileData.phone);
    setText('receiptBusinessEmail', profileData.email);
    setText('receiptBusinessWebsite', profileData.website);
    setText('receiptBusinessAddress', profileData.address);

    const receiptLogo = document.getElementById('receiptLogo');
    if (receiptLogo && profileData.image) {
        receiptLogo.src = profileData.image;
    }

    // Populate the totals section
    setText('receiptSubTotal', `₹${billTotal.toFixed(2)}`);
    setText('receiptTaxes', `₹${(0).toFixed(2)}`);
    setText('receiptGrandTotal', `₹${billTotal.toFixed(2)}`);

    // Populate the NEW fields
    setText('receiptAmountReceived', `₹${amountReceived.toFixed(2)}`);
    setText('receiptBalanceDue', `₹${balanceDue.toFixed(2)}`);

    // Finally show the modal
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
    if (targetId === 'txItemsContainer') {
        const row = document.createElement('div');
        row.className = 'tx-item-row';
        row.innerHTML = `
            <input type="text" class="txItemName" placeholder="Item / Service">
            <input type="number" class="txItemQty" min="1" step="1" value="1" placeholder="Qty">
            <input type="number" class="txItemPrice" min="0" step="0.01" value="0" placeholder="Price (₹)">
            <button type="button" class="add-split-btn" data-target="txItemsContainer"><i class="fas fa-plus"></i></button>
        `;
        container.appendChild(row);
        return;
    }
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

// --- Settle Debt Logic ---
async function openSettleModal(type, id) {
    updatePaymentTypeOptions(); // Ensure payment options are fresh
    const item = type === 'debtor' ? debtors.find(d => d.id === id) : creditors.find(c => c.id === id);
    if (!item) return;

    document.getElementById('settleModalTitle').textContent = `Settle ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('settleName').textContent = item.name || '';
    document.getElementById('settleOriginalAmount').textContent = Number(item.amount).toFixed(2);
    document.getElementById('settleAmount').value = item.amount;
    document.getElementById('settlePaymentType').value = item.payment_type || 'Cash';
    document.getElementById('settleDescription').value = `Settlement for ${item.name}`;

    // Set settle date default to now
    document.getElementById('settleDate').value = new Date().toISOString().slice(0, 16);

    // Store type and id for the submit handler
    forms.settle.dataset.settleType = type;
    forms.settle.dataset.editingId = id;
    showModal('settle');
}
// =================================================================
// ADDED: Minimal implementations for missing functions
// =================================================================

function updateTrendChart() {
    const activePeriodTab = document.querySelector('.period-tab.active');
    const period = activePeriodTab ? parseInt(activePeriodTab.dataset.period) || 7 : 7;
    const chartCanvas = document.getElementById('trendChart');
    if (!chartCanvas) return;

    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }

    const ctx = chartCanvas.getContext('2d');
    const dataType = document.getElementById('chartDataType')?.value || 'income';

    const labels = [];
    const dataset1Data = [];
    const dataset2Data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = period - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));

        if (dataType === 'income') {
            let dayIncome = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    const inTotal = (tx.in_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    const outTotal = (tx.out_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    dayIncome += (inTotal - outTotal);
                }
            });
            let dayExpense = 0;
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    dayExpense += Number(ex.amount);
                }
            });
            dataset1Data.push(Math.max(0, dayIncome));
            dataset2Data.push(dayExpense);
        } else if (dataType === 'cash') {
            let cashIn = 0, cashOut = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    (tx.in_payments || []).forEach(p => {
                        if (p.type.toLowerCase() === 'cash') cashIn += Number(p.amount);
                    });
                    (tx.out_payments || []).forEach(p => {
                        if (p.type.toLowerCase() === 'cash') cashOut += Number(p.amount);
                    });
                }
            });
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    if ((ex.payment_type || '').toLowerCase() === 'cash') {
                        cashOut += Number(ex.amount);
                    }
                }
            });
            dataset1Data.push(cashIn);
            dataset2Data.push(cashOut);
        } else if (dataType === 'bank') {
            let bankIn = 0, bankOut = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    (tx.in_payments || []).forEach(p => {
                        if (p.type.toLowerCase() !== 'cash') bankIn += Number(p.amount);
                    });
                    (tx.out_payments || []).forEach(p => {
                        if (p.type.toLowerCase() !== 'cash') bankOut += Number(p.amount);
                    });
                }
            });
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    if ((ex.payment_type || '').toLowerCase() !== 'cash') {
                        bankOut += Number(ex.amount);
                    }
                }
            });
            dataset1Data.push(bankIn);
            dataset2Data.push(bankOut);
        } else if (dataType === 'profit') {
            let dayProfit = 0;
            transactions.forEach(tx => {
                if (new Date(tx.date).toDateString() === date.toDateString()) {
                    const inTotal = (tx.in_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    const outTotal = (tx.out_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    dayProfit += (inTotal - outTotal);
                }
            });
            expenses.forEach(ex => {
                if (new Date(ex.date).toDateString() === date.toDateString()) {
                    dayProfit -= Number(ex.amount);
                }
            });
            dataset1Data.push(dayProfit);
        }
    }

    // Create datasets based on data type
    let datasets;
    if (dataType === 'profit') {
        datasets = [{
            label: 'Profit',
            data: dataset1Data,
            borderColor: '#00bcd4',
            backgroundColor: 'rgba(0, 188, 212, 0.1)',
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
        }];
    } else {
        let label1, label2, color1, color2;
        if (dataType === 'income') {
            label1 = 'Income'; label2 = 'Expenses';
            color1 = '#4caf50'; color2 = '#f44336';
        } else if (dataType === 'cash') {
            label1 = 'Cash In'; label2 = 'Cash Out';
            color1 = '#2196f3'; color2 = '#ff9800';
        } else {
            label1 = 'Bank In'; label2 = 'Bank Out';
            color1 = '#9c27b0'; color2 = '#607d8b';
        }
        datasets = [{
            label: label1,
            data: dataset1Data,
            borderColor: color1,
            backgroundColor: color1.includes('rgba') ? color1 : color1.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
        }, {
            label: label2,
            data: dataset2Data,
            borderColor: color2,
            backgroundColor: color2.includes('rgba') ? color2 : color2.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
        }];
    }

    // Create the new chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1
                }
            }
        }
    });
}

function updateBankPieChart() {
    const chartCanvas = document.getElementById('bankPieChart');
    if (!chartCanvas) return;

    // Destroy existing chart if it exists
    if (bankPieChart) {
        bankPieChart.destroy();
        bankPieChart = null;
    }

    const ctx = chartCanvas.getContext('2d');
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
        .slice()
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.createdAt || 0))
        .reverse(); // Newest first

    tables.expensesBody.innerHTML = filteredExpenses.map(ex => {
        // Format date as DD/MM/YYYY
        let dateStr = '';
        if (ex.date) {
            const d = new Date(ex.date);
            dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
        const amount = Number(ex.amount) || 0;
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
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.createdAt || 0))
        .reverse() // Newest first
        .map((d, index) => {
            // Format date as DD/MM/YYYY
            let dateStr = '';
            if (d.date) {
                const dt = new Date(d.date);
                dateStr = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
            }
            const amount = Number(d.amount) || 0;
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
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.createdAt || 0))
        .reverse() // Newest first
        .map((c, index) => {
            // Format date as DD/MM/YYYY
            let dateStr = '';
            if (c.date) {
                const dt = new Date(c.date);
                dateStr = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
            }
            const amount = Number(c.amount) || 0;
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

// Debtors and Creditors settle modal reset
function resetSettleForm() {
    const form = forms.settle;
    if (!form) return;
    form.reset();
    document.getElementById('settleName').textContent = '';
    document.getElementById('settleOriginalAmount').textContent = '0.00';
    document.getElementById('settleAmount').value = '';
    document.getElementById('settlePaymentType').value = 'Cash';
    document.getElementById('settleDescription').value = '';
}

// Settlement logic (moved from form submit for clarity)
async function settleItem(type, id) {
    const item = type === 'debtor' ? debtors.find(d => d.id === id) : creditors.find(c => c.id === id);
    if (!item) return;

    const settleData = {
        ...item,
        date: document.getElementById('settleDate').value,
        amount: parseFloat(document.getElementById('settleAmount').value) || 0,
        payment_type: document.getElementById('settlePaymentType').value,
        description: document.getElementById('settleDescription').value,
        status: 'Settled'
    };

    try {
        await apiCall((type === 'debtor' ? 'debtors' : 'creditors'), 'update', settleData);
        if (type === 'debtor') {
            debtors = debtors.map(d => d.id === id ? settleData : d);
        } else {
            creditors = creditors.map(c => c.id === id ? settleData : c);
        }
        renderDebtors();
        renderCreditors();
        makeStatements();
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} settled successfully.`);
    } catch (error) {
        console.error("Error settling:", error);
        alert('Failed to settle. Please try again.');
    }
}

function makeStatements() {
    // ... function starts the same way with totalIncome, totalExpenses etc. ...
    let totalIncome = 0;
    let totalExpenses = 0;
    cashStatements = [];
    bankStatements = {};

    const allBankNames = new Set(banks.filter(b => b && b.toLowerCase() !== 'cash' && b !== 'Bank (Generic)'));
    allBankNames.forEach(bankName => { bankStatements[bankName] = []; });

    // Handles Transactions, Expenses...
    // (The code for Transactions and Expenses remains the same)

    // ... The existing code for transactions ...
    (transactions || []).forEach(tx => {
        const inTotal = (tx.in_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
        const outTotal = (tx.out_payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

        // --- THIS IS THE FIX ---
        // Only count income if the transaction status is NOT 'Pending'
         if (tx.status !== 'Pending') {
            totalIncome += (inTotal - outTotal);
        }

        // For the detailed statements:
        // Only process "in_payments" if status is not 'Pending'
        if (tx.status !== 'Pending') {
            (tx.in_payments || []).forEach(p => {
                const entry = { date: tx.date, description: tx.description || tx.name, in: Number(p.amount), out: 0 };
                if (p.type.toLowerCase() === 'cash') cashStatements.push(entry);
                else {
                    if (!bankStatements[p.type]) bankStatements[p.type] = [];
                    bankStatements[p.type].push(entry);
                }
            });
        }
        
        // ALWAYS process "out_payments" because you spent that money
        (tx.out_payments || []).forEach(p => {
            const entry = { date: tx.date, description: tx.description || tx.name, in: 0, out: Number(p.amount) };
            if (p.type.toLowerCase() === 'cash') cashStatements.push(entry);
            else {
                if (!bankStatements[p.type]) bankStatements[p.type] = [];
                bankStatements[p.type].push(entry);
            }
        });
    });
    // ... The code for expenses ...
     (expenses || []).forEach(ex => {
        totalExpenses += Number(ex.amount) || 0;
        (ex.split_payments || [{ amount: ex.amount, type: ex.payment_type }]).forEach(p => {
            const entry = { date: ex.date, description: ex.item || ex.category, in: 0, out: Number(p.amount) };
            if (p.type.toLowerCase() === 'cash') cashStatements.push(entry);
            else {
                if (!bankStatements[p.type]) bankStatements[p.type] = [];
                bankStatements[p.type].push(entry);
            }
        });
    });


    // 3. Creditors Logic (Corrected)
    (creditors || []).forEach(cr => {
        const amount = Number(cr.amount) || 0;
        const paymentType = cr.payment_type || 'Cash';

        if (amount > 0) {
            // Positive amount is a loan taken (money IN)
            const description = cr.description ? `${cr.name} (${cr.description})` : `${cr.name} (Loan Taken)`;
            const inEntry = { date: cr.date, description: description, in: amount, out: 0 };
            
            if (paymentType.toLowerCase() === 'cash') {
                cashStatements.push(inEntry);
            } else if (bankStatements[paymentType]) {
                bankStatements[paymentType].push(inEntry);
            }
        } else if (amount < 0) {
            // Negative amount is a settlement (money OUT), using its own date
            const outEntry = { date: cr.date, description: cr.description, in: 0, out: Math.abs(amount) };

            if (paymentType.toLowerCase() === 'cash') {
                cashStatements.push(outEntry);
            } else if (bankStatements[paymentType]) {
                bankStatements[paymentType].push(outEntry);
            }
        }
    });

    // 4. Debtors Logic (Final Corrected Version)
    (debtors || []).forEach(db => {
        const amount = Number(db.amount) || 0;
        const paymentType = db.payment_type || 'Cash';

        if (amount > 0) {
            // This is a loan. We ONLY create an 'Out' entry if it's a DIRECT loan
            // (i.e., it is NOT linked to a transaction).
            if (!db.transaction_id) {
                const description = db.description ? `${db.name} (${db.description})` : `${db.name} (Loan Given)`;
                const outEntry = {
                    date: db.date,
                    description: description,
                    in: 0,
                    out: amount
                };
                
                if (paymentType.toLowerCase() === 'cash') {
                    cashStatements.push(outEntry);
                } else if (bankStatements[paymentType]) {
                    bankStatements[paymentType].push(outEntry);
                }
            }
            // If the debtor IS linked to a transaction, we do nothing here.
            // This prevents the incorrect deduction you were seeing.

        } else if (amount < 0) {
            // This is a repayment (money IN). This logic is correct.
            const inEntry = { 
                date: db.date, 
                description: db.description || `Repayment from ${db.name}`, 
                in: Math.abs(amount), 
                out: 0 
            };

            if (paymentType.toLowerCase() === 'cash') {
                cashStatements.push(inEntry);
            } else if (bankStatements[paymentType]) {
                bankStatements[paymentType].push(inEntry);
            }
        }
    });

    // ... (The code for Transfers and UI updates remains the same) ...
     (transfers || []).forEach(tr => {
        const amount = Number(tr.amount) || 0;
        if (amount <= 0) return; // Ignore transfers with no amount

        const fromAccount = tr.from;
        const outEntry = { date: tr.date, description: `Transfer to ${tr.to}`, in: 0, out: amount };
        if (fromAccount) {
            if (fromAccount.toLowerCase() === 'cash') {
                cashStatements.push(outEntry);
            } else if (bankStatements[fromAccount]) {
                bankStatements[fromAccount].push(outEntry);
            }
        }

        const toAccount = tr.to;
        const inEntry = { date: tr.date, description: `Transfer from ${tr.from}`, in: amount, out: 0 };
        if (toAccount) {
            if (toAccount.toLowerCase() === 'cash') {
                cashStatements.push(inEntry);
            } else if (bankStatements[toAccount]) {
                bankStatements[toAccount].push(inEntry);
            }
        }
    });


    // Update UI
    stats.income.textContent = totalIncome.toFixed(2);
    stats.expenses.textContent = totalExpenses.toFixed(2);
    stats.profit.textContent = (totalIncome - totalExpenses).toFixed(2);

    renderAllStatements(allBankNames);
    updateTrendChart();
    updateBankPieChart();
}
function renderAllStatements(allBankNames) {
    // --- कैश स्टेटमेंट को रेंडर करें ---
    cashStatements.sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningCash = 0;
    const cashRows = cashStatements.map(entry => {
        runningCash += (Number(entry.in) || 0) - (Number(entry.out) || 0);
        const d = new Date(entry.date);
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        return `<tr>
            <td>${dateStr}</td>
            <td>${entry.description || ''}</td>
            <td>₹${(Number(entry.in) || 0).toFixed(2)}</td>
            <td>₹${(Number(entry.out) || 0).toFixed(2)}</td>
            <td>₹${runningCash.toFixed(2)}</td>
        </tr>`;
    }).join('');
    
    if (tables.cashStatementBody) tables.cashStatementBody.innerHTML = cashRows;
    if (stats.cash) stats.cash.textContent = runningCash.toFixed(2);
    const cashBalanceElem = document.getElementById('cashBalanceCash');
    if (cashBalanceElem) cashBalanceElem.textContent = runningCash.toFixed(2);

    // --- बैंक बैलेंस की लिस्ट को रेंडर करें ---
    const bankBalancesElem = document.getElementById('bankBalances');
    let totalBankBalance = 0;
    if (bankBalancesElem) {
        const bankItems = Array.from(allBankNames).sort().map(bankName => {
            const statements = bankStatements[bankName] || [];
            const balance = statements.reduce((bal, entry) => bal + (Number(entry.in) || 0) - (Number(entry.out) || 0), 0);
            totalBankBalance += balance;
            return `<div class="bank-balance-item" data-bank="${bankName}" style="cursor:pointer; padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                        <span>${bankName}</span>
                        <span>₹${balance.toFixed(2)}</span>
                    </div>`;
        }).join('');
        bankBalancesElem.innerHTML = bankItems || '<p>No bank accounts found.</p>';

        // ▼▼▼ यह महत्वपूर्ण हिस्सा जोड़ा गया है ▼▼▼
        // बैंक लिस्ट पर क्लिक इवेंट लिस्नर लगाएँ
        bankBalancesElem.onclick = (e) => {
            const item = e.target.closest('[data-bank]');
            if (item) {
                const bankName = item.getAttribute('data-bank');
                renderBankStatement(bankName);
            }
        };
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }

    if (stats.bank) stats.bank.textContent = totalBankBalance.toFixed(2);
}


function renderBankStatement(bankName) {
    const selectedNameElem = document.getElementById('selectedBankName');
    if (selectedNameElem) selectedNameElem.textContent = bankName || 'None';
    const container = document.getElementById('bankStatementTableContainer');
    if (!container) return;
    // Custom sort: date desc, then in>0 before out>0 (for display), but for balance calculation, sort oldest to newest, in>0 before out>0
    const entries = (bankStatements[bankName] || []).slice();

    // For balance calculation: oldest to newest, in>0 before out>0
    const balanceCalcEntries = entries.slice().sort((a, b) => {
        const da = new Date(a.date || 0);
        const db = new Date(b.date || 0);
        if (da - db !== 0) return da - db;
        // Same date: in>0 before out>0
        if ((b.in > 0 ? 1 : 0) - (a.in > 0 ? 1 : 0) !== 0) return (a.in > 0 ? -1 : 1);
        if ((a.out > 0 ? 1 : 0) - (b.out > 0 ? 1 : 0) !== 0) return (a.out > 0 ? 1 : -1);
        return 0;
    });

    // Calculate running balances in display order (newest first)
    let running = 0;
    const balancesMap = new Map();
    balanceCalcEntries.forEach(en => {
        running += Number(en.in) - Number(en.out);
        // Use a unique key: date+desc+in+out (to handle duplicate times)
        const key = `${en.date}|${en.description}|${en.in}|${en.out}`;
        balancesMap.set(key, running);
    });

    // For display: newest first, in>0 before out>0
    const displayEntries = entries.slice().sort((a, b) => {
        const da = new Date(a.date || 0);
        const db = new Date(b.date || 0);
        if (db - da !== 0) return db - da;
        // Same date: in>0 before out>0 (so out comes above in)
        if ((a.in > 0 ? 1 : 0) - (b.in > 0 ? 1 : 0) !== 0) return (a.in > 0 ? 1 : -1);
        if ((b.out > 0 ? 1 : 0) - (a.out > 0 ? 1 : 0) !== 0) return (a.out > 0 ? -1 : 1);
        return 0;
    });

    const rows = displayEntries.map(en => {
        // Format date as DD/MM/YYYY
        let dateStr = '';
        if (en.date) {
            const d = new Date(en.date);
            dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
        // Use same key as above
        const key = `${en.date}|${en.description}|${en.in}|${en.out}`;
        const bal = balancesMap.get(key) ?? 0;
        return `<tr>
            <td>${dateStr}</td>
            <td>${en.description || ''}</td>
            <td>₹${(Number(en.in) || 0).toFixed(2)}</td>
            <td>₹${(Number(en.out) || 0).toFixed(2)}</td>
            <td>₹${bal.toFixed(2)}</td>
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
    updatePaymentTypeOptions(); // Ensure payment options are fresh
    const item = type === 'debtor' ? debtors.find(d => d.id === id) : creditors.find(c => c.id === id);
    if (!item) return;

    document.getElementById('settleModalTitle').textContent = `Settle ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('settleName').textContent = item.name || '';
    document.getElementById('settleOriginalAmount').textContent = Number(item.amount).toFixed(2);
    document.getElementById('settleAmount').value = item.amount;
    document.getElementById('settlePaymentType').value = item.payment_type || 'Cash';
    document.getElementById('settleDescription').value = `Settlement for ${item.name}`;

    // Set settle date default to now
    document.getElementById('settleDate').value = new Date().toISOString().slice(0, 16);

    // Store type and id for the submit handler
    forms.settle.dataset.settleType = type;
    forms.settle.dataset.editingId = id;
    showModal('settle');
}



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