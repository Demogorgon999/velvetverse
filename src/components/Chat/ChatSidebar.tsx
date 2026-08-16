type Conversation = {
  id: number
  title: string
  dateLabel: string
}

type ChatSidebarProps = {
  conversations: Conversation[]
  activeConversationId: number
  characterName: string
  onSelectConversation: (
    conversationId: number,
  ) => void
  onNewConversation: () => void
  onResetCharacter: () => void
}

function ChatSidebar({
  conversations,
  activeConversationId,
  characterName,
  onSelectConversation,
  onNewConversation,
  onResetCharacter,
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
          {conversations.map(
            (conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={
                  conversation.id ===
                  activeConversationId
                    ? 'chat-conversation-item active'
                    : 'chat-conversation-item'
                }
                onClick={() =>
                  onSelectConversation(
                    conversation.id,
                  )
                }
              >
                <span>
                  {conversation.title}
                </span>

                <small>
                  {conversation.dateLabel}
                </small>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="chat-reset-section">
        <p>
          Start over completely with{' '}
          {characterName}.
        </p>

        <button
          type="button"
          className="chat-reset-button"
          onClick={onResetCharacter}
        >
          Reset Character
        </button>
      </div>
    </aside>
  )
}

export default ChatSidebar