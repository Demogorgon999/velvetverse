type MessageBubbleProps = {
  sender: 'character' | 'user'
  text: string
  timestamp?: string
}

function MessageBubble({
  sender,
  text,
  timestamp,
}: MessageBubbleProps) {
  return (
    <article
      className={`chat-message chat-message-${sender}`}
    >
      <p>{text}</p>

      {timestamp && (
        <time className="chat-message-time">
          {timestamp}
        </time>
      )}
    </article>
  )
}

export default MessageBubble