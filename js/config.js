(function() {
    const firebaseConfig = {
        apiKey: "AIzaSyBs1EWOvZXw52Ih-m_mhsCofRcjmxY8xQw",
        authDomain: "dental-80cad.firebaseapp.com",
        databaseURL: "https://dental-80cad-default-rtdb.firebaseio.com",
        projectId: "dental-80cad",
        storageBucket: "dental-80cad.firebasestorage.app",
        messagingSenderId: "883904798384",
        appId: "1:883904798384:web:df25e88c245d4edc1ba575"
    };

    const NAV_ITEMS = [
        { id: 'dashboard', label: 'Dashboard & IA', icon: 'bxs-dashboard' },
        { id: 'patients', label: 'Gestão de Pacientes', icon: 'bxs-group' },
        { id: 'financials', label: 'Financeiro & Estoque', icon: 'bxs-wallet' },
    ];

    // EXPORTA PARA O ESCOPO GLOBAL
    window.AppConfig = {
        firebaseConfig,
        CLOUDINARY_CLOUD_NAME: "djtiaygrs",
        CLOUDINARY_UPLOAD_PRESET: "dental",
        GEMINI_MODEL: "gemini-2.5-flash-preview-09-2025",
        API_KEY: "AIzaSyDPtGLwgenIdC3G3Hkojl9JEy6TPpsaRhg", // <--- COLOQUE SUA CHAVE NOVA AQUI
        APP_ID: 'dentista-inteligente-app',
        NAV_ITEMS
    };
})();
