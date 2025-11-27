(function() {
    // ESTADO GLOBAL COMPARTILHADO
    window.DentistaApp = {
        db: null, auth: null, currentUser: null, currentView: 'dashboard',
        data: { patients: [], receivables: [], stock: [], expenses: [] },
        utils: {
            formatCurrency: v => 'R$ ' + parseFloat(v||0).toFixed(2).replace('.', ','),
            formatDate: d => d ? new Date(d).toLocaleDateString('pt-BR') : '-',
            getAdminPath: (uid, path) => `artifacts/${window.AppConfig.APP_ID}/users/${uid}/${path}`,
            // Modal Global
            openModal: (title, html, maxW) => {
                const m = document.getElementById('app-modal');
                m.querySelector('.modal-content').className = 'modal-content bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] w-full ' + (maxW || 'max-w-md');
                document.getElementById('modal-title').textContent = title;
                document.getElementById('modal-body').innerHTML = html;
                m.classList.remove('hidden'); m.classList.add('flex');
            },
            closeModal: () => { document.getElementById('app-modal').classList.add('hidden'); document.getElementById('app-modal').classList.remove('flex'); }
        }
    };

    const App = window.DentistaApp;
    let isLoginMode = true;

    function init() {
        if (!firebase.apps.length) firebase.initializeApp(window.AppConfig.firebaseConfig);
        App.db = firebase.database();
        App.auth = firebase.auth();
        setupAuth();
        setupListeners();
    }

    function setupAuth() {
        App.auth.onAuthStateChanged(user => {
            if (user) {
                const ref = App.db.ref(App.utils.getAdminPath(user.uid, 'profile'));
                ref.once('value').then(s => {
                    const p = s.val();
                    // Verifica permissão
                    if ((p && p.role === 'dentist') || user.email === 'admin@ts.com') {
                        App.currentUser = { uid: user.uid, email: user.email };
                        if (!p && user.email === 'admin@ts.com') ref.set({ email: user.email, role: 'dentist', registeredAt: new Date().toISOString() });
                        loadData(); 
                        showUI();
                    } else { alert("Acesso restrito."); App.auth.signOut(); }
                });
            } else { App.currentUser = null; showLogin(); }
        });
    }

    function loadData() {
        const uid = App.currentUser.uid;
        // Carrega todos os dados em tempo real
        const endpoints = { 'patients': 'patients', 'stock': 'stock', 'finance/receivable': 'receivables', 'finance/expenses': 'expenses' };
        
        Object.keys(endpoints).forEach(path => {
            App.db.ref(App.utils.getAdminPath(uid, path)).on('value', s => {
                App.data[endpoints[path]] = [];
                if(s.exists()) s.forEach(c => { let i = c.val(); i.id = c.key; App.data[endpoints[path]].push(i); });
                
                // Atualiza a tela ativa automaticamente
                if(App.currentView === 'dashboard') renderDashboard();
                else if(App.currentView === 'patients' && window.renderPatientManager) window.renderPatientManager();
                else if(App.currentView === 'financials' && window.renderFinancialManager) window.renderFinancialManager();
            });
        });
    }

    function showLogin() { document.getElementById('login-screen').classList.remove('hidden'); document.getElementById('app-container').classList.add('hidden'); }
    function showUI() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('app-container').classList.remove('hidden'); renderSidebar(); navigateTo('dashboard'); }

    function navigateTo(view) {
        App.currentView = view;
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        if (view === 'dashboard') renderDashboard();
        else if (view === 'patients' && window.renderPatientManager) window.renderPatientManager();
        else if (view === 'financials' && window.renderFinancialManager) window.renderFinancialManager();
        
        document.querySelectorAll('#nav-menu button').forEach(btn => {
            btn.className = btn.dataset.view === view ? 'flex items-center p-3 rounded-xl w-full text-left bg-indigo-600 text-white shadow-lg' : 'flex items-center p-3 rounded-xl w-full text-left text-indigo-200 hover:bg-indigo-700 hover:text-white';
        });
    }

    function renderDashboard() {
        const totalRec = App.data.receivables.reduce((acc, r) => r.status === 'Recebido' ? acc + parseFloat(r.amount||0) : acc, 0);
        const totalExp = App.data.expenses.reduce((acc, e) => e.status === 'Pago' ? acc + parseFloat(e.amount||0) : acc, 0);
        
        document.getElementById('main-content').innerHTML = `
            <div class="p-8 bg-white shadow-2xl rounded-2xl border border-indigo-100">
                <h2 class="text-3xl font-bold text-indigo-800 mb-6">Dashboard Geral</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="p-4 bg-indigo-100 rounded-lg"><p class="font-bold text-sm text-gray-600">PACIENTES</p><h3 class="text-2xl font-bold text-indigo-800">${App.data.patients.length}</h3></div>
                    <div class="p-4 bg-green-100 rounded-lg"><p class="font-bold text-sm text-gray-600">ESTOQUE</p><h3 class="text-2xl font-bold text-green-800">${App.data.stock.length}</h3></div>
                    <div class="p-4 bg-yellow-100 rounded-lg"><p class="font-bold text-sm text-gray-600">CAIXA</p><h3 class="text-2xl font-bold text-yellow-800">${App.utils.formatCurrency(totalRec)}</h3></div>
                    <div class="p-4 bg-red-100 rounded-lg"><p class="font-bold text-sm text-gray-600">DESPESAS</p><h3 class="text-2xl font-bold text-red-800">${App.utils.formatCurrency(totalExp)}</h3></div>
                </div>
                <div class="border p-4 rounded-xl bg-gray-50">
                    <h3 class="font-bold text-indigo-800 mb-2">Cérebro da Clínica</h3>
                    <textarea id="brain-input" class="w-full p-2 border rounded text-sm" rows="3"></textarea>
                    <button id="save-brain" class="mt-2 bg-indigo-600 text-white px-4 py-1 rounded">Salvar Diretrizes</button>
                </div>
                <footer class="text-center py-4 text-xs text-gray-400 mt-8">Desenvolvido com 🤖, por <strong>thIAguinho Soluções</strong></footer>
            </div>`;
        
        const brainPath = App.utils.getAdminPath(App.currentUser.uid, 'aiConfig/directives');
        App.db.ref(brainPath).once('value', s => { if(s.exists()) document.getElementById('brain-input').value = s.val().promptDirectives; });
        document.getElementById('save-brain').onclick = () => { App.db.ref(brainPath).update({ promptDirectives: document.getElementById('brain-input').value }); alert("Cérebro atualizado!"); };
    }

    function renderSidebar() {
        const menu = document.getElementById('nav-menu'); menu.innerHTML = '';
        window.AppConfig.NAV_ITEMS.forEach(item => {
            const btn = document.createElement('button');
            btn.dataset.view = item.id;
            btn.className = 'flex items-center p-3 rounded-xl w-full text-left text-indigo-200 hover:bg-indigo-700 hover:text-white';
            btn.innerHTML = `<i class='bx ${item.icon} text-xl mr-3'></i><span class='font-semibold'>${item.label}</span>`;
            btn.onclick = () => navigateTo(item.id);
            menu.appendChild(btn);
        });
    }

    function setupListeners() {
        document.getElementById('close-modal').addEventListener('click', App.utils.closeModal);
        document.getElementById('logout-button').addEventListener('click', () => App.auth.signOut().then(() => window.location.reload()));
        
        const form = document.getElementById('auth-form');
        const newForm = form.cloneNode(true); form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const em = document.getElementById('auth-email').value;
                const pw = document.getElementById('auth-password').value;
                if (isLoginMode) await App.auth.signInWithEmailAndPassword(em, pw);
                else {
                    const c = await App.auth.createUserWithEmailAndPassword(em, pw);
                    await App.db.ref(App.utils.getAdminPath(c.user.uid, 'profile')).set({ email: em, role: 'dentist', registeredAt: new Date().toISOString() });
                }
            } catch(e) { alert("Erro: " + e.message); }
        });

        document.getElementById('toggle-auth-mode').addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            document.getElementById('auth-submit-btn').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
