// =====================================================================
// 🧠 MÓDULO IA: js/ai.js (CORRIGIDO PARA GEMINI 1.5)
// =====================================================================
(function() {
    const config = window.AppConfig || {};
    // O modelo padrão agora é o 1.5 Flash (Rápido e Inteligente)
    const PRIMARY_MODEL = config.GEMINI_MODEL || "gemini-1.5-flash";
    const API_KEY = config.API_KEY;

    async function callGeminiAPI(systemPrompt, userMessage) {
        if (!API_KEY || API_KEY.includes("SUA_CHAVE")) {
            console.error("ERRO GEMINI: API Key inválida.");
            return "Erro de Configuração: Chave API não encontrada.";
        }

        // URL Oficial da API v1beta
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent?key=${API_KEY}`;
        
        // Estrutura do Prompt Unificado
        const finalPrompt = `
CONTEXTO DO SISTEMA:
${systemPrompt}
---
MENSAGEM DO USUÁRIO:
${userMessage}
        `.trim();

        const payload = {
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("Erro detalhado da API:", errData);
                throw new Error(errData.error?.message || "Erro na comunicação com a IA");
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "A IA não conseguiu gerar uma resposta válida (Retorno vazio).";
            }

        } catch (error) {
            console.error("Erro IA:", error);
            return `Erro na IA: ${error.message}. Verifique se a chave API está ativa.`;
        }
    }

    window.callGeminiAPI = callGeminiAPI;
})();
