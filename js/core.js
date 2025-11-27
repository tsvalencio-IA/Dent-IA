// ==================================================================
// MÓDULO CORE: Gerencia Estado Global, Banco de Dados e Rotas
// ==================================================================
(function() {
    // 1. ESTADO GLOBAL (A "Cola" do sistema)
    window.DentistaApp = {
        db: null, auth: null, currentUser: null, currentView: 'dashboard',
        data: { patients: [], receivables: [], stock: [], expenses: [] },
        utils: {
            formatCurrency: v => 'R$ ' + parseFloat(v||0).toFixed(2).replace('.', ','),
            formatDate: d => d ? new Date(d).toLocaleDateString('pt-BR') : '-',
            formatDateTime: d => d ? new Date(d).toLocaleString('pt-BR') : '-',
            getAdminPath: (uid, path) => `artifacts/${window.AppConfig.APP_ID}/users/${uid}/${path}`,
            
            // Controle de Modal Global
            openModal: (title, html, maxW) => {
                const m = document.getElementById('app-modal');
                const content = m.querySelector('.modal-content');
                // Reseta classes de largura e aplica a nova
                content.className = `modal-content bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] w-full ${maxW || 'max-w-md'}`;
                document.getElementById('modal-title').textContent = title;
                document.getElementById('modal-body').innerHTML = html;
                m.classList.remove('hidden'); m.classList.add('flex');
            },
            closeModal: () => { 
                const m = document.getElementById('app-modal');
                m.classList.add('hidden'); m.classList.remove('flex');
            }
        }
    };

    const App = window.DentistaApp;
    let isLoginMode = true;

    function init() {
        if (!firebase.apps.length) firebase.initializeApp(window.AppConfig.firebaseConfig);
        App.db = firebase.database();
        App.auth = firebase.auth();
        setupAuth();
        setupUIListeners();
    }

    // 2. AUTENTICAÇÃO E CARREGAMENTO DE DADOS
    function setupAuth() {
        App.auth.onAuthStateChanged(user => {
            if (user) {
                // Verifica perfil
                const ref = App.db.ref(App.utils.getAdminPath(user.uid, 'profile'));
                ref.once('value').then(s => {
                    const p = s.val();
                    if ((p && p.role === 'dentist') || !p) { // Permite primeiro acesso ou dentista
                        App.currentUser = { uid: user.uid, email: user.email };
                        if (!p) ref.set({ email: user.email, role: 'dentist', registeredAt: new Date().toISOString() });
                        
                        startDataListeners(); // <--- INICIA O DOWNLOAD DOS DADOS
                        showAppInterface();
                    } else { 
                        alert("Acesso negado. Apenas dentistas."); App.auth.signOut(); 
                    }
                });
            } else { App.currentUser = null; showLoginInterface(); }
        });
    }

    // 3. LISTENERS EM TEMPO REAL (FIREBASE)
    function startDataListeners() {
        const uid = App.currentUser.uid;
        const maps = { 
            'patients': 'patients', 
            'stock': 'stock', 
            'finance/receivable': 'receivables', 
            'finance/expenses': 'expenses' 
        };
        
        // Cria um listener para cada nó do banco
        Object.keys(maps).forEach(path => {
            App.db.ref(App.utils.getAdminPath(uid, path)).on('value', s => {
                App.data[maps[path]] = [];
                if(s.exists()) {
                    s.forEach(c => { 
                        let item = c.val(); 
                        item.id = c.key; 
                        App.data[maps[path]].push(item); 
                    });
                }
                refreshCurrentView(); // Atualiza a tela se algo mudar
            });
        });
    }

    // 4. RENDERIZAÇÃO E NAVEGAÇÃO
    function refreshCurrentView() {
        // Redireciona para as funções globais exportadas pelos outros módulos
        if (App.currentView === 'dashboard') renderDashboard();
        else if (App.currentView === 'patients' && window.renderPatientManager) window.renderPatientManager();
        else if (App.currentView === 'financials' && window.initFinanceView) window.initFinanceView();
    }

    function renderDashboard() {
        const totalRec = App.data.receivables.reduce((acc, r) => r.status === 'Recebido' ? acc + parseFloat(r.amount||0) : acc, 0);
        const totalExp = App.data.expenses.reduce((acc, e) => e.status === 'Pago' ? acc + parseFloat(e.amount||0) : acc, 0);
        
        document.getElementById('main-content').innerHTML = `
            <div class="p-8 bg-white shadow-2xl rounded-2xl border border-indigo-100 animate-fade-in">
                <h2 class="text-3xl font-bold text-indigo-800 mb-6">Dashboard Geral</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="p-4 bg-indigo-100 rounded-lg"><p class="font-bold text-xs uppercase text-indigo-600">Pacientes</p><h3 class="text-3xl font-bold text-indigo-900">${App.data.patients.length}</h3></div>
                    <div class="p-4 bg-blue-100 rounded-lg"><p class="font-bold text-xs uppercase text-blue-600">Estoque</p><h3 class="text-3xl font-bold text-blue-900">${App.data.stock.length}</h3></div>
                    <div class="p-4 bg-green-100 rounded-lg"><p class="font-bold text-xs uppercase text-green-600">Caixa Real</p><h3 class="text-2xl font-bold text-green-800">${App.utils.formatCurrency(totalRec)}</h3></div>
                    <div class="p-4 bg-red-100 rounded-lg"><p class="font-bold text-xs uppercase text-red-600">Pago</p><h3 class="text-2xl font-bold text-red-800">${App.utils.formatCurrency(totalExp)}</h3></div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="font-bold text-gray-700 mb-2 flex items-center"><i class='bx bxs-brain text-purple-600 mr-2'></i> Diretrizes da IA</h3>
                    <textarea id="brain-input" class="w-full p-3 border rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none" rows="2" placeholder="Ex: Priorize tratamentos estéticos nas sugestões..."></textarea>
                    <button id="save-brain" class="mt-2 bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700 transition">Salvar Cérebro</button>
                </div>
            </div>`;
            
        // Carrega config da IA
        const brainRef = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'aiConfig/directives'));
        brainRef.once('value', s => { if(s.exists()) document.getElementById('brain-input').value = s.val().promptDirectives; });
        document.getElementById('save-brain').onclick = () => { brainRef.update({ promptDirectives: document.getElementById('brain-input').value }); alert("IA Atualizada!"); };
    }

    // 5. AUXILIARES DE UI
    function showLoginInterface() { document.getElementById('login-screen').classList.remove('hidden'); document.getElementById('app-container').classList.add('hidden'); }
    function showAppInterface() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('app-container').classList.remove('hidden'); renderSidebar(); navigateTo('dashboard'); }

    function navigateTo(view) {
        App.currentView = view;
        refreshCurrentView();
        document.querySelectorAll('#nav-menu button').forEach(btn => {
            const active = btn.dataset.view === view;
            btn.className = active ? 'flex items-center p-3 rounded-xl w-full text-left bg-indigo-600 text-white shadow-lg transition' : 'flex items-center p-3 rounded-xl w-full text-left text-indigo-200 hover:bg-indigo-700 hover:text-white transition';
        });
    }

    function renderSidebar() {
        const menu = document.getElementById('nav-menu'); menu.innerHTML = '';
        window.AppConfig.NAV_ITEMS.forEach(item => {
            const btn = document.createElement('button');
            btn.dataset.view = item.id;
            btn.className = 'flex items-center p-3 rounded-xl w-full text-left text-indigo-200';
            btn.innerHTML = `<i class='bx ${item.icon} text-xl mr-3'></i><span class='font-semibold'>${item.label}</span>`;
            btn.onclick = () => navigateTo(item.id);
            menu.appendChild(btn);
        });
    }

    function setupUIListeners() {
        document.getElementById('close-modal').addEventListener('click', App.utils.closeModal);
        document.getElementById('logout-button').addEventListener('click', () => App.auth.signOut().then(() => window.location.reload()));

        // Login / Cadastro
        const form = document.getElementById('auth-form');
        const newForm = form.cloneNode(true); form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const em = document.getElementById('auth-email').value;
            const pw = document.getElementById('auth-password').value;
            try {
                if (isLoginMode) await App.auth.signInWithEmailAndPassword(em, pw);
                else await App.auth.createUserWithEmailAndPassword(em, pw);
            } catch(err) { alert("Erro: " + err.message); }
        });

        document.getElementById('toggle-auth-mode').addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            document.getElementById('auth-submit-btn').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
