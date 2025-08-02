// Serviço para comunicação com webhooks do n8n

const N8N_WEBHOOK_URL = 'https://c8211fd0efea.ngrok-free.app/webhook/EU_MAIOR';

/**
 * Inicializa o guia da IA no n8n com os dados do usuário
 * @param {Object} userData - Dados do perfil do usuário
 * @returns {Promise<Object>} Resposta do webhook
 */
export async function initializeGuide(userData) {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'INITIALIZE_GUIDE',
        userData: userData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao inicializar guia:', error);
    throw error;
  }
}

/**
 * Envia uma mensagem para a IA no n8n
 * @param {string} message - Mensagem do usuário
 * @returns {Promise<Object>} Resposta da IA
 */
export async function sendMessage(message) {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'SEND_MESSAGE',
        message: message
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}