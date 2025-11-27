(function() {
    const App = window.DentistaApp;

    // Inicializa a tela financeira
    window.renderFinancialManager = function() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <h2 class="text-2xl font-bold text-indigo-800 mb-4">Gestão Financeira & Estoque</h2>
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

    // --- ESTOQUE ---
    window.renderStockList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Inventário</h3><button onclick="window.openStockModal()" class="bg-green-600 text-white px-3 py-1 rounded text-sm">+ Item</button></div>
            <div class="overflow-x-auto"><table class="w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="p-2">Item</th><th class="p-2">Qtd</th><th class="p-2">Categoria</th><th class="p-2">Custo</th><th class="p-2">Ação</th></tr></thead><tbody id="stock-tb"></tbody></table></div>`;
        const tb = document.getElementById('stock-tb');
        if(App.data.stock.length) {
            App.data.stock.forEach(i => tb.innerHTML += `<tr class="border-b"><td class="p-2">${i.name}</td><td class="p-2">${i.quantity} ${i.unit}</td><td class="p-2"><span class="text-xs bg-gray-100 px-1 rounded">${i.category || 'Geral'}</span></td><td class="p-2">${App.utils.formatCurrency(i.cost)}</td><td class="p-2"><button onclick="window.delItem('stock','${i.id}')" class="text-red-500"><i class='bx bx-trash'></i></button></td></tr>`);
        } else tb.innerHTML = '<tr><td colspan="5" class="p-4 text-center italic">Estoque vazio.</td></tr>';
    };

    // --- DESPESAS (NF) ---
    window.renderExpensesList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Livro de Despesas</h3><button onclick="window.openExpenseModal()" class="bg-red-600 text-white px-3 py-1 rounded text-sm">+ Lançar Despesa/NF</button></div>
            <div id="exp-list" class="space-y-2"></div>`;
        const list = document.getElementById('exp-list');
        if(App.data.expenses.length) {
            App.data.expenses.forEach(e => {
                const isPaid = e.status === 'Pago';
                const btn = isPaid ? '' : `<button onclick="window.settle('expenses','${e.id}')" class="bg-blue-500 text-white px-2 rounded text-xs ml-2">Pagar</button>`;
                list.innerHTML += `
                    <div class="p-3 border rounded flex justify-between items-center hover:shadow-sm transition">
                        <div><span class="font-bold text-gray-800">${e.supplier}</span> <span class="text-xs text-gray-500">(${e.docType}: ${e.invoiceNumber || 'S/N'})</span><br><span class="text-xs text-gray-500">${e.description}</span></div>
                        <div class="text-right flex items-center gap-2"><span class="font-bold text-red-600">${App.utils.formatCurrency(e.amount)}</span><button onclick="window.managePurchaseItems('${e.id}')" class="text-gray-400 hover:text-green-600" title="Entrada Estoque"><i class='bx bx-cart-add text-xl'></i></button>${btn}<button onclick="window.delItem('finance/expenses','${e.id}')" class="text-red-400 ml-2"><i class='bx bx-trash'></i></button></div>
                    </div>`;
            });
        } else list.innerHTML = '<p class="text-center text-gray-400">Nenhuma despesa lançada.</p>';
    };

    // --- RECEITAS ---
    window.renderReceivablesList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3"><h3 class="font-bold text-gray-700">Receitas</h3><button onclick="window.openRecModal()" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm">+ Serviço</button></div>
            <div id="rec-list" class="space-y-2"></div>`;
        const list = document.getElementById('rec-list');
        if(App.data.receivables.length) {
            App.data.receivables.forEach(r => {
                const isPaid = r.status === 'Recebido';
                const btn = isPaid ? '' : `<button onclick="window.settle('receivable','${r.id}')" class="bg-green-500 text-white px-2 rounded text-xs ml-2">Receber</button>`;
                list.innerHTML += `
                    <div class="p-3 border rounded flex justify-between items-center hover:shadow-sm transition">
                        <div><span class="font-bold text-indigo-900">${r.patientName}</span><br><span class="text-xs text-gray-500">${r.description} - ${App.utils.formatDate(r.dueDate)}</span></div>
                        <div class="text-right flex items-center gap-2"><span class="text-xs bg-gray-100 px-1 rounded">${r.paymentMethod}</span><span class="font-bold text-green-600">${App.utils.formatCurrency(r.amount)}</span><button onclick="window.manageMaterials('${r.id}')" class="text-gray-400 hover:text-yellow-600" title="Baixa"><i class='bx bx-package text-xl'></i></button>${btn}<button onclick="window.delItem('finance/receivable','${r.id}')" class="text-red-400 ml-2"><i class='bx bx-trash'></i></button></div>
                    </div>`;
            });
        } else list.innerHTML = '<p class="text-center text-gray-400">Sem receitas.</p>';
    };

    // --- MODAIS COM CAMPOS COMPLETOS ---
    
    window.openExpenseModal = () => {
        const html = `
            <form id="exp-form" class="grid grid-cols-2 gap-3 text-sm">
                <div class="col-span-2 font-bold text-indigo-600 border-b pb-1">Dados Fiscais</div>
                <div><label>Tipo Doc.</label><select id="e-type" class="w-full border p-2 rounded"><option>Nota Fiscal (NF-e)</option><option>Recibo</option><option>Boleto</option><option>Outros</option></select></div>
                <div><label>Número NF</label><input id="e-num" class="w-full border p-2 rounded" placeholder="000.000"></div>
                
                <div class="col-span-2 font-bold text-indigo-600 border-b pb-1 mt-2">Detalhes</div>
                <div class="col-span-2"><label>Fornecedor</label><input id="e-sup" class="w-full border p-2 rounded" required></div>
                <div><label>Valor Total (R$)</label><input id="e-val" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                <div><label>Vencimento</label><input id="e-due" type="date" class="w-full border p-2 rounded" required></div>
                
                <div class="col-span-2"><label>Descrição</label><input id="e-desc" class="w-full border p-2 rounded" required placeholder="Ex: Compra de Luvas"></div>
                <div><label>Pagamento</label><select id="e-pay" class="w-full border p-2 rounded"><option>Boleto</option><option>Pix</option><option>Cartão</option></select></div>

                <button class="col-span-2 bg-red-600 text-white p-3 rounded font-bold mt-2 hover:bg-red-700">Salvar e Lançar Itens</button>
            </form>`;
        App.utils.openModal("Lançamento de Despesa", html, 'max-w-xl');
        
        document.getElementById('exp-form').onsubmit = (e) => {
            e.preventDefault();
            const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/expenses')).push();
            ref.set({
                docType: document.getElementById('e-type').value,
                invoiceNumber: document.getElementById('e-num').value,
                supplier: document.getElementById('e-sup').value,
                amount: parseFloat(document.getElementById('e-val').value),
                dueDate: document.getElementById('e-due').value,
                description: document.getElementById('e-desc').value,
                paymentMethod: document.getElementById('e-pay').value,
                status: 'Aberto', registeredAt: new Date().toISOString()
            }).then(() => { App.utils.closeModal(); setTimeout(() => window.managePurchaseItems(ref.key), 300); });
        };
    };

    window.openStockModal = () => {
        const html = `<form id="st-form" class="grid gap-2 text-sm"><div class="col-span-2"><label>Nome</label><input id="s-n" class="w-full border p-2 rounded" required></div><div><label>Qtd Inicial</label><input id="s-q" type="number" class="w-full border p-2 rounded" required></div><div><label>Unidade</label><input id="s-u" class="w-full border p-2 rounded" placeholder="cx, un" required></div><div class="col-span-2"><label>Categoria</label><select id="s-c" class="w-full border p-2 rounded"><option>Consumo Interno</option><option>Material Clínico</option><option>Venda</option></select></div><button class="bg-green-600 text-white p-2 rounded font-bold w-full mt-2">Salvar Item</button></form>`;
        App.utils.openModal("Novo Item", html);
        document.getElementById('st-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({
                name: document.getElementById('s-n').value, quantity: parseFloat(document.getElementById('s-q').value), unit: document.getElementById('s-u').value, category: document.getElementById('s-c').value, cost: 0
            });
            App.utils.closeModal();
        };
    };

    window.openRecModal = () => {
        const opts = App.data.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        const html = `<form id="rec-form" class="grid gap-2 text-sm"><div class="col-span-2"><label>Paciente</label><select id="r-p" class="w-full border p-2 rounded">${opts}</select></div><div class="col-span-2"><label>Serviço</label><input id="r-d" class="w-full border p-2 rounded" required></div><div><label>Valor (R$)</label><input id="r-v" type="number" step="0.01" class="w-full border p-2 rounded" required></div><div><label>Vencimento</label><input id="r-dt" type="date" class="w-full border p-2 rounded" required></div><div class="col-span-2"><label>Pagamento</label><select id="r-py" class="w-full border p-2 rounded"><option>Pix</option><option>Cartão Crédito</option><option>Dinheiro</option></select></div><button class="col-span-2 bg-indigo-600 text-white p-2 rounded font-bold mt-2">Salvar</button></form>`;
        App.utils.openModal("Novo Serviço", html);
        document.getElementById('rec-form').onsubmit = (e) => {
            e.preventDefault();
            const pid = document.getElementById('r-p').value;
            const p = App.data.patients.find(x => x.id === pid);
            const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/receivable')).push();
            ref.set({
                patientId: pid, patientName: p.name, description: document.getElementById('r-d').value, amount: parseFloat(document.getElementById('r-v').value), dueDate: document.getElementById('r-dt').value, paymentMethod: document.getElementById('r-py').value, status: 'Aberto', registeredAt: new Date().toISOString()
            }).then(() => { App.utils.closeModal(); setTimeout(() => window.manageMaterials(ref.key), 300); });
        };
    };

    // --- AÇÕES GLOBAIS ---
    window.delItem = (path, id) => { if(confirm("Excluir?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `${path}/${id}`)).remove(); };
    window.settle = (type, id) => {
        if(!confirm("Confirmar baixa?")) return;
        const up = { status: type === 'receivable' ? 'Recebido' : 'Pago' };
        if(type === 'receivable') up.receivedDate = new Date().toISOString(); else up.paidDate = new Date().toISOString();
        App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/${type}/${id}`)).update(up);
    };

    // --- GESTÃO DE ITENS (Baixa e Entrada) ---
    window.managePurchaseItems = (expId) => {
        const html = `<div class="text-sm mb-2 text-gray-600">Adicionar itens desta Nota ao Estoque:</div><div class="grid grid-cols-4 gap-2 items-end"><div class="col-span-2"><label>Item</label><input id="p-n" class="w-full border p-1 rounded"></div><div><label>Qtd</label><input id="p-q" type="number" class="w-full border p-1 rounded"></div><button id="p-add" class="bg-green-600 text-white rounded p-1 font-bold h-[34px]">+</button></div><div id="p-list" class="mt-2 text-xs border-t pt-2"></div>`;
        App.utils.openModal("Itens da Nota", html);
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
        const opts = App.data.stock.map(i => `<option value="${i.id}">${i.name} (${i.quantity})</option>`).join('');
        const html = `<div class="text-sm mb-2 text-gray-600">Baixa de material:</div><div class="flex gap-2"><select id="m-s" class="border p-2 rounded flex-grow text-sm">${opts}</select><input id="m-q" type="number" placeholder="Qtd" class="border p-2 rounded w-20 text-sm"><button id="m-bx" class="bg-red-500 text-white px-3 rounded font-bold">OK</button></div><div id="m-list" class="mt-2 text-xs"></div>`;
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
