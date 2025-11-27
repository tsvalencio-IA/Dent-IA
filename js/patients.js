// ==================================================================
// MÓDULO PACIENTES: CRUD e Prontuário com IA
// ==================================================================
(function() {
    const App = window.DentistaApp;
    let selectedFile = null;
    let currentChatRef = null;

    window.renderPatientManager = function() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="p-6 bg-white shadow-lg rounded-2xl h-[calc(100vh-100px)] flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-indigo-800"><i class='bx bxs-group mr-2'></i> Meus Pacientes</h2>
                    <button onclick="openPatientModal()" class="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 shadow-md font-bold flex items-center"><i class='bx bx-user-plus mr-2'></i> Novo Paciente</button>
                </div>
                <div class="flex-grow overflow-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-indigo-50 text-indigo-900 sticky top-0"><tr><th class="p-4 rounded-tl-lg">Nome</th><th class="p-4">Contato</th><th class="p-4 rounded-tr-lg text-right">Ações</th></tr></thead>
                        <tbody id="pat-list" class="divide-y divide-gray-100"></tbody>
                    </table>
                </div>
            </div>`;
        
        const list = document.getElementById('pat-list');
        App.data.patients.forEach(p => {
            list.innerHTML += `
                <tr class="hover:bg-gray-50 group transition">
                    <td class="p-4">
                        <div class="font-bold text-gray-800 text-lg">${p.name}</div>
                        <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">${p.treatmentType}</span>
                    </td>
                    <td class="p-4 text-gray-500 text-sm">
                        <div><i class='bx bx-envelope'></i> ${p.email}</div>
                        <div><i class='bx bx-phone'></i> ${p.phone}</div>
                    </td>
                    <td class="p-4 text-right opacity-80 group-hover:opacity-100">
                        <button onclick="openJournal('${p.id}')" class="bg-cyan-50 text-cyan-600 p-2 rounded hover:bg-cyan-100 mr-1" title="Prontuário"><i class='bx bx-file text-xl'></i></button>
                        <button onclick="openPatientModal('${p.id}')" class="bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100 mr-1" title="Editar"><i class='bx bx-edit text-xl'></i></button>
                        <button onclick="delPat('${p.id}')" class="bg-red-50 text-red-500 p-2 rounded hover:bg-red-100" title="Excluir"><i class='bx bx-trash text-xl'></i></button>
                    </td>
                </tr>`;
        });
    };

    window.openPatientModal = function(pid) {
        const p = pid ? App.data.patients.find(x => x.id === pid) : {};
        const isEdit = !!pid;
        const html = `
            <form id="pat-form" class="grid gap-4 text-sm">
                <input id="p-id" type="hidden" value="${pid||''}">
                <div><label class="font-bold">Nome Completo</label><input id="p-n" class="w-full border p-2 rounded" value="${p.name||''}" required></div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="font-bold">Email</label><input id="p-e" type="email" class="w-full border p-2 rounded" value="${p.email||''}"></div>
                    <div><label class="font-bold">Telefone</label><input id="p-p" class="w-full border p-2 rounded" value="${p.phone||''}"></div>
                </div>
                <div><label class="font-bold">Tratamento</label><select id="p-t" class="w-full border p-2 rounded"><option>Geral</option><option>Ortodontia</option><option>Implante</option><option>Estética</option></select></div>
                <div><label class="font-bold">Meta Clínica</label><textarea id="p-g" class="w-full border p-2 rounded" rows="3">${p.treatmentGoal||''}</textarea></div>
                <button class="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700">Salvar Ficha</button>
            </form>`;
        App.utils.openModal(isEdit?"Editar Paciente":"Novo Paciente", html);
        
        document.getElementById('pat-form').onsubmit = (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('p-n').value, email: document.getElementById('p-e').value,
                phone: document.getElementById('p-p').value, treatmentType: document.getElementById('p-t').value,
                treatmentGoal: document.getElementById('p-g').value
            };
            const id = document.getElementById('p-id').value;
            if(id) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `patients/${id}`)).update(data);
            else { data.createdAt = new Date().toISOString(); App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients')).push(data); }
            App.utils.closeModal();
        };
    };

    window.delPat = (id) => { if(confirm("Apagar paciente e todo histórico?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `patients/${id}`)).remove(); };

    // --- PRONTUÁRIO DIGITAL ---
    window.openJournal = function(pid) {
        if(currentChatRef) currentChatRef.off();
        const p = App.data.patients.find(x => x.id === pid);
        
        const html = `
            <div class="flex justify-between items-start bg-indigo-50 p-4 rounded-lg mb-4">
                <div><h3 class="font-bold text-xl text-indigo-900">${p.name}</h3><p class="text-sm text-indigo-600">${p.treatmentType}</p></div>
                <div class="text-right text-xs text-gray-500 max-w-xs">${p.treatmentGoal || 'Sem meta definida.'}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
                <div class="border rounded-lg flex flex-col bg-white overflow-hidden">
                    <div class="bg-gray-100 p-2 font-bold text-xs text-gray-500 uppercase">Histórico Financeiro</div>
                    <div id="p-fin-hist" class="flex-grow overflow-auto p-2 space-y-2">Carregando...</div>
                </div>
                <div class="border rounded-lg flex flex-col bg-white overflow-hidden relative">
                    <div class="bg-gray-100 p-2 font-bold text-xs text-gray-500 uppercase">Evolução Clínica</div>
                    <div id="chat-box" class="flex-grow overflow-auto p-3 space-y-2 bg-slate-50"></div>
                    <div id="file-prev" class="hidden text-xs text-indigo-600 px-2 pt-1 bg-white truncate">📎 Arquivo selecionado</div>
                    <div class="p-2 border-t flex gap-2 bg-white">
                        <button onclick="document.getElementById('c-file').click()" class="text-gray-400 hover:text-indigo-600"><i class='bx bx-paperclip text-xl'></i></button>
                        <input id="c-file" type="file" class="hidden" accept="image/*" onchange="window.selFile(this)">
                        <input id="c-msg" class="flex-grow border rounded-full px-3 text-sm" placeholder="Escreva a evolução...">
                        <button onclick="sendMsg('${pid}')" class="bg-indigo-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center shadow"><i class='bx bxs-send'></i></button>
                        <button onclick="callAI('${pid}')" class="bg-purple-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center shadow"><i class='bx bxs-magic-wand'></i></button>
                    </div>
                </div>
            </div>`;
        App.utils.openModal("Prontuário", html, "max-w-5xl");

        // 1. Carrega Financeiro do Paciente
        const finDiv = document.getElementById('p-fin-hist');
        const recs = App.data.receivables.filter(r => r.patientId === pid);
        finDiv.innerHTML = recs.length ? recs.map(r => `
            <div class="flex justify-between p-2 border rounded bg-white text-xs">
                <div><span class="font-bold">${r.description}</span><br><span class="text-gray-400">${App.utils.formatDate(r.dueDate)}</span></div>
                <div class="text-right"><span class="font-bold ${r.status==='Recebido'?'text-green-600':'text-yellow-600'}">${r.status}</span><br>${App.utils.formatCurrency(r.amount)}</div>
            </div>`).join('') : '<p class="text-center text-gray-400 text-xs mt-4">Sem histórico.</p>';

        // 2. Carrega Chat
        currentChatRef = App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${pid}/journal`);
        currentChatRef.limitToLast(30).on('value', s => {
            const box = document.getElementById('chat-box');
            if(!box) return;
            box.innerHTML = '';
            if(s.exists()) s.forEach(c => {
                const m = c.val();
                const isMe = m.author === 'Dentista';
                const img = m.media ? `<br><a href="${m.media.url}" target="_blank"><img src="${m.media.url}" class="h-20 rounded mt-1 border"></a>` : '';
                box.innerHTML += `<div class="w-full flex ${isMe?'justify-end':'justify-start'}"><div class="max-w-[85%] p-2 rounded-lg text-sm ${isMe?'bg-indigo-600 text-white rounded-br-none':'bg-white border rounded-bl-none'}"><div class="text-[9px] uppercase opacity-75 mb-0.5">${m.author}</div>${m.text}${img}</div></div>`;
            });
            box.scrollTop = box.scrollHeight;
        });
    };

    window.selFile = (input) => {
        if(input.files[0]) {
            selectedFile = input.files[0];
            document.getElementById('file-prev').textContent = "📎 " + selectedFile.name;
            document.getElementById('file-prev').classList.remove('hidden');
        }
    };

    window.sendMsg = async (pid) => {
        const txt = document.getElementById('c-msg').value;
        if(!txt && !selectedFile) return;
        
        let media = null;
        if(selectedFile) {
            try { media = await window.uploadToCloudinary(selectedFile); }
            catch(e) { alert("Erro upload"); return; }
        }

        App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${pid}/journal`).push({
            text: txt || (media?"Enviou anexo.":""), author: 'Dentista', media, timestamp: new Date().toISOString()
        });
        document.getElementById('c-msg').value = '';
        selectedFile = null;
        document.getElementById('file-prev').classList.add('hidden');
    };

    window.callAI = async (pid) => {
        const p = App.data.patients.find(x => x.id === pid);
        const snaps = await App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${pid}/journal`).limitToLast(5).once('value');
        let hist = "";
        snaps.forEach(s => hist += `${s.val().author}: ${s.val().text}\n`);
        
        const btn = document.querySelector('button[onclick*="callAI"]');
        btn.innerHTML = '...'; btn.disabled = true;

        try {
            const resp = await window.callGeminiAPI(
                `ATUE COMO: Dentista Sênior. PACIENTE: ${p.name} (${p.treatmentType}). HISTÓRICO: ${hist}. OBJETIVO: Sugira a próxima conduta clínica ou resposta técnica.`, 
                "Analise o caso."
            );
            document.getElementById('c-msg').value = "🤖 " + resp;
        } catch(e) { alert("Erro IA"); }
        finally { btn.innerHTML = "<i class='bx bxs-magic-wand'></i>"; btn.disabled = false; }
    };

})();
