// =====================================================================
// 🧠 MÓDULO IA: js/ai.js (ATUALIZADO PARA MODELOS V1.5)
// =====================================================================
(function() {
    const config = window.AppConfig || {};
    const API_KEY = config.API_KEY;

    // Lista atualizada: Apenas modelos V1.5 ativos
    // Se o Flash falhar, tenta o Pro (mais robusto)
    const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-1.5-pro"];

    async function tryGenerate(modelName, systemPrompt, userMessage) {
        console.log(`🤖 Testando modelo: ${modelName}...`);
        
        // URL Oficial v1beta (Padrão atual do Google)
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
            const err = await response.json();
            // Retorna o erro exato para o console
            throw new Error(err.error?.message || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("A IA respondeu, mas o texto veio vazio.");
        }
    }

    async function callGeminiAPI(systemPrompt, userMessage) {
        if (!API_KEY || API_KEY.length < 10 || API_KEY.includes("COLE_SUA_CHAVE")) {
            return "Erro: Chave API inválida. Verifique o arquivo config.js.";
        }

        // Loop de Tentativas
        for (let i = 0; i < MODELS_TO_TRY.length; i++) {
            const model = MODELS_TO_TRY[i];
            try {
                const result = await tryGenerate(model, systemPrompt, userMessage);
                return result; // SUCESSO!
            } catch (error) {
                console.warn(`⚠️ Falha ao conectar com ${model}:`, error.message);
                
                // Se foi a última tentativa, desiste e mostra o erro
                if (i === MODELS_TO_TRY.length - 1) {
                    return `Erro Fatal na IA: Bloqueio ou Chave Inválida. Detalhe: ${error.message}`;
                }
            }
        }
    }

    window.callGeminiAPI = callGeminiAPI;
})();
