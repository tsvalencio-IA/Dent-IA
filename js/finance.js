// ==================================================================
// MÓDULO FINANCEIRO: Parcelamento, Despesas e Estoque
// ==================================================================
(function() {
    const App = window.DentistaApp; // Atalho para o estado global

    // Função Principal chamada pelo Core.js
    window.initFinanceView = function() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="p-6 bg-white shadow-lg rounded-2xl h-[calc(100vh-100px)] flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-indigo-800 flex items-center"><i class='bx bxs-wallet mr-2'></i> Financeiro & Estoque</h2>
                </div>
                
                <div class="flex border-b mb-4 gap-4">
                    <button class="px-4 py-2 border-b-2 border-transparent hover:border-indigo-500 font-bold text-gray-600 focus:outline-none" onclick="renderReceivablesList()">💰 Receitas</button>
                    <button class="px-4 py-2 border-b-2 border-transparent hover:border-red-500 font-bold text-gray-600 focus:outline-none" onclick="renderExpensesList()">💸 Despesas</button>
                    <button class="px-4 py-2 border-b-2 border-transparent hover:border-blue-500 font-bold text-gray-600 focus:outline-none" onclick="renderStockList()">📦 Estoque</button>
                </div>

                <div id="fin-content" class="flex-grow overflow-y-auto pr-2">
                    </div>
            </div>`;
        
        // Carrega Receitas por padrão
        window.renderReceivablesList();
    };

    // --- 1. RECEITAS (COM PARCELAMENTO 1x-24x) ---
    window.renderReceivablesList = function() {
        const div = document.getElementById('fin-content');
        div.innerHTML = `
            <div class="flex justify-between mb-4">
                <p class="text-sm text-gray-500 mt-2">Gestão de procedimentos e parcelas.</p>
                <button onclick="openRecModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow flex items-center"><i class='bx bx-plus mr-1'></i> Nova Receita</button>
            </div>
            <div id="rec-list" class="space-y-3"></div>
        `;
        
        const list = document.getElementById('rec-list');
        const sorted = [...App.data.receivables].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if(sorted.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-10">Nenhuma receita lançada.</div>';
            return;
        }

        sorted.forEach(r => {
            const isPaid = r.status === 'Recebido';
            const badge = isPaid 
                ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Recebido</span>` 
                : `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold uppercase">Aberto</span>`;
            
            const btnPay = isPaid 
                ? '' 
                : `<button onclick="settleTx('receivable','${r.id}')" class="ml-2 bg-green-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-600 shadow">Baixar</button>`;

            list.innerHTML += `
                <div class="bg-white border border-gray-100 p-4 rounded-xl hover:shadow-md transition flex justify-between items-center group">
                    <div>
                        <div class="font-bold text-gray-800 text-lg">${r.patientName}</div>
                        <div class="text-xs text-gray-500 flex items-center gap-2">
                            <span class="bg-gray-100 px-2 rounded">${r.paymentMethod}</span>
                            <span>${r.description}</span>
                            <span class="text-indigo-500 font-semibold">• Venc: ${App.utils.formatDate(r.dueDate)}</span>
                        </div>
                    </div>
                    <div class="text-right flex items-center">
                        ${badge}
                        <span class="font-bold text-gray-700 ml-3 text-lg">${App.utils.formatCurrency(r.amount)}</span>
                        ${btnPay}
                        <button onclick="delTx('finance/receivable','${r.id}')" class="ml-2 text-gray-300 hover:text-red-500 text-xl"><i class='bx bx-trash'></i></button>
                    </div>
                </div>`;
        });
    };

    // --- 2. DESPESAS (COM ENTRADA DE NOTA FISCAL) ---
    window.renderExpensesList = function() {
        const div = document.getElementById('fin-content');
        div.innerHTML = `
            <div class="flex justify-between mb-4">
                <p class="text-sm text-gray-500 mt-2">Contas a pagar e fornecedores.</p>
                <button onclick="openExpModal()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold shadow flex items-center"><i class='bx bx-plus mr-1'></i> Nova Despesa</button>
            </div>
            <div id="exp-list" class="space-y-3"></div>
        `;
        
        const list = document.getElementById('exp-list');
        const sorted = [...App.data.expenses].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        sorted.forEach(e => {
            const isPaid = e.status === 'Pago';
            const badge = isPaid 
                ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Pago</span>` 
                : `<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Aberto</span>`;
            
            const btnPay = isPaid 
                ? '' 
                : `<button onclick="settleTx('expenses','${e.id}')" class="ml-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600 shadow">Pagar</button>`;

            list.innerHTML += `
                <div class="bg-white border border-gray-100 p-4 rounded-xl hover:shadow-md transition flex justify-between items-center border-l-4 border-l-red-400">
                    <div>
                        <div class="font-bold text-gray-800">${e.supplier} <span class="text-xs font-normal text-gray-400">(Ref: ${e.ref || 'S/N'})</span></div>
                        <div class="text-xs text-gray-500">${e.description} • Venc: ${App.utils.formatDate(e.dueDate)}</div>
                    </div>
                    <div class="text-right flex items-center">
                        ${badge}
                        <span class="font-bold text-red-600 ml-3 text-lg">${App.utils.formatCurrency(e.amount)}</span>
                        ${btnPay}
                        <button onclick="delTx('finance/expenses','${e.id}')" class="ml-2 text-gray-300 hover:text-red-500 text-xl"><i class='bx bx-trash'></i></button>
                    </div>
                </div>`;
        });
    };

    // --- 3. ESTOQUE ---
    window.renderStockList = function() {
        const div = document.getElementById('fin-content');
        div.innerHTML = `
            <div class="flex justify-between mb-4">
                <p class="text-sm text-gray-500 mt-2">Controle de materiais.</p>
                <button onclick="openStockModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow flex items-center"><i class='bx bx-plus mr-1'></i> Novo Item</button>
            </div>
            <table class="w-full text-left text-sm border rounded-lg overflow-hidden">
                <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr><th class="p-3">Item</th><th class="p-3">Qtd</th><th class="p-3">Categoria</th><th class="p-3 text-right">Ação</th></tr>
                </thead>
                <tbody id="stk-body" class="bg-white divide-y divide-gray-100"></tbody>
            </table>
        `;
        const tb = document.getElementById('stk-body');
        App.data.stock.forEach(i => {
            tb.innerHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="p-3 font-medium text-gray-800">${i.name}</td>
                    <td class="p-3"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold text-xs">${i.quantity} ${i.unit}</span></td>
                    <td class="p-3 text-gray-500 text-xs">${i.category}</td>
                    <td class="p-3 text-right"><button onclick="delTx('stock','${i.id}')" class="text-red-400 hover:text-red-600"><i class='bx bx-trash'></i></button></td>
                </tr>`;
        });
    };

    // --- MODAIS DE LANÇAMENTO (LÓGICA COMPLEXA) ---
    
    window.openRecModal = function() {
        const opts = App.data.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        const html = `
            <form id="rec-form" class="grid gap-4 text-sm">
                <div><label class="block font-bold mb-1">Paciente</label><select id="r-p" class="w-full border p-2 rounded bg-gray-50">${opts}</select></div>
                <div><label class="block font-bold mb-1">Descrição do Serviço</label><input id="r-d" class="w-full border p-2 rounded" required placeholder="Ex: Implante Unitário"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block font-bold mb-1">Valor Total (R$)</label><input id="r-v" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                    <div><label class="block font-bold mb-1">1º Vencimento</label><input id="r-dt" type="date" class="w-full border p-2 rounded" required></div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                    <div><label class="block font-bold mb-1">Forma</label><select id="r-py" class="w-full border p-2 rounded" onchange="toggleInst(this.value, 'rec-inst-box')"><option value="Pix">Pix</option><option value="Cartão">Cartão Crédito</option><option value="Dinheiro">Dinheiro</option></select></div>
                    <div id="rec-inst-box" class="hidden">
                        <label class="block font-bold mb-1">Parcelas</label>
                        <select id="r-inst" class="w-full border p-2 rounded">${Array.from({length:24},(_,i)=>`<option value="${i+1}">${i+1}x</option>`).join('')}</select>
                    </div>
                </div>
                <button class="w-full py-3 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 mt-2">Lançar Receita</button>
            </form>`;
        App.utils.openModal("Novo Serviço", html);

        document.getElementById('rec-form').onsubmit = (e) => {
            e.preventDefault();
            const parcels = document.getElementById('rec-inst-box').classList.contains('hidden') ? 1 : parseInt(document.getElementById('r-inst').value);
            const total = parseFloat(document.getElementById('r-v').value);
            const baseDate = new Date(document.getElementById('r-dt').value);
            const pid = document.getElementById('r-p').value;
            const pname = App.data.patients.find(x => x.id === pid).name;
            const desc = document.getElementById('r-d').value;
            const method = document.getElementById('r-py').value;

            for(let i=0; i<parcels; i++) {
                let d = new Date(baseDate); d.setMonth(d.getMonth() + i);
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/receivable')).push({
                    patientId: pid, patientName: pname, description: `${desc} (${i+1}/${parcels})`,
                    amount: total/parcels, status: 'Aberto', dueDate: d.toISOString(), paymentMethod: method
                });
            }
            App.utils.closeModal();
        };
    };

    window.openExpModal = function() {
        const html = `
            <form id="exp-form" class="grid gap-4 text-sm">
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block font-bold mb-1">Fornecedor</label><input id="e-s" class="w-full border p-2 rounded" required></div>
                    <div><label class="block font-bold mb-1">Nota Fiscal</label><input id="e-nf" class="w-full border p-2 rounded"></div>
                </div>
                <div><label class="block font-bold mb-1">Descrição</label><input id="e-d" class="w-full border p-2 rounded" required></div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block font-bold mb-1">Valor Total</label><input id="e-v" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                    <div><label class="block font-bold mb-1">1º Vencimento</label><input id="e-dt" type="date" class="w-full border p-2 rounded" required></div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                    <div><label class="block font-bold mb-1">Forma</label><select id="e-py" class="w-full border p-2 rounded" onchange="toggleInst(this.value, 'exp-inst-box')"><option value="Boleto">Boleto</option><option value="Pix">Pix</option><option value="Cartão">Cartão</option></select></div>
                    <div id="exp-inst-box" class="hidden">
                        <label class="block font-bold mb-1">Parcelas</label>
                        <select id="e-inst" class="w-full border p-2 rounded">${Array.from({length:24},(_,i)=>`<option value="${i+1}">${i+1}x</option>`).join('')}</select>
                    </div>
                </div>
                <button class="w-full py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 mt-2">Lançar Despesa</button>
            </form>`;
        App.utils.openModal("Nova Despesa", html);
        
        document.getElementById('exp-form').onsubmit = (e) => {
            e.preventDefault();
            const parcels = document.getElementById('exp-inst-box').classList.contains('hidden') ? 1 : parseInt(document.getElementById('e-inst').value);
            const total = parseFloat(document.getElementById('e-v').value);
            const baseDate = new Date(document.getElementById('e-dt').value);
            
            for(let i=0; i<parcels; i++) {
                let d = new Date(baseDate); d.setMonth(d.getMonth() + i);
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/expenses')).push({
                    supplier: document.getElementById('e-s').value, ref: document.getElementById('e-nf').value,
                    description: `${document.getElementById('e-d').value} (${i+1}/${parcels})`,
                    amount: total/parcels, status: 'Aberto', dueDate: d.toISOString(), paymentMethod: document.getElementById('e-py').value
                });
            }
            App.utils.closeModal();
        };
    };

    window.openStockModal = function() {
        const html = `<form id="stk-form" class="grid gap-3"><input id="s-n" placeholder="Nome do Item" class="border p-2 rounded w-full" required><div class="grid grid-cols-2 gap-3"><input id="s-q" type="number" placeholder="Qtd" class="border p-2 rounded"><input id="s-u" placeholder="Unid (cx, un)" class="border p-2 rounded"></div><select id="s-c" class="border p-2 rounded w-full"><option>Consumo</option><option>Instrumental</option></select><button class="bg-blue-600 text-white w-full py-2 rounded font-bold">Salvar</button></form>`;
        App.utils.openModal("Novo Item de Estoque", html);
        document.getElementById('stk-form').onsubmit = (e) => {
            e.preventDefault();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'stock')).push({
                name: document.getElementById('s-n').value, quantity: document.getElementById('s-q').value,
                unit: document.getElementById('s-u').value, category: document.getElementById('s-c').value
            });
            App.utils.closeModal();
        }
    };

    // Utils
    window.toggleInst = (val, id) => document.getElementById(id).classList.toggle('hidden', !['Cartão', 'Boleto'].includes(val));
    window.delTx = (path, id) => { if(confirm("Excluir?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `${path}/${id}`)).remove(); };
    window.settleTx = (type, id) => {
        if(confirm("Confirmar baixa?")) {
            const upd = { status: type==='receivable'?'Recebido':'Pago' };
            if(type==='receivable') upd.receivedDate = new Date().toISOString(); else upd.paidDate = new Date().toISOString();
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/${type}/${id}`)).update(upd);
        }
    };
})();
