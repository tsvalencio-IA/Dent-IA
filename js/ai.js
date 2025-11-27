// =====================================================================
// 🧠 MÓDULO IA: js/ai.js (COM SISTEMA ANTI-FALHA)
// =====================================================================
(function() {
    const config = window.AppConfig || {};
    // Define modelos: Principal (Flash) e Reserva (Pro)
    const PRIMARY_MODEL = config.GEMINI_MODEL || "gemini-1.5-flash";
    const FALLBACK_MODEL = "gemini-pro"; 
    const API_KEY = config.API_KEY;

    // Função interna para fazer a requisição
    async function tryGenerate(modelName, systemPrompt, userMessage) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
        
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

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || response.statusText);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    async function callGeminiAPI(systemPrompt, userMessage) {
        if (!API_KEY || API_KEY.length < 10) {
            console.error("ERRO GEMINI: API Key inválida.");
            return "Erro: Chave API não configurada no config.js.";
        }

        try {
            // Tenta o modelo principal (1.5 Flash)
            return await tryGenerate(PRIMARY_MODEL, systemPrompt, userMessage);
        } catch (error) {
            console.warn(`IA: Erro no modelo ${PRIMARY_MODEL}. Tentando fallback para ${FALLBACK_MODEL}...`, error);
            
            try {
                // Se falhar, tenta o modelo reserva (Gemini Pro - mais estável)
                return await tryGenerate(FALLBACK_MODEL, systemPrompt, userMessage);
            } catch (fallbackError) {
                console.error("IA: Falha crítica em todos os modelos.", fallbackError);
                return `Erro na IA: ${fallbackError.message}. Verifique sua Chave API.`;
            }
        }
    }

    window.callGeminiAPI = callGeminiAPI;
})();
