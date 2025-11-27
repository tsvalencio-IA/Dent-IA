(function() {
    const App = window.DentistaApp;

    window.renderFinancialManager = function() {
        document.getElementById('main-content').innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <h2 class="text-2xl font-bold text-indigo-800 mb-4">Financeiro</h2>
                <div class="flex border-b mb-4"><button class="p-3 font-bold text-indigo-700" onclick="window.renderStockList()">📦 Estoque</button><button class="p-3 text-gray-500" onclick="window.renderReceivablesList()">💰 Receitas</button><button class="p-3 text-gray-500" onclick="window.renderExpensesList()">💸 Despesas</button></div>
                <div id="fin-content"></div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        window.renderStockList();
    };

    window.renderStockList = function() {
        document.getElementById('fin-content').innerHTML = `<div class="flex justify-between mb-3"><h3 class="font-bold">Inventário</h3><button onclick="window.openStockModal()" class="bg-green-600 text-white px-3 py-1 rounded text-sm">+ Item</button></div><table class="w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="p-2">Item</th><th class="p-2">Qtd</th><th class="p-2">Ação</th></tr></thead><tbody id="stock-tb"></tbody></table>`;
        const tb = document.getElementById('stock-tb');
        App.data.stock.forEach(i => tb.innerHTML += `<tr class="border-b"><td class="p-2">${i.name}</td><td class="p-2">${i.quantity} ${i.unit}</td><td class="p-2"><button onclick="window.delItem('stock','${i.id}')" class="text-red-500"><i class='bx bx-trash'></i></button></td></tr>`);
    };

    window.renderReceivablesList = function() {
        document.getElementById('fin-content').innerHTML = `<div class="flex justify-between mb-3"><h3 class="font-bold">Receitas</h3><button onclick="window.openRecModal()" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm">+ Serviço</button></div><div id="rec-list" class="space-y-2"></div>`;
        const list = document.getElementById('rec-list');
        App.data.receivables.forEach(r => {
            const btn = r.status === 'Recebido' ? '' : `<button onclick="window.settle('receivable','${r.id}')" class="bg-green-500 text-white px-2 rounded text-xs ml-2">Receber</button>`;
            list.innerHTML += `<div class="p-3 border rounded flex justify-between items-center"><div><span class="font-bold">${r.patientName}</span><br><span class="text-xs">${r.description}</span></div><div class="text-right"><span class="font-bold text-green-600">${App.utils.formatCurrency(r.amount)}</span>${btn}<button onclick="window.delItem('finance/receivable','${r.id}')" class="text-red-400 ml-2"><i class='bx bx-trash'></i></button></div></div>`;
        });
    };

    window.renderExpensesList = function() {
        document.getElementById('fin-content').innerHTML = `<div class="flex justify-between mb-3"><h3 class="font-bold">Despesas</h3><button onclick="window.openExpModal()" class="bg-red-600 text-white px-3 py-1 rounded text-sm">+ NF</button></div><div id="exp-list" class="space-y-2"></div>`;
        const list = document.getElementById('exp-list');
        App.data.expenses.forEach(e => {
            const btn = e.status === 'Pago' ? '' : `<button onclick="window.settle('expenses','${e.id}')" class="bg-blue-500 text-white px-2 rounded text-xs ml-2">Pagar</button>`;
            list.innerHTML += `<div class="p-3 border rounded flex justify-between items-center"><div><span class="font-bold">${e.supplier}</span><br><span class="text-xs">${e.description}</span></div><div class="text-right"><span class="font-bold text-red-600">${App.utils.formatCurrency(e.amount)}</span><button onclick="window.manageItems('${e.id}')" class="text-gray-500 ml-2"><i class='bx bx-cart'></i></button>${btn}<button onclick="window.delItem('finance/expenses','${e.id}')" class="text-red-400 ml-2"><i class='bx bx-trash'></i></button></div></div>`;
        });
    };

    window.openStockModal = () => {
        const html = `<form id="st-form" class="grid gap-2 text-sm"><input id="s-n" placeholder="Nome" class="border p-2 rounded" required><input id="s-q" type="number" placeholder="Qtd" class="border p-2 rounded" required><input id="s-u" placeholder="Un" class="border p-2 rounded" required><button class="bg-green-600 text-white p-2 rounded font-bold">Salvar</button></form>`;
        App.utils.openModal("Novo Item", html);
        document.getElementById('st-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({ name: document.getElementById('s-n').value, quantity: parseFloat(document.getElementById('s-q').value), unit: document.getElementById('s-u').value, cost: 0 });
            App.utils.closeModal();
        };
    };

    window.openRecModal = () => {
        const opts = App.data.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        const html = `<form id="rec-form" class="grid gap-2 text-sm"><select id="r-p" class="border p-2 rounded">${opts}</select><input id="r-d" placeholder="Descrição" class="border p-2 rounded"><input id="r-v" type="number" class="border p-2 rounded"><button class="bg-indigo-600 text-white p-2 rounded">Salvar</button></form>`;
        App.utils.openModal("Novo Serviço", html);
        document.getElementById('rec-form').onsubmit = (e) => {
            e.preventDefault();
            const pid = document.getElementById('r-p').value;
            const p = App.data.patients.find(x => x.id === pid);
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/receivable')).push({ patientId: pid, patientName: p.name, description: document.getElementById('r-d').value, amount: parseFloat(document.getElementById('r-v').value), status: 'Aberto' });
            App.utils.closeModal();
        };
    };

    window.openExpModal = () => {
        const html = `<form id="ex-form" class="grid gap-2 text-sm"><input id="e-s" placeholder="Fornecedor" class="border p-2 rounded"><input id="e-d" placeholder="Descrição" class="border p-2 rounded"><input id="e-v" type="number" class="border p-2 rounded"><button class="bg-red-600 text-white p-2 rounded">Salvar</button></form>`;
        App.utils.openModal("Nova Despesa", html);
        document.getElementById('ex-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/expenses')).push({ supplier: document.getElementById('e-s').value, description: document.getElementById('e-d').value, amount: parseFloat(document.getElementById('e-v').value), status: 'Aberto' });
            App.utils.closeModal();
        };
    };

    window.delItem = (path, id) => { if(confirm("Excluir?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `${path}/${id}`)).remove(); };
    window.settle = (type, id) => { if(confirm("Confirmar?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/${type}/${id}`)).update({ status: type==='receivable'?'Recebido':'Pago' }); };
    
    window.manageItems = (eid) => {
        const html = `<div class="text-sm mb-2">Adicionar item à nota:</div><div class="flex gap-2"><input id="i-n" placeholder="Item" class="border p-1 rounded"><input id="i-q" type="number" placeholder="Qtd" class="border p-1 w-16 rounded"><button id="i-add" class="bg-green-600 text-white px-2 rounded">+</button></div>`;
        App.utils.openModal("Itens da NF", html);
        document.getElementById('i-add').onclick = () => {
            const n = document.getElementById('i-n').value; const q = parseFloat(document.getElementById('i-q').value);
            if(n && q) {
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/expenses/${eid}/purchasedItems`)).push({ name: n, quantityPurchased: q });
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({ name: n, quantity: q, unit: 'un', cost: 0 });
                document.getElementById('i-n').value = '';
            }
        };
    };
})();
