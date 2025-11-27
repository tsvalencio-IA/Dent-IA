// ==================================================================
// MÓDULO FINANCEIRO & ESTOQUE
// ==================================================================
(function() {
    const App = window.DentistaApp;

    window.renderFinancialManager = function() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <h2 class="text-2xl font-bold text-indigo-800 mb-4">Financeiro & Estoque</h2>
                <div class="flex border-b mb-4">
                    <button class="p-3 font-bold text-indigo-700" onclick="window.renderStockList()">📦 Estoque</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600" onclick="window.renderReceivablesList()">💰 Receitas</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600" onclick="window.renderExpensesList()">💸 Despesas</button>
                </div>
                <div id="fin-content-area"></div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        window.renderStockList();
    };

    window.renderStockList = function() {
        document.getElementById('fin-content-area').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Inventário</h3><button onclick="openStockModal()" class="bg-green-600 text-white px-3 py-1 rounded text-sm">+ Item</button></div>
            <table class="w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="p-2">Item</th><th class="p-2">Qtd</th><th class="p-2">Ação</th></tr></thead><tbody id="stock-tb"></tbody></table>`;
        const tb = document.getElementById('stock-tb');
        App.data.stock.forEach(i => {
            tb.innerHTML += `<tr class="border-b"><td class="p-2">${i.name}</td><td class="p-2">${i.quantity} ${i.unit}</td><td class="p-2"><button onclick="deleteStock('${i.id}')" class="text-red-500"><i class='bx bx-trash'></i></button></td></tr>`;
        });
    };

    window.renderReceivablesList = function() {
        document.getElementById('fin-content-area').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Receitas</h3><button onclick="openRecModal()" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm">+ Serviço</button></div>
            <div id="rec-list" class="space-y-2"></div>`;
        const list = document.getElementById('rec-list');
        App.data.receivables.forEach(r => {
            list.innerHTML += `<div class="p-3 border rounded flex justify-between items-center"><div><span class="font-bold">${r.patientName}</span><br><span class="text-xs text-gray-500">${r.description}</span></div><div class="text-right"><span class="font-bold text-green-600">${App.utils.formatCurrency(r.amount)}</span><br><span class="text-xs bg-gray-100 px-1 rounded">${r.status}</span></div></div>`;
        });
    };

    window.renderExpensesList = function() {
        document.getElementById('fin-content-area').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Despesas</h3><button onclick="openExpModal()" class="bg-red-600 text-white px-3 py-1 rounded text-sm">+ Despesa</button></div>
            <div id="exp-list" class="space-y-2"></div>`;
        const list = document.getElementById('exp-list');
        App.data.expenses.forEach(e => {
            list.innerHTML += `<div class="p-3 border rounded flex justify-between items-center"><div><span class="font-bold">${e.supplier}</span><br><span class="text-xs text-gray-500">${e.description}</span></div><div class="text-right"><span class="font-bold text-red-600">${App.utils.formatCurrency(e.amount)}</span><br><span class="text-xs bg-gray-100 px-1 rounded">${e.status}</span></div></div>`;
        });
    };

    // Modais Financeiros (Simplificados para caber, mas funcionais)
    window.openStockModal = function() {
        const html = `<form id="st-form" class="grid gap-2"><input id="s-n" placeholder="Nome" class="border p-2"><input id="s-q" placeholder="Qtd" type="number" class="border p-2"><input id="s-u" placeholder="Un" class="border p-2"><button class="bg-green-600 text-white p-2">Salvar</button></form>`;
        App.utils.openModal("Novo Item", html);
        document.getElementById('st-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({
                name: document.getElementById('s-n').value, quantity: parseFloat(document.getElementById('s-q').value), unit: document.getElementById('s-u').value, cost: 0
            });
            App.utils.closeModal();
        };
    };

    window.openRecModal = function() {
        const opts = App.data.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        const html = `<form id="rec-form" class="grid gap-2"><select id="r-p" class="border p-2">${opts}</select><input id="r-d" placeholder="Descrição" class="border p-2"><input id="r-v" placeholder="Valor" type="number" class="border p-2"><button class="bg-indigo-600 text-white p-2">Salvar</button></form>`;
        App.utils.openModal("Nova Receita", html);
        document.getElementById('rec-form').onsubmit = (e) => {
            e.preventDefault();
            const pid = document.getElementById('r-p').value;
            const p = App.data.patients.find(x => x.id === pid);
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/receivable')).push({
                patientId: pid, patientName: p.name, description: document.getElementById('r-d').value, amount: parseFloat(document.getElementById('r-v').value), status: 'Aberto'
            });
            App.utils.closeModal();
        };
    };

    window.openExpModal = function() {
        const html = `<form id="exp-form" class="grid gap-2"><input id="e-s" placeholder="Fornecedor" class="border p-2"><input id="e-d" placeholder="Descrição" class="border p-2"><input id="e-v" placeholder="Valor" type="number" class="border p-2"><button class="bg-red-600 text-white p-2">Salvar</button></form>`;
        App.utils.openModal("Nova Despesa", html);
        document.getElementById('exp-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/expenses')).push({
                supplier: document.getElementById('e-s').value, description: document.getElementById('e-d').value, amount: parseFloat(document.getElementById('e-v').value), status: 'Aberto'
            });
            App.utils.closeModal();
        };
    };
    
    window.deleteStock = (id) => { if(confirm("Apagar?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock/'+id)).remove(); };

})();
