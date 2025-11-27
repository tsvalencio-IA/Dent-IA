// =====================================================================
// 🧠 MÓDULO IA: js/ai.js
// =====================================================================
(function() {
    const config = window.AppConfig || {};
    const GEMINI_MODEL = config.GEMINI_MODEL || "gemini-1.5-flash"; 
    const API_KEY = config.API_KEY;

    async function callGeminiAPI(systemPrompt, userMessage) {
        if (!API_KEY || API_KEY.length < 10) {
            console.error("ERRO GEMINI: API Key inválida.");
            return "Erro: Chave API não configurada.";
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
        
        // Unifica prompts para garantir compatibilidade
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

            if (!response.ok) throw new Error((await response.json()).error.message);

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "A IA não respondeu.";

        } catch (error) {
            console.error("Erro IA:", error);
            return `Erro técnico na IA: ${error.message}`;
        }
    }

    window.callGeminiAPI = callGeminiAPI;
})();
