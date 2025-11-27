// ==================================================================
// MÓDULO CENTRAL (CORE) - Login, Navegação e Dados Globais
// ==================================================================
(function() {
    // Objeto Global da Aplicação (Compartilhado entre módulos)
    window.DentistaApp = {
        db: null,
        auth: null,
        currentUser: null,
        currentView: 'dashboard',
        data: {
            patients: [],
            receivables: [],
            stock: [],
            expenses: []
        },
        utils: {
            formatCurrency: (val) => 'R$ ' + parseFloat(val || 0).toFixed(2).replace('.', ','),
            formatDate: (iso) => {
                if (!iso) return '-';
                const d = new Date(iso);
                return isNaN(d) ? '-' : d.toLocaleDateString('pt-BR');
            },
            getAdminPath: (uid, path) => `artifacts/${window.AppConfig.APP_ID}/users/${uid}/${path}`,
            openModal: (title, html, maxW) => {
                const m = document.getElementById('app-modal');
                m.querySelector('.modal-content').className = 'modal-content w-full ' + (maxW || 'max-w-md');
                document.getElementById('modal-title').textContent = title;
                document.getElementById('modal-body').innerHTML = html;
                m.classList.remove('hidden'); m.classList.add('flex');
            },
            closeModal: () => {
                document.getElementById('app-modal').classList.add('hidden');
                document.getElementById('app-modal').classList.remove('flex');
            }
        }
    };

    const App = window.DentistaApp;
    const config = window.AppConfig;
    let isLoginMode = true;

    // --- INICIALIZAÇÃO ---
    function init() {
        if (!firebase.apps.length) firebase.initializeApp(config.firebaseConfig);
        App.db = firebase.database();
        App.auth = firebase.auth();
        
        setupAuthListener();
        setupGlobalListeners();
    }

    function setupAuthListener() {
        App.auth.onAuthStateChanged(user => {
            if (user) {
                // Verifica perfil
                const ref = App.db.ref(App.utils.getAdminPath(user.uid, 'profile'));
                ref.once('value').then(s => {
                    const p = s.val();
                    if ((p && p.role === 'dentist') || user.email === 'admin@ts.com') {
                        App.currentUser = { uid: user.uid, email: user.email };
                        if (!p && user.email === 'admin@ts.com') {
                            ref.set({ email: user.email, role: 'dentist', registeredAt: new Date().toISOString() });
                        }
                        loadGlobalData();
                        showUI();
                    } else {
                        alert("Acesso restrito."); App.auth.signOut();
                    }
                });
            } else {
                App.currentUser = null; showLoginScreen();
            }
        });
    }

    // --- CARREGAMENTO DE DADOS (Sincroniza tudo aqui) ---
    function loadGlobalData() {
        const uid = App.currentUser.uid;
        
        App.db.ref(App.utils.getAdminPath(uid, 'patients')).on('value', s => {
            App.data.patients = [];
            if(s.exists()) s.forEach(c => { let p = c.val(); p.id = c.key; App.data.patients.push(p); });
            refreshCurrentView();
        });

        App.db.ref(App.utils.getAdminPath(uid, 'stock')).on('value', s => {
            App.data.stock = [];
            if(s.exists()) s.forEach(c => { let i = c.val(); i.id = c.key; App.data.stock.push(i); });
            refreshCurrentView();
        });

        App.db.ref(App.utils.getAdminPath(uid, 'finance/receivable')).on('value', s => {
            App.data.receivables = [];
            if(s.exists()) s.forEach(c => { let r = c.val(); r.id = c.key; App.data.receivables.push(r); });
            refreshCurrentView();
        });

        App.db.ref(App.utils.getAdminPath(uid, 'finance/expenses')).on('value', s => {
            App.data.expenses = [];
            if(s.exists()) s.forEach(c => { let e = c.val(); e.id = c.key; App.data.expenses.push(e); });
            refreshCurrentView();
        });
    }

    function refreshCurrentView() {
        if (App.currentView === 'dashboard') renderDashboard();
        else if (App.currentView === 'patients' && window.renderPatientManager) window.renderPatientManager();
        else if (App.currentView === 'financials' && window.renderFinancialManager) window.renderFinancialManager();
    }

    // --- UI & NAVEGAÇÃO ---
    function showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    function showUI() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        renderSidebar();
        navigateTo('dashboard');
    }

    function renderSidebar() {
        const menu = document.getElementById('nav-menu');
        menu.innerHTML = '';
        config.NAV_ITEMS.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'flex items-center p-3 rounded-xl w-full text-left text-indigo-200 hover:bg-indigo-700 hover:text-white';
            btn.innerHTML = `<i class='bx ${item.icon} text-xl mr-3'></i><span class='font-semibold'>${item.label}</span>`;
            btn.onclick = () => navigateTo(item.id);
            menu.appendChild(btn);
        });
    }

    function navigateTo(view) {
        App.currentView = view;
        refreshCurrentView(); // Renderiza a tela selecionada
    }

    function renderDashboard() {
        const container = document.getElementById('main-content');
        
        // Cálculos de KPI
        const totalRec = App.data.receivables.reduce((acc, r) => r.status === 'Recebido' ? acc + parseFloat(r.amount||0) : acc, 0);
        const totalExp = App.data.expenses.reduce((acc, e) => e.status === 'Pago' ? acc + parseFloat(e.amount||0) : acc, 0);

        container.innerHTML = `
            <div class="p-8 bg-white shadow-2xl rounded-2xl border border-indigo-100">
                <h2 class="text-3xl font-bold text-indigo-800 mb-6"><i class='bx bxs-dashboard'></i> Visão Geral</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="p-4 bg-indigo-100 rounded-lg"><p class="text-gray-600 text-sm font-bold">PACIENTES</p><h3 class="text-2xl font-bold text-indigo-800">${App.data.patients.length}</h3></div>
                    <div class="p-4 bg-green-100 rounded-lg"><p class="text-gray-600 text-sm font-bold">ESTOQUE</p><h3 class="text-2xl font-bold text-green-800">${App.data.stock.length}</h3></div>
                    <div class="p-4 bg-yellow-100 rounded-lg"><p class="text-gray-600 text-sm font-bold">FATURAMENTO</p><h3 class="text-2xl font-bold text-yellow-800">${App.utils.formatCurrency(totalRec)}</h3></div>
                    <div class="p-4 bg-red-100 rounded-lg"><p class="text-gray-600 text-sm font-bold">DESPESAS</p><h3 class="text-2xl font-bold text-red-800">${App.utils.formatCurrency(totalExp)}</h3></div>
                </div>
                <div class="border p-4 rounded-xl bg-gray-50">
                    <h3 class="font-bold text-indigo-800 mb-2">Cérebro da Clínica</h3>
                    <textarea id="brain-input" class="w-full p-2 border rounded text-sm" rows="3"></textarea>
                    <button id="save-brain-btn" class="mt-2 bg-indigo-600 text-white px-4 py-1 rounded text-sm">Salvar Diretrizes</button>
                </div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>
        `;

        // Carrega Brain
        const brainRef = App.db.ref(App.utils.getAdminPath(App.currentUser.uid, 'aiConfig/directives'));
        brainRef.once('value', s => { if(s.exists()) document.getElementById('brain-input').value = s.val().promptDirectives; });
        document.getElementById('save-brain-btn').onclick = () => {
            brainRef.update({ promptDirectives: document.getElementById('brain-input').value });
            alert("Cérebro atualizado!");
        };
    }

    function setupGlobalListeners() {
        // Login
        const form = document.getElementById('auth-form');
        // Remove listeners antigos clonando
        const newForm = form.cloneNode(true); form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;
            try {
                if(isLoginMode) await App.auth.signInWithEmailAndPassword(email, pass);
                else {
                    const c = await App.auth.createUserWithEmailAndPassword(email, pass);
                    await App.db.ref(App.utils.getAdminPath(c.user.uid, 'profile')).set({ email, role: 'dentist', registeredAt: new Date().toISOString() });
                }
            } catch(e) { alert("Erro Login: " + e.message); }
        });

        // Toggle Login/Cadastro
        document.getElementById('toggle-auth-mode').addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            document.getElementById('auth-submit-btn').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
        });

        // Modal e Logout
        document.getElementById('close-modal').addEventListener('click', App.utils.closeModal);
        document.getElementById('logout-button').addEventListener('click', () => App.auth.signOut().then(() => window.location.reload()));
    }

    document.addEventListener('DOMContentLoaded', init);
})();
