// ==================================================================
// MÓDULO FINANCEIRO & ESTOQUE AVANÇADO (VERSÃO FINAL)
// ==================================================================
(function() {
    const App = window.DentistaApp;

    // Inicializa a tela financeira com abas
    window.initFinanceView = function(container) {
        container.innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl border border-indigo-100">
                <h2 class="text-3xl font-extrabold text-indigo-800 mb-6 flex items-center">
                    <i class='bx bxs-wallet text-3xl mr-3 text-indigo-600'></i> Gestão Financeira e Estoque
                </h2>
                
                <div class="flex border-b border-gray-200 mb-6 overflow-x-auto">
                    <button id="tab-stock" class="p-3 text-sm font-bold text-indigo-700 border-b-2 border-indigo-600 transition" onclick="switchTab('stock')">📦 Inventário</button>
                    <button id="tab-receivable" class="p-3 text-sm font-medium text-gray-500 hover:text-indigo-600 transition" onclick="switchTab('receivable')">💰 Receitas (Serviços)</button>
                    <button id="tab-expense" class="p-3 text-sm font-medium text-gray-500 hover:text-indigo-600 transition" onclick="switchTab('expense')">💸 Despesas (NF)</button>
                </div>

                <div id="fin-content-area"></div>
            </div>
            <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
        `;
        
        // Expor função de troca de aba
        window.switchTab = (tab) => {
            // Atualiza estilo das abas
            ['stock', 'receivable', 'expense'].forEach(t => {
                const btn = document.getElementById(`tab-${t}`);
                if(t === tab) {
                    btn.className = "p-3 text-sm font-bold text-indigo-700 border-b-2 border-indigo-600 transition";
                } else {
                    btn.className = "p-3 text-sm font-medium text-gray-500 hover:text-indigo-600 transition";
                }
            });
            
            // Renderiza conteúdo
            if(tab === 'stock') window.renderStockList();
            else if(tab === 'receivable') window.renderReceivablesList();
            else if(tab === 'expense') window.renderExpensesList();
        };

        // Inicia na aba Estoque
        window.renderStockList();
    };

    // --- 1. ESTOQUE (INVENTÁRIO) ---
    window.renderStockList = function() {
        const div = document.getElementById('fin-content-area');
        div.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-700 text-lg">Itens em Estoque</h3>
                <button onclick="openStockModal()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow text-sm flex items-center"><i class='bx bx-plus mr-1'></i> Novo Item</button>
            </div>
            <div class="overflow-x-auto bg-gray-50 rounded-lg border">
                <table class="w-full text-sm text-left text-gray-600">
                    <thead class="bg-gray-100 uppercase text-xs font-bold text-gray-700">
                        <tr><th class="p-3">Item</th><th class="p-3">Qtd</th><th class="p-3">Categoria</th><th class="p-3">Custo Médio</th><th class="p-3 text-right">Ação</th></tr>
                    </thead>
                    <tbody id="stock-tb" class="divide-y divide-gray-200"></tbody>
                </table>
            </div>`;
        
        const tb = document.getElementById('stock-tb');
        if (App.cache.stock.length > 0) {
            App.cache.stock.forEach(i => {
                tb.innerHTML += `
                    <tr class="hover:bg-white transition">
                        <td class="p-3 font-medium text-gray-900">${i.name}</td>
                        <td class="p-3"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-xs">${i.quantity} ${i.unit}</span></td>
                        <td class="p-3 text-xs">${i.category || '-'}</td>
                        <td class="p-3 font-mono">${App.utils.formatCurrency(i.cost)}</td>
                        <td class="p-3 text-right">
                            <button onclick="deleteStock('${i.id}')" class="text-red-500 hover:bg-red-100 p-2 rounded transition" title="Remover"><i class='bx bx-trash'></i></button>
                        </td>
                    </tr>`;
            });
        } else { tb.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400 italic">Nenhum item cadastrado.</td></tr>'; }
    };

    // --- 2. RECEITAS (CONTAS A RECEBER) ---
    window.renderReceivablesList = function() {
        const div = document.getElementById('fin-content-area');
        div.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-700 text-lg">Serviços Prestados</h3>
                <button onclick="window.openRecModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow text-sm flex items-center"><i class='bx bx-money mr-1'></i> Registrar Serviço</button>
            </div>
            <div id="rec-list" class="space-y-3"></div>`;
        
        const list = document.getElementById('rec-list');
        if (App.cache.finance.receivables.length > 0) {
            App.cache.finance.receivables.forEach(r => {
                const isPaid = r.status === 'Recebido';
                const statusBadge = isPaid 
                    ? `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><i class='bx bx-check'></i> Recebido</span>` 
                    : `<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><i class='bx bx-time'></i> Aberto</span>`;
                
                const actionBtn = isPaid ? '' : `<button onclick="settleTx('receivable', '${r.id}')" class="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition shadow ml-2">Receber</button>`;
                
                list.innerHTML += `
                    <div class="p-4 border rounded-xl flex justify-between items-center bg-white hover:shadow-md transition group">
                        <div>
                            <div class="font-bold text-indigo-900 text-lg flex items-center gap-2">${r.patientName} <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 rounded border">${r.paymentMethod || 'N/A'}</span></div>
                            <div class="text-sm text-gray-500 mt-1">${r.description} <span class="mx-1">•</span> Venc: ${App.utils.formatDate(r.dueDate)}</div>
                        </div>
                        <div class="text-right flex items-center gap-3">
                            ${statusBadge}
                            <div class="font-bold text-green-600 text-lg ml-2">${App.utils.formatCurrency(r.amount)}</div>
                            <div class="border-l pl-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onclick="manageMaterials('${r.id}')" class="text-gray-400 hover:text-yellow-600 p-2 rounded hover:bg-yellow-50" title="Baixa de Estoque"><i class='bx bx-package text-xl'></i></button>
                                ${actionBtn}
                                <button onclick="deleteTx('receivable', '${r.id}')" class="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50" title="Excluir"><i class='bx bx-trash text-xl'></i></button>
                            </div>
                        </div>
                    </div>`;
            });
        } else { list.innerHTML = '<p class="text-center text-gray-400 italic py-8">Nenhum serviço registrado ainda.</p>'; }
    };

    // --- 3. DESPESAS (CONTAS A PAGAR) ---
    window.renderExpensesList = function() {
        const div = document.getElementById('fin-content-area');
        div.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-700 text-lg">Livro de Despesas</h3>
                <button onclick="openExpenseModal()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow text-sm flex items-center"><i class='bx bx-minus-circle mr-1'></i> Lançar Despesa</button>
            </div>
            <div id="exp-list" class="space-y-3"></div>`;
        
        const list = document.getElementById('exp-list');
        if (App.cache.finance.expenses.length > 0) {
            App.cache.finance.expenses.forEach(e => {
                const isPaid = e.status === 'Pago';
                const statusBadge = isPaid 
                    ? `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Pago</span>` 
                    : `<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">Aberto</span>`;
                
                const actionBtn = isPaid ? '' : `<button onclick="settleTx('expenses', '${e.id}')" class="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition shadow ml-2">Pagar</button>`;
                
                list.innerHTML += `
                    <div class="p-4 border rounded-xl flex justify-between items-center bg-white hover:shadow-md transition group">
                        <div>
                            <div class="font-bold text-gray-800 text-lg">${e.supplier} <span class="text-xs text-gray-400 font-normal">(${e.ref || 'S/Ref'})</span></div>
                            <div class="text-sm text-gray-500 mt-1">${e.description} <span class="mx-1">•</span> ${e.paymentMethod || '-'}</div>
                        </div>
                        <div class="text-right flex items-center gap-3">
                            ${statusBadge}
                            <div class="font-bold text-red-600 text-lg ml-2">${App.utils.formatCurrency(e.amount)}</div>
                            <div class="border-l pl-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onclick="managePurchaseItems('${e.id}')" class="text-gray-400 hover:text-green-600 p-2 rounded hover:bg-green-50" title="Entrada de Itens"><i class='bx bx-cart-add text-xl'></i></button>
                                ${actionBtn}
                                <button onclick="deleteTx('expenses', '${e.id}')" class="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50" title="Excluir"><i class='bx bx-trash text-xl'></i></button>
                            </div>
                        </div>
                    </div>`;
            });
        } else { list.innerHTML = '<p class="text-center text-gray-400 italic py-8">Nenhuma despesa lançada.</p>'; }
    };

    // --- FUNÇÕES AUXILIARES DE MODAL E AÇÃO ---
    
    window.openStockModal = function() {
        const html = `
            <form id="st-form" class="grid grid-cols-2 gap-4 text-sm">
                <div class="col-span-2"><label class="font-bold text-gray-600">Nome do Material</label><input id="s-name" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold text-gray-600">Qtd Inicial</label><input id="s-qty" type="number" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold text-gray-600">Unidade</label><input id="s-unit" class="w-full border p-2 rounded" placeholder="cx, un, ml" required></div>
                <div class="col-span-2"><label class="font-bold text-gray-600">Categoria</label>
                <select id="s-cat" class="w-full border p-2 rounded">
                    <option>Consumo Interno</option><option>Material Clínico</option><option>Venda ao Paciente</option><option>Equipamento</option>
                </select></div>
                <button class="col-span-2 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition mt-2">Salvar Item</button>
            </form>`;
        App.utils.openModal("Novo Item de Estoque", html);
        document.getElementById('st-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({
                name: document.getElementById('s-name').value, quantity: parseFloat(document.getElementById('s-qty').value),
                unit: document.getElementById('s-unit').value, category: document.getElementById('s-cat').value, cost: 0
            });
            App.utils.closeModal();
        };
    };

    window.openExpenseModal = function() {
        const html = `
            <form id="exp-form" class="grid grid-cols-2 gap-4 text-sm">
                <div class="col-span-2 text-indigo-600 font-bold border-b pb-1">Dados da Nota Fiscal</div>
                <div><label class="font-bold text-gray-600">Fornecedor</label><input id="e-sup" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold text-gray-600">Ref/NF</label><input id="e-ref" class="w-full border p-2 rounded"></div>
                <div class="col-span-2"><label class="font-bold text-gray-600">Descrição</label><input id="e-desc" class="w-full border p-2 rounded" required></div>
                
                <div class="col-span-2 text-indigo-600 font-bold border-b pb-1 mt-2">Pagamento</div>
                <div><label class="font-bold text-gray-600">Valor (R$)</label><input id="e-val" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold text-gray-600">Vencimento</label><input id="e-date" type="date" class="w-full border p-2 rounded" required></div>
                <div class="col-span-2"><label class="font-bold text-gray-600">Método</label><select id="e-pay" class="w-full border p-2 rounded"><option value="Pix">Pix</option><option value="Boleto">Boleto</option><option value="Cartão">Cartão</option></select></div>

                <button class="col-span-2 bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700 transition mt-2">Lançar Despesa</button>
            </form>`;
        App.utils.openModal("Nova Despesa", html, 'max-w-xl');
        document.getElementById('exp-form').onsubmit = (e) => {
            e.preventDefault();
            const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/expenses')).push();
            ref.set({
                supplier: document.getElementById('e-sup').value, description: document.getElementById('e-desc').value,
                amount: parseFloat(document.getElementById('e-val').value), ref: document.getElementById('e-ref').value,
                dueDate: document.getElementById('e-date').value, paymentMethod: document.getElementById('e-pay').value,
                status: 'Aberto', registeredAt: new Date().toISOString()
            }).then(() => { App.utils.closeModal(); setTimeout(() => window.managePurchaseItems(ref.key), 300); });
        };
    };

    // Ações Globais de Deleção e Baixa
    window.deleteTx = (type, id) => { if(confirm("Excluir permanentemente?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/${type}/${id}`)).remove(); };
    window.deleteStock = (id) => { if(confirm("Remover item?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `stock/${id}`)).remove(); };
    
    window.settleTx = (type, id) => {
        if(!confirm(type === 'receivable' ? "Confirmar recebimento?" : "Confirmar pagamento?")) return;
        const updates = { status: type === 'receivable' ? 'Recebido' : 'Pago' };
        if(type === 'receivable') updates.receivedDate = new Date().toISOString(); else updates.paidDate = new Date().toISOString();
        App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/${type}/${id}`)).update(updates);
    };

    // Gestão de Itens (Entrada/Saída)
    window.manageMaterials = (recId) => {
        // ... (Código igual ao anterior para baixa, mantendo a lógica)
        const opts = App.cache.stock.map(i => `<option value="${i.id}">${i.name} (${i.quantity})</option>`).join('');
        const html = `<div class="text-sm mb-2 text-gray-600">Baixa de material usado neste serviço:</div><div class="flex gap-2"><select id="m-sel" class="border p-2 rounded flex-grow text-sm">${opts}</select><input id="m-q" type="number" placeholder="Qtd" class="border p-2 rounded w-20 text-sm"><button id="m-add" class="bg-red-500 hover:bg-red-600 text-white px-4 rounded font-bold">Baixar</button></div><div id="used-list" class="text-xs mt-4 border-t pt-2 space-y-1"></div>`;
        App.utils.openModal("Materiais Gastos", html);
        const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/receivable/${recId}/materials`));
        ref.on('value', s => { 
            const d = document.getElementById('used-list'); if(d) { d.innerHTML=''; if(s.exists()) s.forEach(x => d.innerHTML += `<div class="flex justify-between text-gray-600"><span>${x.val().name}</span> <b class="text-red-500">-${x.val().quantityUsed}</b></div>`); }
        });
        document.getElementById('m-add').onclick = async () => {
            const id = document.getElementById('m-sel').value; const q = parseFloat(document.getElementById('m-q').value);
            const item = App.cache.stock.find(x => x.id === id);
            if(item && q > 0) {
                await ref.push({ name: item.name, quantityUsed: q });
                await App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `stock/${id}`)).update({ quantity: parseFloat(item.quantity) - q });
            }
        };
    };

    window.managePurchaseItems = (expId) => {
        // ... (Código igual para entrada)
        const html = `<div class="text-sm mb-2 text-gray-600">Entrada de estoque desta nota:</div><div class="grid grid-cols-3 gap-2"><input id="p-n" placeholder="Item" class="col-span-2 border p-2 rounded text-sm"><input id="p-q" type="number" placeholder="Qtd" class="border p-2 rounded text-sm"><button id="p-ok" class="bg-green-600 hover:bg-green-700 text-white col-span-3 py-2 rounded font-bold text-sm mt-1">Adicionar ao Estoque</button></div><div id="pur-list" class="text-xs mt-4 border-t pt-2 space-y-1"></div>`;
        App.utils.openModal("Itens da Nota", html);
        const ref = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/expenses/${expId}/purchasedItems`));
        ref.on('value', s => {
            const d = document.getElementById('pur-list'); if(d) { d.innerHTML=''; if(s.exists()) s.forEach(x => d.innerHTML += `<div class="flex justify-between text-gray-600"><span>${x.val().name}</span> <b class="text-green-600">+${x.val().quantityPurchased}</b></div>`); }
        });
        document.getElementById('p-ok').onclick = async () => {
            const n = document.getElementById('p-n').value; const q = parseFloat(document.getElementById('p-q').value);
            if(n && q > 0) {
                await ref.push({ name: n, quantityPurchased: q });
                const exist = App.cache.stock.find(x => x.name.toLowerCase() === n.toLowerCase());
                if(exist) await App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `stock/${exist.id}`)).update({ quantity: parseFloat(exist.quantity) + q });
                else await App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({ name: n, quantity: q, unit: 'un', cost: 0 });
                document.getElementById('p-n').value = ''; document.getElementById('p-q').value = '';
            }
        };
    };

})();
