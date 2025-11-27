(function() {
    const App = window.DentistaApp;

    window.initFinanceView = function(container) {
        container.innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <h2 class="text-2xl font-bold text-indigo-800 mb-4">Gestão Financeira</h2>
                <div class="flex border-b mb-4 overflow-x-auto">
                    <button class="p-3 border-b-2 border-indigo-600 text-indigo-700 font-bold" onclick="window.renderStockList()">📦 Estoque</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600" onclick="window.renderReceivablesList()">💰 Receitas</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600" onclick="window.renderExpensesList()">💸 Despesas (NF)</button>
                </div>
                <div id="fin-content"></div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        window.renderStockList();
    };

    window.renderStockList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Inventário</h3><button onclick="openStockModal()" class="bg-green-600 text-white px-3 py-1 rounded text-sm">+ Item</button></div>
            <div class="overflow-x-auto"><table class="w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="p-2">Item</th><th class="p-2">Qtd</th><th class="p-2">Tipo</th><th class="p-2">Custo</th><th class="p-2">Ação</th></tr></thead><tbody id="stock-tb"></tbody></table></div>`;
        const tb = document.getElementById('stock-tb');
        if(App.data.stock.length) {
            App.data.stock.forEach(i => tb.innerHTML += `<tr class="border-b"><td class="p-2">${i.name}</td><td class="p-2">${i.quantity} ${i.unit}</td><td class="p-2 text-xs bg-gray-100 rounded">${i.category}</td><td class="p-2">${App.utils.formatCurrency(i.cost)}</td><td class="p-2"><button onclick="delItem('stock','${i.id}')" class="text-red-500"><i class='bx bx-trash'></i></button></td></tr>`);
        } else tb.innerHTML = '<tr><td colspan="5" class="p-4 text-center italic">Vazio.</td></tr>';
    };

    window.renderExpensesList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Despesas</h3><button onclick="openExpModal()" class="bg-red-600 text-white px-3 py-1 rounded text-sm">+ Lançar NF</button></div>
            <div id="exp-list" class="space-y-2"></div>`;
        const list = document.getElementById('exp-list');
        if(App.data.expenses.length) {
            App.data.expenses.forEach(e => {
                const isPaid = e.status === 'Pago';
                const btn = isPaid ? '' : `<button onclick="settle('expenses','${e.id}')" class="bg-blue-500 text-white px-2 rounded text-xs ml-2">Pagar</button>`;
                list.innerHTML += `
                    <div class="p-3 border rounded flex justify-between items-center bg-white hover:shadow-sm">
                        <div><div class="font-bold text-gray-800">${e.supplier} <span class="text-xs font-normal text-gray-400">NF: ${e.invoice||'-'}</span></div><div class="text-xs text-gray-500">${e.description}</div></div>
                        <div class="text-right flex items-center gap-2"><div class="font-bold text-red-600">${App.utils.formatCurrency(e.amount)}</div><button onclick="managePurchaseItems('${e.id}')" class="text-gray-400 hover:text-green-600" title="Estoque"><i class='bx bx-cart-add text-xl'></i></button>${btn}<button onclick="delItem('finance/expenses','${e.id}')" class="text-red-400"><i class='bx bx-trash'></i></button></div>
                    </div>`;
            });
        } else list.innerHTML = '<p class="text-center text-gray-400">Sem despesas.</p>';
    };

    window.renderReceivablesList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Receitas</h3><button onclick="window.openRecModal()" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm">+ Serviço</button></div>
            <div id="rec-list" class="space-y-2"></div>`;
        const list = document.getElementById('rec-list');
        if(App.data.receivables.length) {
            App.data.receivables.forEach(r => {
                const isPaid = r.status === 'Recebido';
                const btn = isPaid ? '' : `<button onclick="settle('receivable','${r.id}')" class="bg-green-500 text-white px-2 rounded text-xs ml-2">Receber</button>`;
                list.innerHTML += `
                    <div class="p-3 border rounded flex justify-between items-center bg-white hover:shadow-sm">
                        <div><div class="font-bold text-indigo-900">${r.patientName}</div><div class="text-xs text-gray-500">${r.description} - ${App.utils.formatDate(r.dueDate)}</div></div>
                        <div class="text-right flex items-center gap-2"><span class="text-xs bg-gray-100 px-1 rounded">${r.paymentMethod}</span><div class="font-bold text-green-600">${App.utils.formatCurrency(r.amount)}</div><button onclick="manageMaterials('${r.id}')" class="text-gray-400 hover:text-yellow-600" title="Baixa"><i class='bx bx-package text-xl'></i></button>${btn}<button onclick="delItem('finance/receivable','${r.id}')" class="text-red-400"><i class='bx bx-trash'></i></button></div>
                    </div>`;
            });
        } else list.innerHTML = '<p class="text-center text-gray-400">Sem receitas.</p>';
    };

    // --- MODAIS ---
    window.openStockModal = () => {
        const html = `<form id="st-form" class="grid gap-2 text-sm"><input id="s-n" placeholder="Nome" class="border p-2 rounded" required><input id="s-q" type="number" placeholder="Qtd" class="border p-2 rounded" required><input id="s-u" placeholder="Un" class="border p-2 rounded" required><select id="s-c" class="border p-2 rounded"><option>Uso Interno</option><option>Venda</option><option>Clínico</option></select><button class="bg-green-600 text-white p-2 rounded font-bold">Salvar</button></form>`;
        App.utils.openModal("Novo Item", html);
        document.getElementById('st-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({
                name: document.getElementById('s-n').value, quantity: parseFloat(document.getElementById('s-q').value),
                unit: document.getElementById('s-u').value, category: document.getElementById('s-c').value, cost: 0
            });
            App.utils.closeModal();
        };
    };

    window.openExpenseModal = () => {
        const html = `
            <form id="ex-form" class="grid grid-cols-2 gap-3 text-sm">
                <div class="col-span-2 font-bold text-indigo-600 border-b pb-1">Nota Fiscal</div>
                <div><label>Fornecedor</label><input id="e-sup" class="w-full border p-2 rounded" required></div>
                <div><label>CNPJ/CPF</label><input id="e-cnpj" class="w-full border p-2 rounded"></div>
                <div><label>Número NF</label><input id="e-nf" class="w-full border p-2 rounded"></div>
                <div><label>Valor (R$)</label><input id="e-val" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                <div class="col-span-2"><label>Descrição</label><input id="e-desc" class="w-full border p-2 rounded" required></div>
                <div><label>Vencimento</label><input id="e-date" type="date" class="w-full border p-2 rounded" required></div>
                <div><label>Pagamento</label><select id="e-pay" class="w-full border p-2 rounded"><option>Boleto</option><option>Pix</option><option>Cartão</option></select></div>
                <button class="col-span-2 bg-red-600 text-white p-2 rounded font-bold mt-2">Lançar Despesa</button>
            </form>`;
        App.utils.openModal("Lançar Despesa", html);
        document.getElementById('ex-form').onsubmit = (e) => {
            e.preventDefault();
            const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/expenses')).push();
            ref.set({
                supplier: document.getElementById('e-sup').value, cnpj: document.getElementById('e-cnpj').value,
                invoice: document.getElementById('e-nf').value, amount: parseFloat(document.getElementById('e-val').value),
                description: document.getElementById('e-desc').value, dueDate: document.getElementById('e-date').value,
                paymentMethod: document.getElementById('e-pay').value, status: 'Aberto', registeredAt: new Date().toISOString()
            }).then(() => { App.utils.closeModal(); setTimeout(() => window.managePurchaseItems(ref.key), 300); });
        };
    };

    // --- AÇÕES ---
    window.delItem = (path, id) => { if(confirm("Excluir?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `${path}/${id}`)).remove(); };
    window.settle = (type, id) => {
        if(!confirm("Confirmar baixa?")) return;
        const up = { status: type === 'receivable' ? 'Recebido' : 'Pago' };
        if(type === 'receivable') up.receivedDate = new Date().toISOString(); else up.paidDate = new Date().toISOString();
        App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/${type}/${id}`)).update(up);
    };

    window.managePurchaseItems = (expId) => {
        const html = `<div class="text-sm mb-2">Adicionar itens desta nota ao estoque:</div><div class="grid grid-cols-3 gap-2"><input id="p-n" placeholder="Item" class="border p-2 rounded text-sm col-span-2"><input id="p-q" type="number" placeholder="Qtd" class="border p-2 rounded text-sm"><button id="p-add" class="bg-green-600 text-white rounded col-span-3 py-1">Adicionar</button></div><div id="p-list" class="mt-2 text-xs border-t pt-2"></div>`;
        App.utils.openModal("Itens da NF", html);
        const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/expenses/${expId}/purchasedItems`));
        ref.on('value', s => {
            const d = document.getElementById('p-list'); if(d) { d.innerHTML=''; if(s.exists()) s.forEach(x => d.innerHTML+=`<div>+${x.val().quantityPurchased} ${x.val().name}</div>`); }
        });
        document.getElementById('p-add').onclick = async () => {
            const n = document.getElementById('p-n').value; const q = parseFloat(document.getElementById('p-q').value);
            if(n && q) {
                await ref.push({ name: n, quantityPurchased: q });
                const exist = App.data.stock.find(i => i.name.toLowerCase() === n.toLowerCase());
                if(exist) await App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `stock/${exist.id}`)).update({ quantity: parseFloat(exist.quantity) + q });
                else await App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({ name: n, quantity: q, unit: 'un', category: 'Consumo', cost: 0 });
                document.getElementById('p-n').value = '';
            }
        };
    };
    
    window.manageMaterials = (recId) => {
        const opts = App.data.stock.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
        const html = `<div class="text-sm mb-2">Baixa de material usado:</div><div class="flex gap-2"><select id="m-s" class="border p-2 rounded flex-grow text-sm">${opts}</select><input id="m-q" type="number" placeholder="Qtd" class="border p-2 rounded w-20 text-sm"><button id="m-bx" class="bg-red-500 text-white px-3 rounded">OK</button></div><div id="m-list" class="mt-2 text-xs"></div>`;
        App.utils.openModal("Baixa", html);
        const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/receivable/${recId}/materials`));
        ref.on('value', s => {
            const d = document.getElementById('m-list'); if(d) { d.innerHTML=''; if(s.exists()) s.forEach(x => d.innerHTML+=`<div>-${x.val().quantityUsed} ${x.val().name}</div>`); }
        });
        document.getElementById('m-bx').onclick = async () => {
            const id = document.getElementById('m-s').value; const q = parseFloat(document.getElementById('m-q').value);
            const item = App.data.stock.find(x => x.id === id);
            if(item && q) {
                await ref.push({ name: item.name, quantityUsed: q });
                await App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `stock/${id}`)).update({ quantity: parseFloat(item.quantity) - q });
            }
        };
    };

})();
