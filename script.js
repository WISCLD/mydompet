// @ts-nocheck

// 1. DATA DAN PENYIMPANAN
let transactions = JSON.parse(localStorage.getItem("dompetku_transactions") || "[]");
let currentSavings = Number(localStorage.getItem("dompetku_savings")) || 0;
const TARGET_SAVINGS = 15000000;
let currentType = "income";
let selectedCategory = "ALL";

// 2. ELEMENT HTML
const balanceAmount = document.getElementById("balanceAmount");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const transactionList = document.getElementById("transactionList");
const currentDateEl = document.getElementById("currentDate");
const filterCategory = document.getElementById("filterCategory");
const categorySummaryList = document.getElementById("categorySummaryList");

const homeView = document.getElementById("homeView");
const savingsSection = document.getElementById("savingsSection");
const transactionSection = document.getElementById("transactionSection");
const navButtons = document.querySelectorAll(".bottom-nav .nav-item[data-nav]");

const modal = document.getElementById("transactionModal");
const modalTitle = document.getElementById("modalTitle");
const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const closeModalButton = document.getElementById("closeModal");

const btnTabungan = document.getElementById("btnTabungan");
const savingsModal = document.getElementById("savingsModal");
const savingsForm = document.getElementById("savingsForm");
const savingsInput = document.getElementById("savingsInput");
const withdrawSavingsBtn = document.getElementById("withdrawSavingsBtn");
const closeSavingsModal = document.getElementById("closeSavingsModal");
const savingsProgress = document.getElementById("savingsProgress");
const savedAmountText = document.getElementById("savedAmountText");

// 3. FORMAT RUPIAH & TANGGAL
function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(amount);
}

function setHeaderDate() {
    if (!currentDateEl) return;
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// 4. NAVIGASI BAWAH
function setActiveTab(tab) {
    navButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-nav") === tab);
    });

    if (tab === "home") {
        homeView?.classList.remove("hidden");
        savingsSection?.classList.remove("hidden");
        transactionSection?.classList.remove("hidden");
    } else if (tab === "transactions") {
        homeView?.classList.add("hidden");
        savingsSection?.classList.add("hidden");
        transactionSection?.classList.remove("hidden");
    } else if (tab === "savings") {
        homeView?.classList.add("hidden");
        transactionSection?.classList.add("hidden");
        savingsSection?.classList.remove("hidden");
    }
}

navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const nav = btn.getAttribute("data-nav");
        if (nav === "home" || nav === "transactions" || nav === "savings") {
            setActiveTab(nav);
        }
    });
});

// 5. SIMPAN & HITUNG DATA
function saveData() {
    localStorage.setItem("dompetku_transactions", JSON.stringify(transactions));
    localStorage.setItem("dompetku_savings", currentSavings.toString());
}

function calculateIncome() {
    return transactions
        .filter((item) => item.type === "income")
        .reduce((total, item) => total + item.amount, 0);
}

function calculateExpense() {
    return transactions
        .filter((item) => item.type === "expense")
        .reduce((total, item) => total + item.amount, 0);
}

function updateDashboard() {
    const income = calculateIncome();
    const expense = calculateExpense();
    const balance = income - expense - currentSavings;

    if (balanceAmount) balanceAmount.textContent = formatRupiah(balance);
    if (totalIncome) totalIncome.textContent = formatRupiah(income);
    if (totalExpense) totalExpense.textContent = formatRupiah(expense);

    if (savedAmountText) savedAmountText.textContent = `${formatRupiah(currentSavings)} terkumpul`;
    if (savingsProgress) {
        const percentage = Math.min((currentSavings / TARGET_SAVINGS) * 100, 100);
        savingsProgress.style.width = `${percentage}%`;
    }

    renderCategorySummary();
}

// 6. EVENT LISTENER MODAL TRANSAKSI
document.querySelectorAll(".menu-item[data-action]").forEach((item) => {
    item.addEventListener("click", () => {
        const action = item.getAttribute("data-action");
        if (action === "income" || action === "expense") {
            currentType = action;
            if (modalTitle) {
                modalTitle.textContent = currentType === "income" ? "Tambah Pemasukan" : "Tambah Pengeluaran";
            }
            transactionForm?.reset();
            modal?.classList.add("show");
            descriptionInput?.focus();
        }
    });
});

closeModalButton?.addEventListener("click", () => modal?.classList.remove("show"));

transactionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;

    if (!description || !category || amount <= 0) return;

    transactions.unshift({
        id: Date.now().toString(),
        description,
        amount,
        category,
        type: currentType,
        date: new Date().toISOString()
    });

    saveData();
    updateDashboard();
    renderTransactions();
    modal?.classList.remove("show");
});

// 7. EVENT LISTENER MODAL TABUNGAN
btnTabungan?.addEventListener("click", () => {
    savingsForm?.reset();
    savingsModal?.classList.add("show");
    savingsInput?.focus();
});

closeSavingsModal?.addEventListener("click", () => savingsModal?.classList.remove("show"));

savingsForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Number(savingsInput.value);
    const availableBalance = calculateIncome() - calculateExpense() - currentSavings;

    if (amount <= 0) return;

    if (amount > availableBalance) {
        alert("Saldo utama kamu tidak cukup untuk nominal tabungan ini!");
        return;
    }

    currentSavings += amount;
    saveData();
    updateDashboard();
    savingsModal?.classList.remove("show");
});

withdrawSavingsBtn?.addEventListener("click", () => {
    const amount = Number(savingsInput?.value || 0);
    if (amount <= 0) {
        alert("Masukkan nominal tabungan yang ingin ditarik dulu di kolom atas.");
        savingsInput?.focus();
        return;
    }

    if (amount > currentSavings) {
        alert("Nominal penarikan melebihi tabungan yang terkumpul!");
        return;
    }

    currentSavings -= amount;
    saveData();
    updateDashboard();
    savingsModal?.classList.remove("show");
});

// 8. FILTER & TAMPILKAN RIWAYAT TRANSAKSI
filterCategory?.addEventListener("change", () => {
    selectedCategory = filterCategory.value;
    renderTransactions();
});

function renderTransactions() {
    if (!transactionList) return;
    transactionList.innerHTML = "";

    const filteredTransactions = selectedCategory === "ALL"
        ? transactions
        : transactions.filter((item) => item.category === selectedCategory);

    if (filteredTransactions.length === 0) {
        const emptyMessage = selectedCategory === "ALL"
            ? "Belum ada transaksi."
            : `Belum ada transaksi di kategori ${selectedCategory}.`;
        transactionList.innerHTML = `<div class="transaction-item"><p class="text-muted">${emptyMessage}</p></div>`;
        return;
    }

    filteredTransactions.forEach((item) => {
        const isIncome = item.type === "income";
        const formattedDate = new Date(item.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        const element = document.createElement("div");
        element.className = "transaction-item";

        const details = document.createElement("div");
        details.className = "transaction-details";

        const title = document.createElement("strong");
        title.textContent = item.description;

        const meta = document.createElement("small");
        meta.textContent = `${item.category} • ${formattedDate}`;

        details.append(title, meta);

        const right = document.createElement("div");
        right.className = "transaction-right";

        const amountEl = document.createElement("strong");
        amountEl.className = isIncome ? "income" : "expense";
        amountEl.textContent = `${isIncome ? "+" : "-"}${formatRupiah(item.amount)}`;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-transaction";
        deleteBtn.textContent = "Hapus";
        deleteBtn.addEventListener("click", () => deleteTransaction(item.id));

        right.append(amountEl, deleteBtn);
        element.append(details, right);
        transactionList.appendChild(element);
    });
}

function deleteTransaction(id) {
    if (!confirm("Yakin mau hapus transaksi ini?")) return;
    transactions = transactions.filter((item) => item.id !== id);
    saveData();
    updateDashboard();
    renderTransactions();
}

function renderCategorySummary() {
    if (!categorySummaryList) return;

    const expenseByCategory = transactions
        .filter((item) => item.type === "expense")
        .reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});

    const entries = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

    categorySummaryList.innerHTML = "";

    if (entries.length === 0) {
        categorySummaryList.innerHTML = `
            <div class="transaction-item">
                <p class="text-muted">Belum ada pengeluaran.</p>
            </div>
        `;
        return;
    }

    entries.forEach(([category, total]) => {
        const row = document.createElement("div");
        row.className = "category-summary-item";

        const label = document.createElement("span");
        label.textContent = category;

        const value = document.createElement("strong");
        value.textContent = formatRupiah(total);

        row.append(label, value);
        categorySummaryList.appendChild(row);
    });
}

// 9. DAFTARKAN SERVICE WORKER (PWA OFFLINE)
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => console.log("Service Worker terdaftar!"))
            .catch((err) => console.error("Gagal daftar SW:", err));
    });
}

// 10. JALANKAN APLIKASI
setHeaderDate();
updateDashboard();
renderTransactions();
