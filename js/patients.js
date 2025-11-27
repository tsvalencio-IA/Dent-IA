// ==================================================================
// MÓDULO DE PACIENTES E PRONTUÁRIO
// ==================================================================
(function() {
    const App = window.DentistaApp;
    let currentChatRef = null;

    // Função Principal de Renderização
    window.renderPatientManager = function() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <div class="flex justify-between mb-6">
                    <h2 class="text-2xl font-bold text-indigo-800">Pacientes</h2>
                    <button onclick="openPatientModal()" class="bg-indigo-600 text-white px-4 py-2 rounded shadow">Novo Paciente</button>
                </div>
                <div class="overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-100 text-gray-600"><tr><th class="p-3">Nome</th><th class="p-3">Contato</th><th class="p-3 text-right">Ações</th></tr></thead><tbody id="patient-list-body"></tbody></table></div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-auto">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        
        const tbody = document.getElementById('patient-list-body');
        if(App.data.patients.length > 0) {
            App.data.patients.forEach(p => {
                tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-medium">${p.name}<br><span class="text-xs text-gray-400">${p.treatmentType}</span></td>
                        <td class="p-3 text-sm">${p.email || '-'}<br>${p.phone || '-'}</td>
                        <td class="p-3 text-right flex gap-2 justify-end">
                            <button onclick="openJournal('${p.id}')" class="text-cyan-600 hover:bg-cyan-100 p-2 rounded" title="Prontuário"><i class='bx bx-file text-xl'></i></button>
                            <button onclick="openPatientModal('${p.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded" title="Editar"><i class='bx bx-edit text-xl'></i></button>
                            <button onclick="deletePatient('${p.id}')" class="text-red-500 hover:bg-red-100 p-2 rounded" title="Excluir"><i class='bx bx-trash text-xl'></i></button>
                        </td>
                    </tr>`;
            });
        } else { tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">Nenhum paciente cadastrado.</td></tr>'; }
    };

    // --- CRUD PACIENTE ---
    window.openPatientModal = function(pid = null) {
        const p = pid ? App.data.patients.find(x => x.id === pid) : null;
        const html = `
            <form id="form-pat" class="grid grid-cols-2 gap-3 text-sm">
                <input type="hidden" id="p-id" value="${pid || ''}">
                <div class="col-span-2"><label class="font-bold">Nome</label><input id="p-name" class="w-full border p-2 rounded" value="${p?p.name:''}" required></div>
                <div><label class="font-bold">Email</label><input id="p-email" class="w-full border p-2 rounded" value="${p?p.email:''}"></div>
                <div><label class="font-bold">Telefone</label><input id="p-phone" class="w-full border p-2 rounded" value="${p?p.phone:''}"></div>
                <div><label class="font-bold">CPF</label><input id="p-cpf" class="w-full border p-2 rounded" value="${p?p.cpf:''}"></div>
                <div><label class="font-bold">Tratamento</label><select id="p-type" class="w-full border p-2 rounded"><option>Geral</option><option>Ortodontia</option><option>Implante</option></select></div>
                <div class="col-span-2"><label class="font-bold">Endereço</label><input id="p-address" class="w-full border p-2 rounded" value="${p?p.address:''}"></div>
                <div class="col-span-2"><label class="font-bold">Meta Clínica</label><textarea id="p-goal" class="w-full border p-2 rounded" rows="2">${p?p.treatmentGoal:''}</textarea></div>
                <button class="col-span-2 bg-green-600 text-white py-2 rounded font-bold">Salvar Ficha</button>
            </form>`;
        
        App.utils.openModal(p ? 'Editar Paciente' : 'Novo Paciente', html, 'max-w-xl');
        
        document.getElementById('form-pat').onsubmit = (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('p-name').value,
                email: document.getElementById('p-email').value,
                phone: document.getElementById('p-phone').value,
                cpf: document.getElementById('p-cpf').value,
                address: document.getElementById('p-address').value,
                treatmentType: document.getElementById('p-type').value,
                treatmentGoal: document.getElementById('p-goal').value
            };
            const id = document.getElementById('p-id').value;
            if(id) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients/'+id)).update(data);
            else App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients')).push({...data, createdAt: new Date().toISOString()});
            App.utils.closeModal();
        };
    };

    window.deletePatient = function(id) {
        if(confirm("Excluir paciente?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients/'+id)).remove();
    };

    // --- PRONTUÁRIO E CHAT ---
    window.openJournal = function(id) {
        if(currentChatRef) currentChatRef.off();
        const p = App.data.patients.find(x => x.id === id);
        
        const html = `
            <div class="bg-indigo-50 p-4 rounded-xl mb-4 text-sm flex justify-between">
                <div><h3 class="font-bold text-indigo-900">${p.name}</h3><p>${p.email || ''} | ${p.phone || ''}</p></div>
                <span class="bg-white px-2 py-1 rounded text-xs font-bold text-indigo-600 shadow-sm">${p.treatmentType}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-[450px]">
                <div class="border p-3 rounded-xl bg-white flex flex-col"><h4 class="font-bold text-xs text-gray-500 mb-2">FINANCEIRO</h4><div id="journal-fin" class="flex-grow overflow-y-auto text-sm space-y-2"></div></div>
                <div class="border p-3 rounded-xl bg-white flex flex-col"><h4 class="font-bold text-xs text-gray-500 mb-2">CHAT</h4>
                    <div id="chat-area" class="flex-grow overflow-y-auto p-2 bg-gray-50 rounded mb-2"></div>
                    <div class="flex gap-2">
                        <input id="chat-msg" class="flex-grow border p-2 rounded text-sm" placeholder="Mensagem...">
                        <button onclick="sendChat('${id}', 'Dentista')" class="bg-indigo-600 text-white p-2 rounded"><i class='bx bxs-send'></i></button>
                        <button onclick="askAI('${id}')" class="bg-purple-600 text-white p-2 rounded" title="IA"><i class='bx bxs-magic-wand'></i></button>
                    </div>
                </div>
            </div>`;
        
        App.utils.openModal("Prontuário", html, 'max-w-6xl');

        // Carrega Financeiro
        const finDiv = document.getElementById('journal-fin');
        const financials = App.data.receivables.filter(r => r.patientId === id);
        if(financials.length) {
            financials.forEach(r => {
                finDiv.innerHTML += `<div class="border-b pb-1 flex justify-between"><span>${r.description}</span> <b>${App.utils.formatCurrency(r.amount)}</b></div>`;
            });
        } else { finDiv.innerHTML = '<p class="text-gray-400 italic">Sem registros.</p>'; }

        // Carrega Chat
        currentChatRef = App.db.ref(`artifacts/${App.config.APP_ID}/patients/${id}/journal`);
        currentChatRef.limitToLast(50).on('child_added', s => {
            const m = s.val();
            const div = document.createElement('div');
            div.className = `p-2 rounded text-sm max-w-[90%] mb-1 ${m.author==='Dentista' ? 'ml-auto bg-indigo-100' : 'mr-auto bg-white border'}`;
            div.innerHTML = `<b>${m.author}</b>: ${m.text}`;
            const area = document.getElementById('chat-area');
            if(area) { area.appendChild(div); area.scrollTop = area.scrollHeight; }
        });
    };

    window.sendChat = function(pid, author, txtOverride) {
        const input = document.getElementById('chat-msg');
        const txt = txtOverride || (input ? input.value : '');
        if(!txt) return;
        
        App.db.ref(`artifacts/${App.config.APP_ID}/patients/${pid}/journal`).push({
            text: txt, author: author, timestamp: new Date().toISOString()
        });
        if(input) input.value = '';
    };

    // IA FLUTUANTE (SEM MISTURAR CHAT)
    window.askAI = async function(pid) {
        const p = App.data.patients.find(x => x.id === pid);
        const btn = document.querySelector('button[title="IA"]');
        if(btn) { btn.innerHTML = '...'; btn.disabled = true; }

        try {
            const snaps = await App.db.ref(`artifacts/${App.config.APP_ID}/patients/${pid}/journal`).limitToLast(5).once('value');
            let hist = "";
            snaps.forEach(s => hist += `${s.val().author}: ${s.val().text}\n`);

            const prompt = `ATUE COMO: Dentista Sênior. PACIENTE: ${p.name}. HISTÓRICO: ${hist}\nTAREFA: Analise e sugira conduta técnica.`;
            const resp = await window.callGeminiAPI(prompt, "Análise.");

            // Modal de Sugestão
            const suggestionHTML = `
                <textarea id="ai-text" class="w-full h-32 p-2 border rounded mb-2 text-sm">${resp}</textarea>
                <div class="flex justify-end gap-2">
                    <button onclick="document.getElementById('ai-modal').remove()" class="text-gray-500">Fechar</button>
                    <button onclick="useSuggestion()" class="bg-purple-600 text-white px-3 py-1 rounded">Usar</button>
                </div>`;
            
            const overlay = document.createElement('div');
            overlay.id = 'ai-modal';
            overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]';
            overlay.innerHTML = `<div class="bg-white p-4 rounded shadow-xl max-w-md w-full">${suggestionHTML}</div>`;
            document.body.appendChild(overlay);

            window.useSuggestion = () => {
                const t = document.getElementById('ai-text').value;
                const inp = document.getElementById('chat-msg');
                if(inp) { inp.value = "🤖 " + t; inp.focus(); }
                document.getElementById('ai-modal').remove();
            };

        } catch(e) { alert("Erro IA: " + e.message); }
        finally { if(btn) { btn.innerHTML = '🤖'; btn.disabled = false; } }
    };

})();
