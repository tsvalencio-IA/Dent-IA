// =====================================================================
// 🔑 ARQUIVO DE CONFIGURAÇÃO: js/config.js
// =====================================================================
(function() {
    // 1. CONFIGURAÇÃO FIREBASE
    const firebaseConfig = {
        apiKey: "AIzaSyBs1EWOvZXw52Ih-m_mhsCofRcjmxY8xQw",
        authDomain: "dental-80cad.firebaseapp.com",
        databaseURL: "https://dental-80cad-default-rtdb.firebaseio.com",
        projectId: "dental-80cad",
        storageBucket: "dental-80cad.firebasestorage.app",
        messagingSenderId: "883904798384",
        appId: "1:883904798384:web:df25e88c245d4edc1ba575"
    };

    // 2. CONFIGURAÇÃO CLOUDINARY
    const CLOUDINARY_CLOUD_NAME = "djtiaygrs";
    const CLOUDINARY_UPLOAD_PRESET = "dental";

    // 3. CONFIGURAÇÃO GOOGLE GEMINI API
    // Usamos o Flash como padrão.
    const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"; 
    
    // 🔴 COLE AQUI SUA CHAVE NOVA (CRIADA AGORA, SEM RESTRIÇÕES)
    const API_KEY = "AIzaSyDR8ZRm_vxoAxNoLy95MiNDk3WgkIkx3Tg"; 

    // 4. ITENS DE NAVEGAÇÃO
    const NAV_ITEMS = [
        { id: 'dashboard', label: 'Dashboard & IA', icon: 'bxs-dashboard' },
        { id: 'patients', label: 'Gestão de Pacientes', icon: 'bxs-group' },
        { id: 'financials', label: 'Financeiro & Estoque', icon: 'bxs-wallet' },
    ];

    window.AppConfig = {
        firebaseConfig,
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_UPLOAD_PRESET,
        GEMINI_MODEL,
        API_KEY,
        APP_ID: 'dentista-inteligente-app',
        NAV_ITEMS
    };
})();
