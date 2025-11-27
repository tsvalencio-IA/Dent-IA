// =====================================================================
// 🧠 MÓDULO IA: js/ai.js (VERSÃO BLINDADA FINAL)
// =====================================================================
(function() {
    
    // Proteção contra carregamento duplicado ou falha de config
    var config = window.AppConfig || {};
    var GEMINI_MODEL = config.GEMINI_MODEL || "gemini-2.5-flash-preview-09-2025";
    var API_KEY = config.API_KEY;

    /**
     * Função ÚNICA para chamar o Google Gemini.
     * Trata erros internamente para não travar o botão da UI.
     */
    async function callGeminiAPI(systemPrompt, userMessage) {
        
        // 1. Validação básica
        if (!API_KEY || API_KEY.includes("SUA_CHAVE") || API_KEY.length < 10) {
            console.error("ERRO IA: Chave API inválida.");
            return "Erro de Configuração: A chave da IA não foi configurada corretamente no sistema.";
        }

        // 2. Endpoint Seguro (v1beta)
        var url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
        
        // 3. Montagem do Payload (Estratégia de Prompt Único para evitar Erro 400)
        var fullText = `
[INSTRUÇÕES DO SISTEMA]
${systemPrompt}

[DADOS DO CONTEXTO ATUAL]
${userMessage}
        `.trim();

        var payload = {
            contents: [{
                role: "user",
                parts: [{ text: fullText }]
            }]
        };

        try {
            // 4. Requisição
            var response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // 5. Tratamento de Erro HTTP
            if (!response.ok) {
                var errBody = await response.json();
                var errMsg = errBody.error ? errBody.error.message : "Erro desconhecido";
                console.error("Erro API Gemini:", errMsg);
                return `A IA encontrou um problema técnico: ${errMsg}`;
            }

            // 6. Sucesso
            var data = await response.json();
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "A IA não conseguiu formular uma resposta. Tente novamente.";
            }

        } catch (e) {
            console.error("Erro de Rede IA:", e);
            return "Erro de conexão com a Inteligência Artificial. Verifique sua internet.";
        }
    }

    // Exporta para uso global
    window.callGeminiAPI = callGeminiAPI;

})();
