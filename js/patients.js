(function() {
    const App = window.DentistaApp;
    let currentChatRef = null;

    window.renderPatientManager = function() {
        document.getElementById('main-content').innerHTML = `
            <div class="p-8 bg-white shadow-lg rounded-2xl">
                <div class="flex justify-between mb-6">
                    <h2 class="text-2xl font-bold text-indigo-800">Pacientes</h2>
                    <button onclick="window.openPatientModal()" class="bg-indigo-600 text-white px-4 py-2 rounded shadow">Novo Paciente</button>
                </div>
                <div class="overflow-x-auto"><table class="w-full text-left"><thead class="bg-gray-100 text-gray-600"><tr><th class="p-3">Nome</th><th class="p-3">Contato</th><th class="p-3 text-right">Ações</th></tr></thead><tbody id="patient-list"></tbody></table></div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-auto">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        const tbody = document.getElementById('patient-list');
        if(App.data.patients.length) {
            App.data.patients.forEach(p => {
                tbody.innerHTML += `<tr class="border-b hover:bg-gray-50"><td class="p-3 font-medium">${p.name}<br><span class="text-xs text-gray-500">${p.treatmentType}</span></td><td class="p-3 text-sm">${p.email||'-'}<br>${p.phone||'-'}</td><td class="p-3 text-right flex justify-end gap-2"><button onclick="window.openRecModal('${p.id}')" class="text-green-600 p-2" title="Cobrar"><i class='bx bx-money'></i></button><button onclick="window.openJournal('${p.id}')" class="text-cyan-600 p-2" title="Prontuário"><i class='bx bx-file'></i></button><button onclick="window.openPatientModal('${p.id}')" class="text-blue-600 p-2" title="Editar"><i class='bx bx-edit'></i></button><button onclick="window.delPat('${p.id}')" class="text-red-500 p-2"><i class='bx bx-trash'></i></button></td></tr>`;
            });
        } else tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">Nenhum paciente.</td></tr>';
    };

    window.openPatientModal = function(pid = null) {
        const p = pid ? App.data.patients.find(x => x.id === pid) : null;
        const html = `
            <form id="form-pat" class="grid grid-cols-2 gap-3 text-sm">
                <input type="hidden" id="p-id" value="${pid || ''}">
                <div class="col-span-2"><label class="font-bold">Nome</label><input id="p-name" class="w-full border p-2 rounded" value="${p?p.name:''}" required></div>
                <div><label class="font-bold">Email</label><input id="p-email" class="w-full border p-2 rounded" value="${p?p.email:''}"></div>
                <div><label class="font-bold">Telefone</label><input id="p-phone" class="w-full border p-2 rounded" value="${p?p.phone:''}"></div>
                <div class="col-span-2"><label class="font-bold">Endereço</label><input id="p-addr" class="w-full border p-2 rounded" value="${p?p.address:''}"></div>
                <div><label class="font-bold">Tratamento</label><select id="p-type" class="w-full border p-2 rounded"><option>Geral</option><option>Ortodontia</option><option>Implante</option></select></div>
                <button class="col-span-2 bg-green-600 text-white py-2 rounded font-bold mt-2">Salvar</button>
            </form>`;
        App.utils.openModal(p?'Editar':'Novo', html);
        document.getElementById('form-pat').onsubmit = (e) => {
            e.preventDefault();
            const d = { name: document.getElementById('p-name').value, email: document.getElementById('p-email').value, phone: document.getElementById('p-phone').value, address: document.getElementById('p-addr').value, treatmentType: document.getElementById('p-type').value };
            const id = document.getElementById('p-id').value;
            if(id) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients/'+id)).update(d);
            else App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients')).push({...d, createdAt: new Date().toISOString()});
            App.utils.closeModal();
        };
    };

    window.openJournal = function(id) {
        if(currentChatRef) currentChatRef.off();
        const p = App.data.patients.find(x => x.id === id);
        const html = `
            <div class="bg-indigo-50 p-3 rounded mb-3 flex justify-between text-sm"><div><h3 class="font-bold">${p.name}</h3></div><span>${p.treatmentType}</span></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-[450px]">
                <div class="border p-2 rounded bg-white overflow-y-auto" id="j-fin"></div>
                <div class="border p-2 rounded bg-white flex flex-col"><div id="chat" class="flex-grow overflow-y-auto p-2 mb-2"></div><div class="flex gap-2"><input id="c-msg" class="flex-grow border p-1 rounded"><button onclick="sendC('${id}')" class="bg-indigo-600 text-white px-3 rounded">></button><button onclick="askAI('${id}')" class="bg-purple-600 text-white px-3 rounded">🤖</button></div></div>
            </div>`;
        App.utils.openModal("Prontuário", html, 'max-w-5xl');
        
        const finDiv = document.getElementById('j-fin');
        const recs = App.data.receivables.filter(r => r.patientId === id);
        recs.forEach(r => finDiv.innerHTML += `<div class="border-b pb-1 mb-1 text-sm flex justify-between"><span>${r.description}</span><b>${App.utils.formatCurrency(r.amount)}</b></div>`);

        currentChatRef = App.db.ref(App.paths.patientJournal(id));
        currentChatRef.limitToLast(50).on('child_added', s => {
            const m = s.val();
            const d = document.createElement('div');
            d.className = `p-2 rounded mb-1 text-sm max-w-[90%] ${m.author==='Dentista'?'ml-auto bg-indigo-100':'mr-auto bg-gray-100'}`;
            d.innerHTML = `<b>${m.author}</b>: ${m.text}`;
            document.getElementById('chat').appendChild(d);
            document.getElementById('chat').scrollTop = 9999;
        });
    };

    window.sendC = (id) => {
        const txt = document.getElementById('c-msg').value;
        if(txt) { App.db.ref(App.paths.patientJournal(id)).push({ text: txt, author: 'Dentista', timestamp: new Date().toISOString() }); document.getElementById('c-msg').value = ''; }
    };

    // IA EM JANELA FLUTUANTE (Correção Final)
    window.askAI = async (id) => {
        const p = App.data.patients.find(x => x.id === id);
        const snaps = await App.db.ref(App.paths.patientJournal(id)).limitToLast(5).once('value');
        let hist = ""; snaps.forEach(s => hist += `${s.val().author}: ${s.val().text}\n`);
        const prompt = `Paciente: ${p.name}. Histórico: ${hist}. Sugira conduta.`;
        try {
            const resp = await window.callGeminiAPI(prompt, "Analise.");
            const html = `<div class="text-sm mb-2">Sugestão da IA:</div><textarea id="ai-res" class="w-full h-32 border p-2 text-sm bg-purple-50">${resp}</textarea><div class="flex justify-end gap-2 mt-2"><button onclick="document.getElementById('ai-over').remove()" class="text-gray-500">Fechar</button><button onclick="useAI()" class="bg-purple-600 text-white px-3 py-1 rounded">Usar</button></div>`;
            const overlay = document.createElement('div'); overlay.id='ai-over'; overlay.className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]'; overlay.innerHTML=`<div class="bg-white p-4 rounded shadow-xl w-96">${html}</div>`; document.body.appendChild(overlay);
            window.useAI = () => { document.getElementById('c-msg').value = "🤖 " + document.getElementById('ai-res').value; document.getElementById('ai-over').remove(); };
        } catch(e) { alert("Erro IA: " + e.message); }
    };

    window.delPat = (id) => { if(confirm("Excluir?")) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients/'+id)).remove(); };

})();
