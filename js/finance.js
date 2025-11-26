// ==================================================================
// MÓDULO FINANCEIRO & ESTOQUE AVANÇADO
// ==================================================================
(function() {
    const App = window.DentistaApp;

    // Inicializa a tela financeira
    window.initFinanceView = function(container) {
        container.innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <h2 class="text-2xl font-bold text-indigo-800 mb-4">Gestão Financeira e Estoque</h2>
                <div class="flex border-b mb-4 overflow-x-auto">
                    <button class="p-3 border-b-2 border-indigo-600 text-indigo-700 font-bold" onclick="window.renderStockList()">📦 Estoque</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600" onclick="window.renderReceivablesList()">💰 Receitas</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600" onclick="window.renderExpensesList()">💸 Despesas (NF)</button>
                </div>
                <div id="fin-content-area"></div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        window.renderStockList();
    };

    // --- ESTOQUE ---
    window.renderStockList = function() {
        const div = document.getElementById('fin-content-area');
        div.innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="font-bold text-gray-700">Inventário</h3>
                <button onclick="openStockModal()" class="bg-green-600 text-white px-3 py-1 rounded text-sm">+ Item Manual</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="p-2">Item</th><th class="p-2">Qtd</th><th class="p-2">Tipo</th><th class="p-2">Custo</th><th class="p-2">Ação</th></tr></thead><tbody id="stock-tb"></tbody></table>
            </div>`;
        
        const tb = document.getElementById('stock-tb');
        if (App.cache.stock.length > 0) {
            App.cache.stock.forEach(i => {
                tb.innerHTML += `
                    <tr class="border-b">
                        <td class="p-2 font-medium">${i.name}</td>
                        <td class="p-2">${i.quantity} ${i.unit}</td>
                        <td class="p-2"><span class="text-xs bg-gray-100 px-1 rounded">${i.category || 'Geral'}</span></td>
                        <td class="p-2">${App.utils.formatCurrency(i.cost)}</td>
                        <td class="p-2"><button onclick="deleteStock('${i.id}')" class="text-red-400"><i class='bx bx-trash'></i></button></td>
                    </tr>`;
            });
        } else { tb.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-gray-400">Estoque vazio.</td></tr>'; }
    };

    // --- DESPESAS (NOTAS FISCAIS) ---
    window.renderExpensesList = function() {
        const div = document.getElementById('fin-content-area');
        div.innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="font-bold text-gray-700">Livro de Despesas</h3>
                <button onclick="openExpenseModal()" class="bg-red-600 text-white px-3 py-1 rounded text-sm">+ Lançar Despesa/NF</button>
            </div>
            <div id="exp-list" class="space-y-2"></div>`;
        
        const list = document.getElementById('exp-list');
        if (App.cache.finance.expenses.length > 0) {
            App.cache.finance.expenses.forEach(e => {
                const isPaid = e.status === 'Pago';
                const action = isPaid ? '' : `<button onclick="settleTx('expenses', '${e.id}')" class="text-xs bg-blue-500 text-white px-2 py-1 rounded ml-2">Pagar</button>`;
                
                list.innerHTML += `
                    <div class="p-3 border rounded flex justify-between items-center bg-white hover:shadow-sm transition">
                        <div>
                            <div class="font-bold text-gray-800">${e.supplier} <span class="text-xs text-gray-400 font-normal">CNPJ: ${e.cnpj || '-'}</span></div>
                            <div class="text-xs text-gray-500">NF: ${e.invoiceNumber || 'S/N'} (Série ${e.invoiceSeries || '-'}) | ${e.description}</div>
                        </div>
                        <div class="text-right flex items-center gap-2">
                            <div class="font-bold text-red-600 ml-2">${App.utils.formatCurrency(e.amount)}</div>
                            <button onclick="managePurchaseItems('${e.id}')" class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded" title="Entrada Estoque"><i class='bx bx-cart-add'></i></button>
                            ${action}
                            <button onclick="deleteTx('expenses', '${e.id}')" class="text-red-400"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>`;
            });
        } else { list.innerHTML = '<p class="text-center text-gray-400">Nenhuma despesa lançada.</p>'; }
    };

    // --- RECEITAS ---
    window.renderReceivablesList = function() {
        const div = document.getElementById('fin-content-area');
        div.innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="font-bold text-gray-700">Receitas de Tratamentos</h3>
                <button onclick="window.openRecModal()" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm">+ Novo Serviço</button>
            </div>
            <div id="rec-list" class="space-y-2"></div>`;
        
        const list = document.getElementById('rec-list');
        if (App.cache.finance.receivables.length > 0) {
            App.cache.finance.receivables.forEach(r => {
                const isPaid = r.status === 'Recebido';
                const action = isPaid ? '' : `<button onclick="settleTx('receivable', '${r.id}')" class="text-xs bg-green-500 text-white px-2 py-1 rounded ml-2">Receber</button>`;
                
                list.innerHTML += `
                    <div class="p-3 border rounded flex justify-between items-center bg-white hover:shadow-sm transition">
                        <div>
                            <div class="font-bold text-indigo-900">${r.patientName}</div>
                            <div class="text-xs text-gray-500">${r.description} - Venc: ${App.utils.formatDate(r.dueDate)}</div>
                        </div>
                        <div class="text-right flex items-center gap-2">
                            <span class="text-xs bg-gray-100 px-2 rounded">${r.paymentMethod || '-'}</span>
                            <div class="font-bold text-green-600 ml-2">${App.utils.formatCurrency(r.amount)}</div>
                            <button onclick="manageMaterials('${r.id}')" class="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded" title="Baixa Estoque"><i class='bx bx-package'></i></button>
                            ${action}
                            <button onclick="deleteTx('receivable', '${r.id}')" class="text-red-400"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>`;
            });
        } else { list.innerHTML = '<p class="text-center text-gray-400">Nenhum serviço.</p>'; }
    };

    // --- MODAIS AVANÇADOS (NF BRASIL) ---
    window.openExpenseModal = function() {
        const html = `
            <form id="exp-form" class="grid grid-cols-2 gap-3 text-sm">
                <div class="col-span-2"><h4 class="font-bold text-indigo-600 border-b pb-1 mb-2">Dados da Nota Fiscal / Recibo</h4></div>
                
                <div><label class="font-bold">Tipo Doc.</label><select id="e-type" class="w-full border p-2 rounded"><option>Nota Fiscal (NF-e)</option><option>Recibo Simples</option><option>Cupom Fiscal</option><option>Boleto</option></select></div>
                <div><label class="font-bold">Número NF</label><input id="e-num" class="w-full border p-2 rounded" placeholder="000.000"></div>
                
                <div><label class="font-bold">Série</label><input id="e-series" class="w-full border p-2 rounded" placeholder="001"></div>
                <div><label class="font-bold">Data Emissão</label><input id="e-emit" type="date" class="w-full border p-2 rounded"></div>

                <div class="col-span-2"><h4 class="font-bold text-indigo-600 border-b pb-1 mb-2 mt-2">Fornecedor & Valores</h4></div>

                <div class="col-span-2"><label class="font-bold">Fornecedor (Razão Social)</label><input id="e-sup" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold">CNPJ/CPF</label><input id="e-cnpj" class="w-full border p-2 rounded"></div>
                <div><label class="font-bold">Valor Total (R$)</label><input id="e-val" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                
                <div class="col-span-2"><label class="font-bold">Descrição dos Produtos/Serviços</label><input id="e-desc" class="w-full border p-2 rounded" placeholder="Ex: Compra de Anestésicos e Luvas"></div>
                
                <div><label class="font-bold">Vencimento</label><input id="e-due" type="date" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold">Forma Pagto</label><select id="e-pay" class="w-full border p-2 rounded"><option value="Boleto">Boleto</option><option value="Pix">Pix</option><option value="Transferência">Transferência</option><option value="Cartão">Cartão</option></select></div>

                <button class="col-span-2 bg-red-600 text-white p-3 rounded font-bold mt-4 hover:bg-red-700">Salvar e Lançar Itens no Estoque</button>
            </form>`;
        
        window.openModal("Lançamento de Despesa", html, 'max-w-2xl');
        
        document.getElementById('exp-form').onsubmit = (e) => {
            e.preventDefault();
            const data = {
                docType: document.getElementById('e-type').value,
                invoiceNumber: document.getElementById('e-num').value,
                invoiceSeries: document.getElementById('e-series').value,
                emissionDate: document.getElementById('e-emit').value,
                supplier: document.getElementById('e-sup').value,
                cnpj: document.getElementById('e-cnpj').value,
                amount: parseFloat(document.getElementById('e-val').value),
                description: document.getElementById('e-desc').value,
                dueDate: document.getElementById('e-due').value,
                paymentMethod: document.getElementById('e-pay').value,
                status: 'Aberto',
                registeredAt: new Date().toISOString()
            };
            
            const ref = App.db.ref(App.paths.admin(App.currentUser.uid, 'finance/expenses')).push();
            ref.set(data).then(() => {
                window.closeModal();
                // Abre imediatamente a gestão de itens para essa nota
                setTimeout(() => window.managePurchaseItems(ref.key), 300);
            });
        };
    };

    window.openStockModal = function() {
        const html = `
            <form id="st-form" class="grid grid-cols-2 gap-3 text-sm">
                <div class="col-span-2"><label class="font-bold">Nome do Material</label><input id="s-name" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold">Qtd Inicial</label><input id="s-qty" type="number" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold">Unidade</label><input id="s-unit" class="w-full border p-2 rounded" placeholder="cx, un, ml" required></div>
                <div class="col-span-2"><label class="font-bold">Categoria</label>
                <select id="s-cat" class="w-full border p-2 rounded">
                    <option>Consumo Interno (Luvas, Máscaras)</option>
                    <option>Material Clínico (Resinas, Anestésico)</option>
                    <option>Venda ao Paciente (Escovas, Kits)</option>
                    <option>Equipamento/Patrimônio</option>
                </select></div>
                <button class="col-span-2 bg-green-600 text-white p-2 rounded font-bold">Salvar</button>
            </form>`;
        window.openModal("Novo Item de Estoque", html);
        
        document.getElementById('st-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.paths.admin(App.currentUser.uid, 'stock')).push({
                name: document.getElementById('s-name').value,
                quantity: parseFloat(document.getElementById('s-qty').value),
                unit: document.getElementById('s-unit').value,
                category: document.getElementById('s-cat').value,
                cost: 0, supplier: 'Manual'
            });
            window.closeModal();
        };
    };

    // --- AÇÕES GLOBAIS ---
    window.deleteTx = (type, id) => { if(confirm("Excluir registro?")) App.db.ref(App.paths.admin(App.currentUser.uid, `finance/${type}/${id}`)).remove(); };
    window.deleteStock = (id) => { if(confirm("Remover item?")) App.db.ref(App.paths.admin(App.currentUser.uid, `stock/${id}`)).remove(); };
    
    window.settleTx = (type, id) => {
        if(!confirm("Confirmar baixa/pagamento?")) return;
        const updates = { status: type === 'receivable' ? 'Recebido' : 'Pago' };
        if(type === 'receivable') updates.receivedDate = new Date().toISOString(); else updates.paidDate = new Date().toISOString();
        App.db.ref(App.paths.admin(App.currentUser.uid, `finance/${type}/${id}`)).update(updates);
    };

    // --- GESTÃO DE ITENS (ENTRADA E SAÍDA) ---
    window.managePurchaseItems = function(expId) {
        // Entrada de Estoque vinculada à Nota Fiscal
        const html = `
            <div class="bg-green-50 p-3 rounded text-sm mb-4 border-l-4 border-green-500 text-green-900">
                Adicione os itens desta nota fiscal ao estoque.
            </div>
            <div class="grid grid-cols-4 gap-2 items-end mb-4">
                <div class="col-span-2"><label class="text-xs font-bold">Produto</label><input id="p-n" class="w-full border p-2 rounded text-sm"></div>
                <div><label class="text-xs font-bold">Qtd</label><input id="p-q" type="number" class="w-full border p-2 rounded text-sm"></div>
                <div><button id="p-ok" class="w-full bg-green-600 text-white py-2 rounded font-bold text-sm h-[38px]">+</button></div>
            </div>
            <div id="pur-list" class="text-xs border-t pt-2"></div>`;
        
        window.openModal("Itens da Nota Fiscal", html);
        
        const ref = App.db.ref(App.paths.admin(App.currentUser.uid, `finance/expenses/${expId}/purchasedItems`));
        
        // Lista itens já lançados na nota
        ref.on('value', s => {
            const d = document.getElementById('pur-list');
            if(d) { 
                d.innerHTML = ''; 
                if(s.exists()) s.forEach(x => d.innerHTML += `<div class="flex justify-between py-1 border-b"><span>${x.val().name}</span> <b>+${x.val().quantityPurchased}</b></div>`); 
            }
        });

        document.getElementById('p-ok').onclick = async () => {
            const n = document.getElementById('p-n').value; 
            const q = parseFloat(document.getElementById('p-q').value);
            if(n && q > 0) {
                // 1. Registra na nota
                await ref.push({ name: n, quantityPurchased: q });
                
                // 2. Atualiza Estoque (Procura pelo nome ou cria novo)
                const exist = App.cache.stock.find(x => x.name.toLowerCase() === n.toLowerCase());
                if(exist) {
                    await App.db.ref(App.paths.admin(App.currentUser.uid, `stock/${exist.id}`)).update({ 
                        quantity: parseFloat(exist.quantity) + q 
                    });
                } else {
                    await App.db.ref(App.paths.admin(App.currentUser.uid, 'stock')).push({ 
                        name: n, quantity: q, unit: 'un', category: 'Consumo Interno', cost: 0, supplier: 'Via Nota' 
                    });
                }
                document.getElementById('p-n').value = ''; 
                document.getElementById('p-q').value = '';
            }
        };
    };

    window.manageMaterials = function(recId) {
        // Baixa de Estoque por Procedimento
        const opts = App.cache.stock.map(i => `<option value="${i.id}">${i.name} (Disp: ${i.quantity})</option>`).join('');
        const html = `
            <div class="text-sm mb-2">Materiais consumidos neste atendimento:</div>
            <div class="flex gap-2 mb-4">
                <select id="m-sel" class="border p-2 flex-grow text-sm rounded">${opts}</select>
                <input id="m-q" type="number" placeholder="Qtd" class="border p-2 w-20 text-sm rounded">
                <button id="m-add" class="bg-red-500 text-white px-4 rounded">Baixar</button>
            </div>
            <div id="used-list" class="text-xs border-t pt-2"></div>`;
        
        window.openModal("Baixa de Materiais", html);
        
        const ref = App.db.ref(App.paths.admin(App.currentUser.uid, `finance/receivable/${recId}/materials`));
        ref.on('value', s => {
            const d = document.getElementById('used-list');
            if(d) { 
                d.innerHTML = ''; 
                if(s.exists()) s.forEach(x => d.innerHTML += `<div class="flex justify-between py-1 border-b"><span>${x.val().name}</span> <b class="text-red-600">-${x.val().quantityUsed}</b></div>`); 
            }
        });

        document.getElementById('m-add').onclick = async () => {
            const id = document.getElementById('m-sel').value; 
            const q = parseFloat(document.getElementById('m-q').value);
            const item = App.cache.stock.find(x => x.id === id);
            if(item && q > 0) {
                await ref.push({ name: item.name, quantityUsed: q, unit: item.unit });
                await App.db.ref(App.paths.admin(App.currentUser.uid, `stock/${id}`)).update({ quantity: item.quantity - q });
            }
        };
    };

})();
