type Conversation = {
  id: number
  title: string
  dateLabel: string
}

type ChatSidebarProps = {
  conversations: Conversation[]
  activeConversationId: number
  onSelectConversation: (conversationId: number) => void
  onNewConversation: () => void
}

function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatSidebarProps) {
  return (
    <aside className="chat-sidebar">
      <button
        type="button"
        className="chat-new-button"
        onClick={onNewConversation}
      >
        + New Chat
      </button>

      <div className="chat-sidebar-section">
        <h2>Conversations</h2>

        <div className="chat-conversation-list">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={
                conversation.id === activeConversationId
                  ? 'chat-conversation-item active'
                  : 'chat-conversation-item'
              }
              onClick={() =>
                onSelectConversation(conversation.id)
              }
            >
              <span>{conversation.title}</span>
              <small>{conversation.dateLabel}</small>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default ChatSidebar