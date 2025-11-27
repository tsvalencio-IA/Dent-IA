// =====================================================================
// 🧠 MÓDULO IA: js/ai.js (COM SISTEMA ANTI-FALHA ROBUSTO)
// =====================================================================
(function() {
    const config = window.AppConfig || {};
    const API_KEY = config.API_KEY;

    // Lista de modelos para tentar (Se o primeiro falhar, ele tenta o próximo)
    const MODELS_TO_TRY = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro"];

    async function tryGenerate(modelName, systemPrompt, userMessage) {
        // Monta a URL da API
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
            // Se der erro (404, 403, 500), lança exceção para o catch pegar
            const err = await response.json();
            throw new Error(err.error?.message || response.statusText);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Resposta vazia da IA.");
        }
    }

    async function callGeminiAPI(systemPrompt, userMessage) {
        if (!API_KEY || API_KEY.length < 10) {
            return "Erro: Chave API inválida ou não configurada.";
        }

        // Loop de Tentativas (Fallback)
        for (let i = 0; i < MODELS_TO_TRY.length; i++) {
            const model = MODELS_TO_TRY[i];
            try {
                const result = await tryGenerate(model, systemPrompt, userMessage);
                return result; // SUCESSO: Retorna a resposta e para o loop
            } catch (error) {
                console.warn(`⚠️ Tentativa com ${model} falhou.`, error.message);
                
                // Se foi a última tentativa e falhou todas
                if (i === MODELS_TO_TRY.length - 1) {
                    return `Erro na IA: Não foi possível conectar. Detalhe: ${error.message}`;
                }
                // Se não, o loop continua e tenta o próximo modelo da lista
            }
        }
    }

    window.callGeminiAPI = callGeminiAPI;
})();
