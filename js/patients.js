// ==================================================================
// MÓDULO PACIENTES: Prontuário, Chat e IA (Versão Completa)
// ==================================================================
(function() {
    const App = window.DentistaApp;
    let selectedFile = null;
    let currentChatRef = null;

    // --- LISTA DE PACIENTES (TELA PRINCIPAL) ---
    window.renderPatientManager = function() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-60px)]">
                <div class="bg-white p-4 shadow-sm border-b flex justify-between items-center shrink-0">
                    <h2 class="text-xl font-bold text-indigo-800 flex items-center"><i class='bx bxs-group mr-2'></i> Pacientes</h2>
                    <button onclick="openPatientModal()" class="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 flex items-center transition transform active:scale-95">
                        <i class='bx bx-plus text-lg mr-1'></i> <span class="hidden md:inline">Novo Paciente</span>
                    </button>
                </div>
                
                <div class="flex-grow overflow-y-auto p-2 md:p-4 space-y-3 bg-gray-50">
                    <div id="pat-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"></div>
                </div>
            </div>`;
        
        const list = document.getElementById('pat-list');
        if(!App.data.patients || App.data.patients.length === 0) {
            list.innerHTML = '<p class="text-gray-400 text-center col-span-full mt-10 italic">Nenhum paciente cadastrado na base.</p>';
            return;
        }

        App.data.patients.forEach(p => {
            list.innerHTML += `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition duration-200">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-gray-800 text-lg leading-tight">${p.name}</div>
                            <span class="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-indigo-100 mt-1 inline-block">${p.treatmentType || 'Geral'}</span>
                        </div>
                        <button onclick="openJournal('${p.id}')" class="bg-indigo-600 text-white p-2 rounded-full shadow hover:bg-indigo-700 transition" title="Abrir Prontuário">
                            <i class='bx bx-folder-open'></i>
                        </button>
                    </div>
                    <div class="text-gray-500 text-sm space-y-1 mb-3">
                        <div class="flex items-center gap-2"><i class='bx bx-phone text-gray-400'></i> ${p.phone || '-'}</div>
                        <div class="flex items-center gap-2 truncate"><i class='bx bx-envelope text-gray-400'></i> ${p.email || '-'}</div>
                    </div>
                    <div class="pt-3 border-t border-gray-50 flex justify-end gap-2">
                        <button onclick="openPatientModal('${p.id}')" class="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition" title="Editar"><i class='bx bx-edit text-xl'></i></button>
                        <button onclick="delPat('${p.id}')" class="text-red-400 hover:bg-red-50 p-1.5 rounded transition" title="Excluir"><i class='bx bx-trash text-xl'></i></button>
                    </div>
                </div>`;
        });
    };

    // --- CRUD PACIENTE (Modal) ---
    window.openPatientModal = function(pid) {
        const p = pid ? App.data.patients.find(x => x.id === pid) : {};
        const isEdit = !!pid;
        const html = `
            <form id="pat-form" class="grid gap-4 text-sm">
                <input id="p-id" type="hidden" value="${pid||''}">
                <div><label class="font-bold text-gray-700 block mb-1">Nome Completo</label><input id="p-n" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="${p.name||''}" required placeholder="Nome do paciente"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label class="font-bold text-gray-700 block mb-1">Email</label><input id="p-e" type="email" class="w-full border p-3 rounded-lg" value="${p.email||''}" placeholder="email@exemplo.com"></div>
                    <div><label class="font-bold text-gray-700 block mb-1">Telefone</label><input id="p-p" class="w-full border p-3 rounded-lg" value="${p.phone||''}" placeholder="(00) 00000-0000"></div>
                </div>
                <div>
                    <label class="font-bold text-gray-700 block mb-1">Tratamento Principal</label>
                    <select id="p-t" class="w-full border p-3 rounded-lg bg-white">
                        <option>Geral</option><option>Ortodontia</option><option>Implante</option><option>Estética</option><option>Harmonização</option><option>Odontopediatria</option>
                    </select>
                </div>
                <div><label class="font-bold text-gray-700 block mb-1">Meta Clínica / Queixa</label><textarea id="p-g" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows="3" placeholder="Ex: Paciente deseja clareamento e alinhamento...">${p.treatmentGoal||''}</textarea></div>
                <button class="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition transform active:scale-95 mt-2">${isEdit?'Salvar Alterações':'Cadastrar Paciente'}</button>
            </form>`;
        App.utils.openModal(isEdit?"Editar Paciente":"Novo Paciente", html);
        
        if(isEdit && p.treatmentType) setTimeout(() => { 
            const sel = document.getElementById('p-t');
            if(sel) sel.value = p.treatmentType; 
        }, 50);

        document.getElementById('pat-form').onsubmit = (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('p-n').value, email: document.getElementById('p-e').value,
                phone: document.getElementById('p-p').value, treatmentType: document.getElementById('p-t').value,
                treatmentGoal: document.getElementById('p-g').value
            };
            const id = document.getElementById('p-id').value;
            
            if(id) App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `patients/${id}`)).update(data);
            else { 
                data.createdAt = new Date().toISOString(); 
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients')).push(data); 
            }
            App.utils.closeModal();
        };
    };

    window.delPat = (id) => { 
        if(confirm("ATENÇÃO: Tem certeza que deseja excluir este paciente?\n\nIsso apagará permanentemente todo o histórico clínico e financeiro dele.")) {
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, `patients/${id}`)).remove();
        }
    };

    // --- PRONTUÁRIO DIGITAL (CHAT & IA) ---
    window.openJournal = function(pid) {
        if(currentChatRef) currentChatRef.off();
        const p = App.data.patients.find(x => x.id === pid);
        if(!p) return;

        const html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-indigo-50 p-4 rounded-lg mb-4 border border-indigo-100">
                <div>
                    <h3 class="font-bold text-xl text-indigo-900">${p.name}</h3>
                    <div class="text-xs text-indigo-600 mt-1 flex gap-2">
                        <span class="bg-white px-2 rounded border border-indigo-200 shadow-sm">${p.treatmentType}</span>
                        <span>${p.phone || 'Sem telefone'}</span>
                    </div>
                </div>
                <div class="mt-2 md:mt-0 text-right w-full md:w-auto">
                    <div class="text-[10px] text-gray-500 uppercase font-bold">Meta Clínica</div>
                    <div class="text-xs text-gray-700 italic max-w-xs ml-auto bg-white/50 p-1 rounded">${p.treatmentGoal || 'Não definida'}</div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-4 h-[60vh] md:h-[500px]">
                
                <div class="flex-grow flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden relative">
                    <div class="bg-gray-50 p-2 border-b text-center font-bold text-gray-600 text-xs uppercase tracking-widest flex justify-between px-4 items-center">
                        <span>Evolução Clínica</span>
                        <i class='bx bx-history text-gray-400'></i>
                    </div>
                    
                    <div id="chat-box" class="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50">
                        <div class="flex justify-center h-full items-center"><div class="loader-spinner border-t-indigo-500 w-8 h-8"></div></div>
                    </div>

                    <div id="file-prev" class="hidden px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex justify-between items-center animate-fade-in">
                        <span class="text-xs text-indigo-700 font-medium flex items-center"><i class='bx bx-paperclip mr-1'></i> Arquivo pronto para envio</span>
                        <button onclick="clearFile()" class="text-red-500 hover:text-red-700"><i class='bx bx-x text-lg'></i></button>
                    </div>

                    <div class="p-3 border-t bg-white flex items-center gap-2">
                        <button onclick="document.getElementById('c-file').click()" class="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition" title="Anexar Imagem/Raio-X"><i class='bx bx-camera text-xl'></i></button>
                        <input id="c-file" type="file" class="hidden" accept="image/*" onchange="window.selFile(this)">
                        
                        <input id="c-msg" class="flex-grow bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Descreva o procedimento realizado..." onkeydown="if(event.key==='Enter') sendMsg('${pid}')">
                        
                        <button onclick="sendMsg('${pid}')" class="bg-indigo-600 text-white rounded-full p-2.5 shadow-md hover:bg-indigo-700 transition transform active:scale-95 flex items-center justify-center" title="Enviar">
                            <i class='bx bxs-send'></i>
                        </button>
                        
                        <button onclick="callAI('${pid}')" class="bg-purple-600 text-white rounded-full p-2.5 shadow-md hover:bg-purple-700 transition transform active:scale-95 flex items-center justify-center relative group ml-1" title="Gerar Parecer IA">
                            <i class='bx bxs-magic-wand'></i>
                        </button>
                    </div>
                </div>

                <div class="hidden md:flex flex-col w-1/3 border rounded-xl bg-white shadow-sm overflow-hidden">
                    <div class="bg-gray-50 p-2 border-b text-center font-bold text-gray-600 text-xs uppercase tracking-widest">Histórico Financeiro</div>
                    <div id="p-fin-hist" class="flex-grow overflow-y-auto p-2 space-y-2 bg-white">Carregando...</div>
                </div>
            </div>`;
        
        App.utils.openModal("Prontuário Digital", html, "max-w-6xl");

        // 1. Carrega Histórico Financeiro na lateral
        const finDiv = document.getElementById('p-fin-hist');
        if(finDiv) {
            const recs = App.data.receivables.filter(r => r.patientId === pid).sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate));
            if (recs.length > 0) {
                finDiv.innerHTML = recs.map(r => `
                    <div class="p-2 border rounded-lg bg-white text-xs hover:shadow-sm transition cursor-default">
                        <div class="flex justify-between font-bold text-gray-700 mb-1">
                            <span class="truncate max-w-[120px]" title="${r.description}">${r.description}</span>
                            <span class="${r.status==='Recebido'?'text-green-600':'text-yellow-600'}">${r.status}</span>
                        </div>
                        <div class="flex justify-between text-gray-400">
                            <span>${App.utils.formatDate(r.dueDate)}</span>
                            <span>${App.utils.formatCurrency(r.amount)}</span>
                        </div>
                    </div>`).join('');
            } else {
                finDiv.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-gray-400 text-xs italic"><i class="bx bx-ghost text-2xl mb-1"></i>Sem registros.</div>';
            }
        }

        // 2. Carrega Chat em tempo real
        currentChatRef = App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${pid}/journal`);
        currentChatRef.limitToLast(50).on('value', s => {
            const box = document.getElementById('chat-box');
            if(!box) return;
            box.innerHTML = '';
            if(s.exists()) {
                s.forEach(c => {
                    const m = c.val();
                    const isMe = m.author === 'Dentista';
                    
                    // Tratamento de Imagem
                    const img = m.media ? `<br><a href="${m.media.url}" target="_blank" class="block mt-2 group"><img src="${m.media.url}" class="h-32 rounded-lg border border-black/10 group-hover:opacity-90 transition"></a>` : '';
                    
                    // Tratamento de Texto da IA
                    let content = m.text;
                    let aiClass = "";
                    if(content.startsWith("🤖 [IA]:")) {
                        content = content.replace("🤖 [IA]:", "");
                        aiClass = "border-l-4 border-purple-400 pl-2"; // Destaque visual para IA
                    }

                    box.innerHTML += `
                    <div class="flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in">
                        <div class="max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}">
                            <div class="text-[9px] uppercase font-bold opacity-70 mb-1 flex justify-between items-center w-full gap-4">
                                <span>${m.author}</span>
                                <span>${App.utils.formatDateTime(m.timestamp).split(' ')[1]}</span>
                            </div>
                            <div class="leading-relaxed ${aiClass}">${content}</div>
                            ${img}
                        </div>
                    </div>`;
                });
                box.scrollTop = box.scrollHeight;
            } else {
                box.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-gray-400 text-sm opacity-50"><i class="bx bx-message-dots text-5xl mb-3"></i><p>Prontuário vazio.</p><p class="text-xs">Inicie a evolução abaixo.</p></div>';
            }
        });
    };

    // --- FUNÇÕES AUXILIARES DO CHAT ---
    window.selFile = (input) => {
        if(input.files[0]) {
            selectedFile = input.files[0];
            document.getElementById('file-prev').classList.remove('hidden');
        }
    };
    window.clearFile = () => { 
        selectedFile = null; 
        document.getElementById('c-file').value = ''; 
        document.getElementById('file-prev').classList.add('hidden'); 
    };

    window.sendMsg = async (pid) => {
        const txt = document.getElementById('c-msg').value;
        if(!txt && !selectedFile) return;
        
        // Estado de Carregamento no Botão
        const btn = document.querySelector('button[onclick*="sendMsg"]');
        const oldIcon = btn.innerHTML;
        btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>'; 
        btn.disabled = true;

        let media = null;
        if(selectedFile) {
            try { media = await window.uploadToCloudinary(selectedFile); }
            catch(e) { 
                alert("Erro ao enviar imagem. Verifique sua conexão."); 
                btn.innerHTML = oldIcon; 
                btn.disabled = false; 
                return; 
            }
        }

        App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${pid}/journal`).push({
            text: txt || (media ? "📎 [Anexo Enviado]" : ""), 
            author: 'Dentista', 
            media, 
            timestamp: new Date().toISOString()
        });
        
        document.getElementById('c-msg').value = '';
        window.clearFile();
        btn.innerHTML = oldIcon; 
        btn.disabled = false;
        
        // Mantém o foco para digitar rápido
        setTimeout(() => { 
            const input = document.getElementById('c-msg');
            if(input) input.focus(); 
        }, 100);
    };

    // --- INTEGRAÇÃO IA COM MODAL FLUTUANTE ---
    window.callAI = async (pid) => {
        const p = App.data.patients.find(x => x.id === pid);
        const btn = document.querySelector('button[onclick*="callAI"]');
        const oldHtml = btn.innerHTML;
        
        btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>';
        btn.disabled = true;

        try {
            // Coleta contexto dos últimos 10 mensagens
            const snaps = await App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${pid}/journal`).limitToLast(10).once('value');
            let hist = "";
            if(snaps.exists()) snaps.forEach(s => hist += `[${s.val().author}]: ${s.val().text}\n`);

            // Chamada à API Gemini
            const response = await window.callGeminiAPI(
                `ATUE COMO: Dentista Sênior Especialista. 
                 CONTEXTO DO PACIENTE: ${p.name}, ${p.treatmentType}. Queixa/Meta: ${p.treatmentGoal}.
                 HISTÓRICO RECENTE DA CONVERSA:
                 ${hist}
                 
                 SUA TAREFA: Crie um texto de Evolução Clínica formal ou um Parecer Técnico sugerindo a próxima conduta.
                 REGRAS: Seja direto, técnico e profissional. Não use saudações como "Olá". O texto deve estar pronto para ser copiado para o prontuário.`, 
                "Analise o caso e gere a evolução."
            );

            // Cria o Modal Flutuante (Pop-up)
            const overlay = document.createElement('div');
            overlay.className = "fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in";
            overlay.id = "ai-overlay";
            
            overlay.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                    <div class="bg-gradient-to-r from-purple-700 to-purple-500 text-white p-4 flex justify-between items-center shrink-0">
                        <h3 class="font-bold flex items-center gap-2 text-lg"><i class='bx bxs-brain'></i> Sugestão da IA</h3>
                        <button onclick="document.getElementById('ai-overlay').remove()" class="hover:bg-white/20 p-1 rounded transition"><i class='bx bx-x text-2xl'></i></button>
                    </div>
                    <div class="p-4 overflow-y-auto bg-gray-50 flex-grow">
                        <p class="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wide">Texto Sugerido (Editável):</p>
                        <textarea id="ai-result-text" class="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm text-gray-800 leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none shadow-inner resize-none font-mono">${response}</textarea>
                    </div>
                    <div class="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
                        <button onclick="document.getElementById('ai-overlay').remove()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition">Cancelar</button>
                        <button onclick="confirmAI('${pid}')" class="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg text-sm font-bold flex items-center transition transform active:scale-95">
                            <i class='bx bx-check mr-2'></i> Confirmar e Salvar
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Função interna para salvar o texto da IA no chat
            window.confirmAI = (id) => {
                const finalTxt = document.getElementById('ai-result-text').value;
                if(finalTxt.trim()) {
                    App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${id}/journal`).push({
                        text: "🤖 [IA]: " + finalTxt, 
                        author: 'Dentista', 
                        timestamp: new Date().toISOString()
                    });
                }
                document.getElementById('ai-overlay').remove();
            };

        } catch(e) { 
            alert("Não foi possível gerar a resposta da IA. Verifique a chave de API."); 
            console.error(e);
        } finally { 
            btn.innerHTML = oldHtml; 
            btn.disabled = false; 
        }
    };

})();