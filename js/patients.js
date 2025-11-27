// ==================================================================
// MÓDULO DE PACIENTES, PRONTUÁRIO E IA
// ==================================================================
(function() {
    const App = window.DentistaApp;
    let currentChatRef = null;
    let selectedFile = null;

    // --- TELA PRINCIPAL: LISTA DE PACIENTES ---
    window.renderPatientManager = function() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="p-4 md:p-8 bg-white shadow-lg rounded-2xl border border-indigo-50">
                <div class="flex flex-col md:flex-row justify-between mb-6 items-center gap-4">
                    <h2 class="text-2xl font-bold text-indigo-800 flex items-center">
                        <i class='bx bxs-user-detail mr-2'></i> Gestão de Pacientes
                    </h2>
                    <button onclick="window.openPatientModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md font-semibold text-sm flex items-center transition transform hover:scale-105">
                        <i class='bx bx-user-plus mr-2 text-lg'></i> Novo Paciente
                    </button>
                </div>

                <div class="overflow-x-auto bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider border-b">
                            <tr>
                                <th class="p-4 font-bold">Nome / Tratamento</th>
                                <th class="p-4 font-bold">Contato</th>
                                <th class="p-4 font-bold text-right">Ações Rápidas</th>
                            </tr>
                        </thead>
                        <tbody id="patient-list" class="divide-y divide-gray-200 bg-white"></tbody>
                    </table>
                </div>
                
                <footer class="text-center py-6 text-xs text-gray-400 border-t mt-6">
                    Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong>
                </footer>
            </div>`;

        const tbody = document.getElementById('patient-list');
        
        if (App.data.patients.length > 0) {
            App.data.patients.forEach(p => {
                tbody.innerHTML += `
                    <tr class="hover:bg-indigo-50 transition duration-150 group">
                        <td class="p-4">
                            <div class="font-bold text-gray-800 text-base">${p.name}</div>
                            <div class="text-xs text-indigo-500 font-semibold uppercase bg-indigo-50 px-2 py-0.5 rounded-full w-fit mt-1 border border-indigo-100">
                                ${p.treatmentType || 'Geral'}
                            </div>
                        </td>
                        <td class="p-4 text-sm text-gray-600">
                            <div class="flex items-center gap-1"><i class='bx bx-envelope'></i> ${p.email || '-'}</div>
                            <div class="flex items-center gap-1 mt-1"><i class='bx bx-phone'></i> ${p.phone || '-'}</div>
                        </td>
                        <td class="p-4 text-right">
                            <div class="flex justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                <button onclick="window.openRecModal('${p.id}')" class="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-600 hover:text-white transition shadow-sm border border-green-100" title="Lançar Pagamento">
                                    <i class='bx bx-money text-xl'></i>
                                </button>
                                <button onclick="window.openJournal('${p.id}')" class="bg-cyan-50 text-cyan-600 p-2 rounded-lg hover:bg-cyan-600 hover:text-white transition shadow-sm border border-cyan-100" title="Abrir Prontuário/Chat">
                                    <i class='bx bx-file-find text-xl'></i>
                                </button>
                                <button onclick="window.openPatientModal('${p.id}')" class="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition shadow-sm border border-blue-100" title="Editar Dados">
                                    <i class='bx bx-edit text-xl'></i>
                                </button>
                                <button onclick="window.delPat('${p.id}')" class="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition shadow-sm border border-red-100" title="Excluir">
                                    <i class='bx bx-trash text-xl'></i>
                                </button>
                            </div>
                        </td>
                    </tr>`;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-gray-400 italic flex flex-col items-center"><i class='bx bx-user-x text-4xl mb-2'></i>Nenhum paciente cadastrado.</td></tr>`;
        }
    };

    // --- CRUD PACIENTE (Modal de Criação/Edição) ---
    window.openPatientModal = function(pid = null) {
        const p = pid ? App.data.patients.find(x => x.id === pid) : null;
        const isEdit = !!p;
        
        const html = `
            <form id="form-pat" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <input type="hidden" id="p-id" value="${pid || ''}">
                
                <div class="md:col-span-2">
                    <label class="block font-bold text-gray-700 mb-1">Nome Completo</label>
                    <input id="p-name" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="${p ? p.name : ''}" required placeholder="Ex: Maria Silva">
                </div>
                
                <div>
                    <label class="block font-bold text-gray-700 mb-1">Email (Login)</label>
                    <input id="p-email" type="email" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="${p ? p.email : ''}" placeholder="cliente@email.com">
                </div>
                
                <div>
                    <label class="block font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                    <input id="p-phone" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="${p ? p.phone : ''}" placeholder="(00) 00000-0000">
                </div>
                
                <div class="md:col-span-2">
                    <label class="block font-bold text-gray-700 mb-1">Endereço</label>
                    <input id="p-addr" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value="${p ? p.address : ''}" placeholder="Rua, Número, Bairro">
                </div>

                <div class="md:col-span-2 grid grid-cols-2 gap-4">
                   <div>
                        <label class="block font-bold text-gray-700 mb-1">CPF</label>
                        <input id="p-cpf" class="w-full p-3 border border-gray-300 rounded-lg" value="${p ? p.cpf : ''}" placeholder="000.000.000-00">
                   </div>
                   <div>
                        <label class="block font-bold text-gray-700 mb-1">Tratamento Atual</label>
                        <select id="p-type" class="w-full p-3 border border-gray-300 rounded-lg bg-white">
                            <option ${isEdit && p.treatmentType === 'Geral' ? 'selected' : ''}>Geral</option>
                            <option ${isEdit && p.treatmentType === 'Ortodontia' ? 'selected' : ''}>Ortodontia</option>
                            <option ${isEdit && p.treatmentType === 'Implante' ? 'selected' : ''}>Implante</option>
                            <option ${isEdit && p.treatmentType === 'Estética' ? 'selected' : ''}>Estética</option>
                            <option ${isEdit && p.treatmentType === 'Cirurgia' ? 'selected' : ''}>Cirurgia</option>
                        </select>
                   </div>
                </div>

                <div class="md:col-span-2">
                    <label class="block font-bold text-gray-700 mb-1">Meta Clínica / Observações</label>
                    <textarea id="p-goal" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows="3" placeholder="Ex: Alinhamento superior, implante no 24...">${p ? p.treatmentGoal : ''}</textarea>
                </div>
                
                <div class="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                    <button type="button" onclick="App.utils.closeModal()" class="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>
                    <button class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md">${isEdit ? 'Atualizar Ficha' : 'Cadastrar Paciente'}</button>
                </div>
            </form>`;
        
        App.utils.openModal(isEdit ? 'Editar Paciente' : 'Novo Paciente', html, 'md:max-w-2xl');
        
        document.getElementById('form-pat').onsubmit = (e) => {
            e.preventDefault();
            const d = { 
                name: document.getElementById('p-name').value, 
                email: document.getElementById('p-email').value, 
                phone: document.getElementById('p-phone').value, 
                cpf: document.getElementById('p-cpf').value,
                address: document.getElementById('p-addr').value, 
                treatmentType: document.getElementById('p-type').value,
                treatmentGoal: document.getElementById('p-goal').value
            };
            
            const id = document.getElementById('p-id').value;
            
            if(id) {
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients/' + id)).update(d);
            } else {
                d.createdAt = new Date().toISOString(); 
                App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients')).push(d);
            }
            App.utils.closeModal();
        };
    };

    window.delPat = (id) => { 
        if(confirm("ATENÇÃO: Excluir este paciente apagará todo o histórico clínico e financeiro dele.\n\nDeseja continuar?")) {
            App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'patients/' + id)).remove();
        }
    };

    // --- PRONTUÁRIO DIGITAL (O Coração do Sistema) ---
    window.openJournal = function(id) {
        // Garante que não misture conversas
        if(currentChatRef) currentChatRef.off();
        
        const p = App.data.patients.find(x => x.id === id);
        if(!p) return;
        
        const html = `
            <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl mb-4 flex justify-between items-start shadow-sm border border-indigo-100">
                <div>
                    <h3 class="font-extrabold text-xl text-indigo-900">${p.name}</h3>
                    <p class="text-sm text-indigo-600 mt-1 flex items-center gap-2">
                        <i class='bx bx-envelope'></i> ${p.email || 'Sem email'} 
                        <span class="text-gray-300">|</span> 
                        <i class='bx bx-phone'></i> ${p.phone || 'Sem tel'}
                    </p>
                </div>
                <div class="text-right">
                    <span class="bg-white px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow border border-indigo-100 uppercase tracking-wide">${p.treatmentType}</span>
                    <div class="mt-2 text-xs text-gray-500 max-w-[200px] leading-tight text-right">
                        <b>Meta:</b> ${p.treatmentGoal || 'Não definida'}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                
                <div class="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 class="font-bold text-sm text-gray-600 uppercase tracking-wider flex items-center"><i class='bx bx-wallet mr-2'></i> Histórico Financeiro</h4>
                        <button onclick="window.openRecModal('${id}')" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold">+ Novo</button>
                    </div>
                    <div id="journal-fin" class="flex-grow overflow-y-auto p-3 space-y-2 bg-white">
                        <p class="text-center text-gray-400 text-sm mt-10 italic">Carregando financeiro...</p>
                    </div>
                </div>
                
                <div class="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-gray-50 p-3 border-b border-gray-200">
                        <h4 class="font-bold text-sm text-gray-600 uppercase tracking-wider flex items-center"><i class='bx bx-chat mr-2'></i> Evolução & Chat</h4>
                    </div>
                    
                    <div id="chat-area" class="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50">
                        </div>
                    
                    <div class="p-3 bg-white border-t border-gray-200">
                        
                        <div id="file-preview" class="hidden mb-2 bg-indigo-50 p-2 rounded text-xs flex justify-between items-center text-indigo-700 border border-indigo-100">
                            <span class="truncate max-w-[200px]" id="file-name-prev"></span>
                            <button onclick="clearFile()" class="text-red-500 hover:text-red-700 font-bold">&times;</button>
                        </div>

                        <div class="flex gap-2 items-center">
                            <input type="file" id="chat-file" class="hidden" accept="image/*, application/pdf">
                            <button onclick="document.getElementById('chat-file').click()" class="p-2 text-gray-400 hover:text-indigo-600 transition hover:bg-gray-100 rounded-full" title="Anexar Raio-X / Foto">
                                <i class='bx bx-paperclip text-2xl'></i>
                            </button>
                            
                            <div class="relative flex-grow">
                                <input id="chat-msg" class="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-indigo-300 rounded-full py-2.5 px-4 text-sm transition outline-none pr-10" placeholder="Digite a evolução ou mensagem...">
                            </div>
                            
                            <button onclick="sendC('${id}')" class="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition transform active:scale-95 flex items-center justify-center" title="Enviar">
                                <i class='bx bxs-send text-lg'></i>
                            </button>
                            
                            <button onclick="window.askAI('${id}')" class="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 shadow-md transition transform active:scale-95 flex items-center justify-center ml-1" title="Consultar IA (Privado)">
                                <i class='bx bxs-magic-wand text-lg'></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        
        App.utils.openModal("Prontuário Digital", html, 'md:max-w-6xl');

        // Lógica do Arquivo
        document.getElementById('chat-file').onchange = function(e) { 
            selectedFile = e.target.files[0];
            if(selectedFile) { 
                document.getElementById('file-name-prev').textContent = "📎 " + selectedFile.name; 
                document.getElementById('file-preview').classList.remove('hidden'); 
            }
        };
        window.clearFile = () => { selectedFile = null; document.getElementById('chat-file').value=''; document.getElementById('file-preview').classList.add('hidden'); };

        // 1. Carrega Financeiro
        const finDiv = document.getElementById('journal-fin');
        const recs = App.data.receivables.filter(r => r.patientId === id);
        
        if(recs.length) {
            finDiv.innerHTML = '';
            recs.forEach(r => {
                const isPaid = r.status === 'Recebido';
                const statusClass = isPaid ? 'text-green-600 bg-green-50 border-green-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200';
                
                finDiv.innerHTML += `
                    <div class="p-3 rounded-lg border mb-2 bg-white hover:shadow-sm transition">
                        <div class="flex justify-between items-start mb-1">
                            <span class="font-bold text-gray-700 text-sm">${r.description}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${statusClass}">${r.status}</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Venc: ${App.utils.formatDate(r.dueDate)}</span>
                            <span class="font-bold text-gray-800 text-sm">${App.utils.formatCurrency(r.amount)}</span>
                        </div>
                    </div>`;
            });
        } else { finDiv.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm italic"><i class="bx bx-receipt text-4xl mb-2 opacity-30"></i>Sem registros financeiros.</div>'; }

        // 2. Carrega Chat
        currentChatRef = App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${id}/journal`);
        currentChatRef.limitToLast(50).on('value', s => {
            const div = document.getElementById('chat-area');
            if(!div) return;
            div.innerHTML = ''; // Limpa antes de renderizar
            
            if(s.exists()) {
                s.forEach(c => {
                    const m = c.val();
                    const isMe = m.author === 'Dentista';
                    const align = isMe ? 'ml-auto bg-indigo-600 text-white rounded-br-none' : 'mr-auto bg-white border border-gray-200 text-gray-800 rounded-bl-none';
                    const label = isMe ? 'Você' : m.author;
                    
                    let mediaHtml = '';
                    if(m.media && m.media.url) {
                        mediaHtml = `<a href="${m.media.url}" target="_blank" class="block mt-2"><img src="${m.media.url}" class="rounded-lg border border-white/20 max-h-32 object-cover"></a>`;
                    }

                    const el = document.createElement('div');
                    el.className = `p-3 rounded-2xl text-sm max-w-[85%] shadow-sm mb-2 relative group ${align}`;
                    el.innerHTML = `
                        <div class="font-bold text-[10px] opacity-80 mb-0.5 uppercase tracking-wider">${label}</div>
                        <div class="leading-relaxed">${m.text}</div>
                        ${mediaHtml}
                        <div class="text-[9px] text-right opacity-60 mt-1">${App.utils.formatDateTime(m.timestamp).split(' ')[1]}</div>
                    `;
                    div.appendChild(el);
                });
                div.scrollTop = div.scrollHeight;
            } else {
                div.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm"><i class="bx bx-message-dots text-4xl mb-2 opacity-30"></i>Inicie o atendimento.</div>';
            }
        });
    };

    // Envio de Mensagem
    window.sendC = async (id) => {
        const input = document.getElementById('chat-msg');
        const txt = input.value;
        
        if(!txt && !selectedFile) return;
        
        // Feedback visual de upload
        let mediaData = null;
        if(selectedFile) {
            const btn = document.querySelector('button[onclick*="sendC"]');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>';
            btn.disabled = true;
            
            try {
                mediaData = await window.uploadToCloudinary(selectedFile);
            } catch(e) {
                alert("Erro no upload: " + e.message);
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                return;
            }
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }

        // Salva no Firebase
        App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${id}/journal`).push({
            text: txt || (mediaData ? "Enviou um arquivo." : ""),
            author: 'Dentista',
            media: mediaData,
            timestamp: new Date().toISOString()
        });

        // Limpa campos
        input.value = '';
        if(selectedFile) window.clearFile();
    };

    // IA FLUTUANTE (Janela que não trava o chat)
    window.askAI = async (id) => {
        const p = App.data.patients.find(x => x.id === id);
        const btn = document.querySelector('button[title="Consultar IA (Privado)"]');
        const originalIcon = btn.innerHTML;
        
        btn.innerHTML = '<i class="bx bx-loader-alt bx-spin text-xl"></i>';
        btn.disabled = true;

        try {
            // 1. Pega histórico para contexto
            const snaps = await App.db.ref(`artifacts/${window.AppConfig.APP_ID}/patients/${id}/journal`).limitToLast(5).once('value');
            let hist = "";
            snaps.forEach(s => hist += `${s.val().author}: ${s.val().text}\n`);

            // 2. Prompt Sênior
            const prompt = `
                PACIENTE: ${p.name} (${p.treatmentType}). 
                HISTÓRICO RECENTE DA CONVERSA:\n${hist}\n
                TAREFA: Como Dentista Sênior, analise o contexto e sugira a melhor resposta técnica ou conduta para o profissional.
                Seja direto. Não cumprimente a IA, dê a resposta pronta para ser usada ou a orientação clínica.
            `;
            
            // 3. Chama API
            const resp = await window.callGeminiAPI(prompt, "Análise Clínica");

            // 4. Abre Modal de Sugestão (Não envia direto)
            const html = `
                <div class="bg-purple-50 p-4 rounded-t-lg border-b border-purple-100">
                    <h3 class="font-bold text-purple-900 flex items-center"><i class='bx bxs-brain mr-2'></i> Sugestão da IA</h3>
                    <p class="text-xs text-purple-600 mt-1">Revise antes de usar.</p>
                </div>
                <div class="p-4">
                    <textarea id="ai-res" class="w-full h-40 border border-gray-300 p-3 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none resize-none text-gray-700 leading-relaxed">${resp}</textarea>
                    <div class="flex justify-end gap-3 mt-4">
                        <button onclick="document.getElementById('ai-over').remove()" class="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium">Descartar</button>
                        <button onclick="useAI()" class="px-5 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 font-bold text-sm transition flex items-center">
                            <i class='bx bx-check mr-2'></i> Usar no Chat
                        </button>
                    </div>
                </div>
            `;
            
            const overlay = document.createElement('div');
            overlay.id = 'ai-over';
            overlay.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[2000] p-4 backdrop-blur-sm';
            overlay.innerHTML = `<div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">${html}</div>`;
            document.body.appendChild(overlay);

            // Função para jogar o texto no input do chat
            window.useAI = () => { 
                const input = document.getElementById('chat-msg');
                if(input) { 
                    input.value = document.getElementById('ai-res').value; 
                    input.focus(); 
                }
                document.getElementById('ai-over').remove(); 
            };

        } catch(e) { 
            alert("Erro na IA: " + e.message); 
        } finally { 
            btn.innerHTML = originalIcon; 
            btn.disabled = false; 
        }
    };

})();
