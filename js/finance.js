// ==================================================================
// MÓDULO FINANCEIRO & ESTOQUE (VERSÃO ERP PROFISSIONAL)
// ==================================================================
(function() {
    const App = window.DentistaApp;

    // Inicializa a tela financeira
    window.initFinanceView = function(container) {
        container.innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <h2 class="text-2xl font-bold text-indigo-800 mb-4 flex items-center">
                    <i class='bx bxs-wallet text-3xl mr-2'></i> Gestão Financeira
                </h2>
                <div class="flex border-b mb-4 overflow-x-auto">
                    <button class="p-3 border-b-2 border-indigo-600 text-indigo-700 font-bold whitespace-nowrap" onclick="renderStockList()">📦 Estoque</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600 whitespace-nowrap" onclick="renderReceivablesList()">💰 Receitas</button>
                    <button class="p-3 text-gray-500 hover:text-indigo-600 whitespace-nowrap" onclick="renderExpensesList()">💸 Despesas</button>
                </div>
                <div id="fin-content"></div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        window.renderStockList();
    };

    // --- ESTOQUE ---
    window.renderStockList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="font-bold text-gray-700">Inventário Físico</h3>
                <button onclick="openStockModal()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold shadow">+ Novo Item</button>
            </div>
            <div class="overflow-x-auto"><table class="w-full text-sm text-left"><thead class="bg-gray-100 uppercase text-xs"><tr><th class="p-3">Item</th><th class="p-3">Qtd</th><th class="p-3">Categoria</th><th class="p-3">Custo</th><th class="p-3 text-right">Ações</th></tr></thead><tbody id="stock-tb"></tbody></table></div>`;
        
        const tb = document.getElementById('stock-tb');
        if(App.data.stock.length) {
            App.data.stock.forEach(i => {
                tb.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-medium">${i.name}</td>
                        <td class="p-3"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">${i.quantity} ${i.unit}</span></td>
                        <td class="p-3 text-xs text-gray-500">${i.category}</td>
                        <td class="p-3">${App.utils.formatCurrency(i.cost)}</td>
                        <td class="p-3 text-right"><button onclick="delItem('stock','${i.id}')" class="text-red-500 hover:text-red-700"><i class='bx bx-trash'></i></button></td>
                    </tr>`;
            });
        } else tb.innerHTML = '<tr><td colspan="5" class="p-4 text-center italic">Estoque vazio.</td></tr>';
    };

    // --- RECEITAS (COM PARCELAMENTO) ---
    window.renderReceivablesList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="font-bold text-gray-700">Contas a Receber (Fluxo de Caixa)</h3>
                <button onclick="openRecModal()" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-bold shadow">+ Lançar Serviço</button>
            </div>
            <div id="rec-list" class="space-y-2"></div>`;
        
        const list = document.getElementById('rec-list');
        const sorted = [...App.data.receivables].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if(sorted.length) {
            sorted.forEach(r => {
                const isPaid = r.status === 'Recebido';
                const statusBadge = isPaid ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">Recebido</span>' : '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">Aberto</span>';
                const btnAction = isPaid ? '' : `<button onclick="settle('receivable','${r.id}')" class="bg-green-600 text-white px-3 py-1 rounded text-xs ml-2 hover:bg-green-700 shadow">Receber</button>`;
                
                list.innerHTML += `
                    <div class="p-3 border rounded bg-white flex justify-between items-center hover:shadow-md transition">
                        <div>
                            <div class="font-bold text-indigo-900">${r.patientName} <span class="text-xs text-gray-500 font-normal">(${r.paymentMethod})</span></div>
                            <div class="text-xs text-gray-500">${r.description} • Venc: <strong>${App.utils.formatDate(r.dueDate)}</strong></div>
                        </div>
                        <div class="text-right flex items-center gap-2">
                            ${statusBadge}
                            <div class="font-bold text-green-600 ml-2">${App.utils.formatCurrency(r.amount)}</div>
                            ${btnAction}
                            <button onclick="delItem('finance/receivable','${r.id}')" class="text-red-400 hover:text-red-600 ml-2"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>`;
            });
        } else list.innerHTML = '<p class="text-center text-gray-400 py-4">Nenhuma receita lançada.</p>';
    };

    // --- DESPESAS (COM PARCELAMENTO) ---
    window.renderExpensesList = function() {
        document.getElementById('fin-content').innerHTML = `
            <div class="flex justify-between mb-3">
                <h3 class="font-bold text-gray-700">Contas a Pagar</h3>
                <button onclick="openExpModal()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold shadow">+ Lançar Despesa</button>
            </div>
            <div id="exp-list" class="space-y-2"></div>`;
        
        const list = document.getElementById('exp-list');
        const sorted = [...App.data.expenses].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if(sorted.length) {
            sorted.forEach(e => {
                const isPaid = e.status === 'Pago';
                const statusBadge = isPaid ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">Pago</span>' : '<span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-bold">Aberto</span>';
                const btnAction = isPaid ? '' : `<button onclick="settle('expenses','${e.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-xs ml-2 hover:bg-blue-700 shadow">Pagar</button>`;

                list.innerHTML += `
                    <div class="p-3 border rounded bg-white flex justify-between items-center hover:shadow-md transition">
                        <div>
                            <div class="font-bold text-gray-800">${e.supplier} <span class="text-xs text-gray-400">(${e.ref||'S/Ref'})</span></div>
                            <div class="text-xs text-gray-500">${e.description} • Venc: <strong>${App.utils.formatDate(e.dueDate)}</strong></div>
                        </div>
                        <div class="text-right flex items-center gap-2">
                            ${statusBadge}
                            <div class="font-bold text-red-600 ml-2">${App.utils.formatCurrency(e.amount)}</div>
                            ${btnAction}
                            <button onclick="delItem('finance/expenses','${e.id}')" class="text-red-400 hover:text-red-600 ml-2"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>`;
            });
        } else list.innerHTML = '<p class="text-center text-gray-400 py-4">Nenhuma despesa lançada.</p>';
    };

    // --- MODAL RECEITA (COM PARCELAMENTO) ---
    window.openRecModal = function() {
        const opts = App.data.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        const html = `
            <form id="rec-form" class="grid gap-3 text-sm">
                <div class="col-span-2 font-bold text-indigo-600 border-b pb-1">Dados do Serviço</div>
                <div class="col-span-2"><label class="font-bold">Paciente</label><select id="r-p" class="w-full border p-2 rounded">${opts}</select></div>
                <div class="col-span-2"><label class="font-bold">Descrição</label><input id="r-d" class="w-full border p-2 rounded" required placeholder="Ex: Implante + Prótese"></div>
                
                <div class="col-span-2 font-bold text-indigo-600 border-b pb-1 mt-2">Financeiro</div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="font-bold">Valor Total (R$)</label><input id="r-v" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                    <div><label class="font-bold">1º Vencimento</label><input id="r-dt" type="date" class="w-full border p-2 rounded" required></div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="font-bold">Forma Pagto</label><select id="r-py" class="w-full border p-2 rounded" onchange="toggleInstallments(this.value)">
                        <option value="Pix">Pix (À Vista)</option>
                        <option value="Dinheiro">Dinheiro (À Vista)</option>
                        <option value="Débito">Débito (À Vista)</option>
                        <option value="Crédito">Cartão de Crédito</option>
                        <option value="Boleto">Boleto Bancário</option>
                    </select></div>
                    <div id="inst-box" class="hidden">
                        <label class="font-bold">Parcelas</label>
                        <select id="r-inst" class="w-full border p-2 rounded">
                            ${Array.from({length:24}, (_,i)=>`<option value="${i+1}">${i+1}x</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" onclick="App.utils.closeModal()" class="px-4 py-2 bg-gray-200 rounded text-gray-700">Cancelar</button>
                    <button class="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Finalizar Lançamento</button>
                </div>
            </form>`;
        
        App.utils.openModal("Lançar Receita", html);
        
        // Toggle Parcelas
        window.toggleInstallments = (val) => {
            document.getElementById('inst-box').classList.toggle('hidden', !['Crédito', 'Boleto'].includes(val));
        };

        document.getElementById('rec-form').onsubmit = (e) => {
            e.preventDefault();
            const pid = document.getElementById('r-p').value;
            const p = App.data.patients.find(x => x.id === pid);
            const total = parseFloat(document.getElementById('r-v').value);
            const method = document.getElementById('r-py').value;
            const parcels = (method === 'Crédito' || method === 'Boleto') ? parseInt(document.getElementById('r-inst').value) : 1;
            const firstDue = new Date(document.getElementById('r-dt').value);
            const desc = document.getElementById('r-d').value;
            const valParcela = total / parcels;

            // Gera parcelas
            for(let i=0; i<parcels; i++) {
                let dueDate = new Date(firstDue);
                dueDate.setMonth(dueDate.getMonth() + i);
                
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/receivable')).push({
                    patientId: pid, 
                    patientName: p.name, 
                    description: `${desc} (${i+1}/${parcels})`, 
                    amount: valParcela, 
                    status: 'Aberto', 
                    dueDate: dueDate.toISOString().split('T')[0],
                    paymentMethod: method,
                    registeredAt: new Date().toISOString()
                });
            }
            App.utils.closeModal();
            alert("Lançamento realizado com sucesso!");
        };
    };

    // --- MODAL DESPESA (COM PARCELAMENTO) ---
    window.openExpModal = () => {
        const html = `<form id="ex-form" class="grid gap-3 text-sm">
            <div class="col-span-2 font-bold text-red-600 border-b pb-1">Dados da Despesa</div>
            <div class="grid grid-cols-2 gap-2">
                <div><label class="font-bold">Fornecedor</label><input id="e-s" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold">Nota Fiscal/Ref</label><input id="e-nf" class="w-full border p-2 rounded"></div>
            </div>
            <div class="col-span-2"><label class="font-bold">Descrição</label><input id="e-d" class="w-full border p-2 rounded" required></div>
            
            <div class="col-span-2 font-bold text-red-600 border-b pb-1 mt-2">Pagamento</div>
            <div class="grid grid-cols-2 gap-2">
                <div><label class="font-bold">Valor Total</label><input id="e-v" type="number" step="0.01" class="w-full border p-2 rounded" required></div>
                <div><label class="font-bold">1º Vencimento</label><input id="e-dt" type="date" class="w-full border p-2 rounded" required></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div><label class="font-bold">Forma Pagto</label><select id="e-py" class="w-full border p-2 rounded" onchange="toggleExpInstallments(this.value)">
                    <option value="Boleto">Boleto</option><option value="Pix">Pix</option><option value="Transferência">Transferência</option><option value="Cartão">Cartão de Crédito</option>
                </select></div>
                <div id="exp-inst-box" class="hidden">
                    <label class="font-bold">Parcelas</label>
                    <select id="e-inst" class="w-full border p-2 rounded">${Array.from({length:24}, (_,i)=>`<option value="${i+1}">${i+1}x</option>`).join('')}</select>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <button type="button" onclick="App.utils.closeModal()" class="px-4 py-2 bg-gray-200 rounded text-gray-700">Cancelar</button>
                <button class="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Finalizar Despesa</button>
            </div>
        </form>`;
        App.utils.openModal("Lançar Despesa", html);
        
        window.toggleExpInstallments = (val) => {
            document.getElementById('exp-inst-box').classList.toggle('hidden', !['Boleto', 'Cartão'].includes(val));
        };

        document.getElementById('ex-form').onsubmit = (e) => {
            e.preventDefault();
            const total = parseFloat(document.getElementById('e-v').value);
            const method = document.getElementById('e-py').value;
            const parcels = (method === 'Boleto' || method === 'Cartão') ? parseInt(document.getElementById('e-inst').value) : 1;
            const firstDue = new Date(document.getElementById('e-dt').value);
            const desc = document.getElementById('e-d').value;
            const sup = document.getElementById('e-s').value;
            const nf = document.getElementById('e-nf').value;
            const valParcela = total / parcels;

            for(let i=0; i<parcels; i++) {
                let dueDate = new Date(firstDue);
                dueDate.setMonth(dueDate.getMonth() + i);
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'finance/expenses')).push({
                    supplier: sup, ref: nf, description: `${desc} (${i+1}/${parcels})`, 
                    amount: valParcela, status: 'Aberto', dueDate: dueDate.toISOString().split('T')[0], 
                    paymentMethod: method, registeredAt: new Date().toISOString()
                });
            }
            App.utils.closeModal();
            alert("Despesa lançada com sucesso!");
        };
    };

    // --- MODAL ESTOQUE ---
    window.openStockModal = () => {
        const html = `<form id="st-form" class="grid gap-2 text-sm"><label class="font-bold">Nome</label><input id="s-n" class="border p-2 rounded" required><div class="grid grid-cols-2 gap-2"><div><label>Qtd</label><input id="s-q" type="number" class="border p-2 rounded" required></div><div><label>Unidade</label><input id="s-u" class="border p-2 rounded" required></div></div><label>Categoria</label><select id="s-c" class="border p-2 rounded"><option>Consumo</option><option>Venda</option><option>Instrumental</option></select><div class="flex justify-end gap-2 mt-2"><button type="button" onclick="App.utils.closeModal()" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button><button class="px-4 py-2 bg-green-600 text-white rounded font-bold">Salvar Item</button></div></form>`;
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

    // --- AÇÕES ---
    window.delItem = (path, id) => { if(confirm("Excluir permanentemente?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `${path}/${id}`)).remove(); };
    window.settle = (type, id) => {
        if(!confirm(type==='receivable' ? "Confirmar recebimento?" : "Confirmar pagamento?")) return;
        const up = { status: type==='receivable' ? 'Recebido' : 'Pago' };
        if(type === 'receivable') up.receivedDate = new Date().toISOString(); else up.paidDate = new Date().toISOString();
        App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `finance/${type}/${id}`)).update(up);
    };

})();
