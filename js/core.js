// ==================================================================
// NÚCLEO DO SISTEMA (CORE) - AUTENTICAÇÃO E NAVEGAÇÃO
// ==================================================================
(function() {
    // Espaço Global da Aplicação (Para compartilhar dados entre arquivos)
    window.DentistaApp = {
        db: null,
        auth: null,
        currentUser: null,
        config: window.AppConfig,
        // Caches Globais
        cache: {
            patients: [],
            stock: [],
            finance: { receivables: [], expenses: [] }
        },
        // Funções Globais
        utils: {
            formatCurrency: (v) => 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ','),
            formatDate: (iso) => {
                if(!iso) return '-';
                let d = new Date(iso);
                return isNaN(d) ? '-' : d.toLocaleDateString('pt-BR');
            },
            formatDateTime: (iso) => {
                if(!iso) return '-';
                let d = new Date(iso);
                return isNaN(d) ? '-' : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            },
            showNotification: (msg) => console.log(`[NOTIFICAÇÃO]: ${msg}`) // Pode expandir para Toast
        },
        // Caminhos do Banco
        paths: {
            admin: (uid, path) => `artifacts/${window.AppConfig.APP_ID}/users/${uid}/${path}`,
            patientJournal: (pid) => `artifacts/${window.AppConfig.APP_ID}/patients/${pid}/journal`
        }
    };

    const App = window.DentistaApp;
    let isLoginMode = true;

    // --- INICIALIZAÇÃO ---
    function init() {
        if (!firebase.apps.length) firebase.initializeApp(App.config.firebaseConfig);
        App.db = firebase.database();
        App.auth = firebase.auth();
        setupAuth();
        setupUIListeners();
    }

    // --- AUTENTICAÇÃO ---
    function setupAuth() {
        App.auth.onAuthStateChanged(user => {
            if (user) {
                const userRef = App.db.ref(App.paths.admin(user.uid, 'profile'));
                userRef.once('value').then(s => {
                    const p = s.val();
                    if ((p && p.role === 'dentist') || user.email === 'admin@ts.com') {
                        App.currentUser = { uid: user.uid, email: user.email };
                        // Auto-fix Admin
                        if (!p && user.email === 'admin@ts.com') {
                            userRef.set({ email: user.email, role: 'dentist', registeredAt: new Date().toISOString() });
                        }
                        loadData();
                        showApp();
                    } else {
                        alert("Acesso restrito a dentistas.");
                        App.auth.signOut();
                    }
                });
            } else {
                App.currentUser = null;
                showLogin();
            }
        });
    }

    // --- CARREGAMENTO DE DADOS (GLOBAL) ---
    function loadData() {
        if (!App.currentUser) return;
        const uid = App.currentUser.uid;

        // Carrega Pacientes
        App.db.ref(App.paths.admin(uid, 'patients')).on('value', s => {
            App.cache.patients = [];
            if(s.exists()) s.forEach(c => { let p = c.val(); p.id = c.key; App.cache.patients.push(p); });
            updateDashboard();
            if (typeof window.renderPatientList === 'function') window.renderPatientList();
        });

        // Carrega Estoque
        App.db.ref(App.paths.admin(uid, 'stock')).on('value', s => {
            App.cache.stock = [];
            if(s.exists()) s.forEach(c => { let i = c.val(); i.id = c.key; App.cache.stock.push(i); });
            updateDashboard();
            if (typeof window.renderStockList === 'function') window.renderStockList();
        });

        // Carrega Financeiro
        App.db.ref(App.paths.admin(uid, 'finance/receivable')).on('value', s => {
            App.cache.finance.receivables = [];
            if(s.exists()) s.forEach(c => { let r = c.val(); r.id = c.key; App.cache.finance.receivables.push(r); });
            updateDashboard();
            if (typeof window.renderReceivablesList === 'function') window.renderReceivablesList();
        });
        App.db.ref(App.paths.admin(uid, 'finance/expenses')).on('value', s => {
            App.cache.finance.expenses = [];
            if(s.exists()) s.forEach(c => { let e = c.val(); e.id = c.key; App.cache.finance.expenses.push(e); });
            updateDashboard();
            if (typeof window.renderExpensesList === 'function') window.renderExpensesList();
        });
    }

    // --- UI ---
    function showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        navigateTo('dashboard');
        renderSidebar();
    }

    function showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    function updateDashboard() {
        // Atualiza KPIs se estiver na tela
        if(!document.getElementById('dash-pat')) return;
        document.getElementById('dash-pat').textContent = App.cache.patients.length;
        document.getElementById('dash-stk').textContent = App.cache.stock.length;
        
        // KPI Realista: Soma apenas o EFETIVADO
        let totalRec = App.cache.finance.receivables.reduce((acc, r) => r.status === 'Recebido' ? acc + parseFloat(r.amount||0) : acc, 0);
        let totalExp = App.cache.finance.expenses.reduce((acc, e) => e.status === 'Pago' ? acc + parseFloat(e.amount||0) : acc, 0);
        
        document.getElementById('dash-rec').textContent = App.utils.formatCurrency(totalRec);
        document.getElementById('dash-exp').textContent = App.utils.formatCurrency(totalExp);
    }

    function navigateTo(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        
        // Roteamento Simples
        if (viewId === 'dashboard') renderDashboard(main);
        else if (viewId === 'patients' && window.initPatientView) window.initPatientView(main);
        else if (viewId === 'financials' && window.initFinanceView) window.initFinanceView(main);
        
        // Atualiza Menu
        document.querySelectorAll('#nav-menu button').forEach(btn => {
            const active = btn.dataset.view === viewId;
            btn.className = active ? 'flex items-center p-3 rounded-xl w-full text-left bg-indigo-600 text-white shadow-lg' : 'flex items-center p-3 rounded-xl w-full text-left text-indigo-200 hover:bg-indigo-700 hover:text-white';
        });
    }

    function renderDashboard(container) {
        container.innerHTML = `
            <div class="p-8 bg-white shadow-2xl rounded-2xl border border-indigo-100">
                <h2 class="text-3xl font-bold text-indigo-800 mb-6"><i class='bx bxs-dashboard'></i> Visão Geral</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="p-4 bg-indigo-100 rounded-lg"><p class="text-gray-600 text-sm uppercase font-bold">Pacientes</p><h3 class="text-2xl font-bold text-indigo-800" id="dash-pat">...</h3></div>
                    <div class="p-4 bg-green-100 rounded-lg"><p class="text-gray-600 text-sm uppercase font-bold">Estoque</p><h3 class="text-3xl font-bold text-green-800" id="dash-stk">...</h3></div>
                    <div class="p-4 bg-yellow-100 rounded-lg"><p class="text-gray-600 text-sm uppercase font-bold">Caixa (Recebido)</p><h3 class="text-2xl font-bold text-yellow-800" id="dash-rec">...</h3></div>
                    <div class="p-4 bg-red-100 rounded-lg"><p class="text-gray-600 text-sm uppercase font-bold">Pago (Despesas)</p><h3 class="text-2xl font-bold text-red-800" id="dash-exp">...</h3></div>
                </div>
                <div class="border p-4 rounded-xl bg-gray-50">
                    <h3 class="font-bold text-indigo-800 mb-2">Cérebro da Clínica</h3>
                    <textarea id="brain-input" class="w-full p-2 border rounded text-sm" rows="3"></textarea>
                    <button id="save-brain-btn" class="mt-2 bg-indigo-600 text-white px-4 py-1 rounded text-sm">Salvar Diretrizes</button>
                </div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        updateDashboard();
        // Carrega Brain
        const brainPath = App.paths.admin(App.currentUser.uid, 'aiConfig/directives');
        App.db.ref(brainPath).once('value', s => { if(s.exists()) document.getElementById('brain-input').value = s.val().promptDirectives; });
        document.getElementById('save-brain-btn').onclick = () => {
            App.db.ref(brainPath).update({ promptDirectives: document.getElementById('brain-input').value });
            alert("IA Atualizada!");
        };
    }

    function renderSidebar() {
        const menu = document.getElementById('nav-menu');
        menu.innerHTML = '';
        App.config.NAV_ITEMS.forEach(item => {
            const btn = document.createElement('button');
            btn.dataset.view = item.id;
            btn.className = 'flex items-center p-3 rounded-xl w-full text-left text-indigo-200 hover:bg-indigo-700 hover:text-white';
            btn.innerHTML = `<i class='bx ${item.icon} text-xl mr-3'></i><span class='font-semibold'>${item.label}</span>`;
            btn.onclick = () => navigateTo(item.id);
            menu.appendChild(btn);
        });
    }

    // --- LISTENERS DE SISTEMA ---
    function setupUIListeners() {
        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('app-modal').classList.add('hidden');
            document.getElementById('app-modal').classList.remove('flex');
        });
        document.getElementById('logout-button').addEventListener('click', () => App.auth.signOut().then(() => window.location.reload()));
        
        // Login
        const form = document.getElementById('auth-form');
        const newForm = form.cloneNode(true); form.parentNode.replaceChild(newForm, form); // Limpa eventos antigos
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;
            try {
                if(isLoginMode) await App.auth.signInWithEmailAndPassword(email, pass);
                else {
                    const cred = await App.auth.createUserWithEmailAndPassword(email, pass);
                    await App.db.ref(App.paths.admin(cred.user.uid, 'profile')).set({ email, role: 'dentist', registeredAt: new Date().toISOString() });
                }
            } catch(e) { alert("Erro: " + e.message); }
        });
        
        const toggle = document.getElementById('toggle-auth-mode');
        const newToggle = toggle.cloneNode(true); toggle.parentNode.replaceChild(newToggle, toggle);
        newToggle.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            document.getElementById('auth-submit-btn').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
        });
    }

    // Expondo Utils Globais para Modais
    window.openModal = (title, html, maxW) => {
        const m = document.getElementById('app-modal');
        m.querySelector('.modal-content').className = 'modal-content w-full ' + (maxW || 'max-w-md');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = html;
        m.classList.remove('hidden'); m.classList.add('flex');
    };
    window.closeModal = () => document.getElementById('close-modal').click();

    document.addEventListener('DOMContentLoaded', init);
})();
