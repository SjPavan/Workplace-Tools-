const { v4: uuidv4 } = require('uuid');

class ConversationStore {
  constructor() {
    this.conversations = new Map();
  }

  getOrCreate(conversationId) {
    const id = conversationId || uuidv4();
    if (!this.conversations.has(id)) {
      this.conversations.set(id, {
        id,
        createdAt: new Date(),
        messages: []
      });
    }

    return this.conversations.get(id);
  }

  appendMessage(conversationId, message) {
    const conversation = this.getOrCreate(conversationId);
    conversation.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    return conversation;
  }

  getMessages(conversationId) {
    const conversation = this.conversations.get(conversationId);
    return conversation ? [...conversation.messages] : [];
  }

  reset() {
    this.conversations.clear();
  }
}

module.exports = new ConversationStore();
module.exports.ConversationStore = ConversationStore;
