import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ChatHeader from '../components/Chat/ChatHeader'
import ChatSidebar from '../components/Chat/ChatSidebar'
import MessageBubble from '../components/Chat/MessageBubble'
import {
  getCharacterById,
} from '../services/characterRepository'
import {
  getCharacterMemory,
  getRelationshipProgress,
  rememberUserMessage,
} from '../utils/memory'
import {
  getCharacterMood,
  updateMoodFromMessage,
} from '../utils/mood'
import {
  getCharacterEngineContext,
} from '../utils/characterEngine'

import {
  getCharacterReply,
} from '../utils/replies'
import {
  applyReplyEffects,
} from '../utils/replyEffects'

type Message = {
  id: number
  sender: 'character' | 'user'
  text: string
  timestamp: string
}

type Conversation = {
  id: number
  title: string
  dateLabel: string
  messages: Message[]
}

const openingMessage =
  'Welcome, traveler. Tell me, what brings you into my world tonight?'

function getCurrentTime() {
  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function createFirstConversation(): Conversation {
  return {
    id: 1,
    title: 'New Conversation',
    dateLabel: 'Today',
    messages: [
      {
        id: 1,
        sender: 'character',
        text: openingMessage,
        timestamp: getCurrentTime(),
      },
    ],
  }
}

function loadConversations(
  storageKey: string,
): Conversation[] {
  try {
    const savedConversations =
      localStorage.getItem(storageKey)

    if (!savedConversations) {
      return [createFirstConversation()]
    }

    const parsed: unknown = JSON.parse(
      savedConversations,
    )

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createFirstConversation()]
    }

    return parsed.map(
      (
        savedConversation,
        conversationIndex,
      ): Conversation => {
        const conversation =
          savedConversation as Partial<Conversation>

        const savedMessages = Array.isArray(
          conversation.messages,
        )
          ? conversation.messages
          : []

        return {
          id:
            typeof conversation.id === 'number'
              ? conversation.id
              : Date.now() + conversationIndex,

          title:
            typeof conversation.title === 'string'
              ? conversation.title
              : 'Conversation',

          dateLabel:
            typeof conversation.dateLabel === 'string'
              ? conversation.dateLabel
              : 'Today',

          messages: savedMessages.map(
            (
              savedMessage: Partial<Message>,
              messageIndex,
            ): Message => ({
              id:
                typeof savedMessage.id === 'number'
                  ? savedMessage.id
                  : Date.now() + messageIndex,

              sender:
                savedMessage.sender === 'user'
                  ? 'user'
                  : 'character',

              text:
                typeof savedMessage.text === 'string'
                  ? savedMessage.text
                  : '',

              timestamp:
                typeof savedMessage.timestamp === 'string'
                  ? savedMessage.timestamp
                  : getCurrentTime(),
            }),
          ),
        }
      },
    )
  } catch {
    return [createFirstConversation()]
  }
}

function ChatPage() {
  const { id } = useParams()

const character = getCharacterById(
  Number(id),
)

const storageKey =
  `velvetverse-chat-${id ?? 'unknown'}`

  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [avatarFailed, setAvatarFailed] =
    useState(false)

  const [relationshipProgress, setRelationshipProgress] =
    useState(() => {
      if (!character) {
        return getRelationshipProgress(0)
      }

      return getRelationshipProgress(
        getCharacterMemory(character.id)
          .relationshipScore,
      )
    })

  const relationshipStage =
    relationshipProgress.currentStage

  const [mood, setMood] = useState(() => {
    if (!character) {
      return getCharacterMood(0)
    }

    return getCharacterMood(character.id)
  })

  const [conversations, setConversations] =
    useState<Conversation[]>(() =>
      loadConversations(storageKey),
    )

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState(
    () => conversations[0]?.id ?? 1,
  )

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

  const activeConversation =
    conversations.find(
      (conversation) =>
        conversation.id === activeConversationId,
    ) ?? conversations[0]

  const messages =
    activeConversation?.messages ?? []

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify(conversations),
    )
  }, [conversations, storageKey])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isTyping])

  useEffect(() => {
    const loadedConversations =
      loadConversations(storageKey)

    setConversations(loadedConversations)
    setActiveConversationId(
      loadedConversations[0]?.id ?? 1,
    )
    setMessage('')
    setIsTyping(false)
    setAvatarFailed(false)
  }, [storageKey])

  useEffect(() => {
    if (!character) {
      setRelationshipProgress(
        getRelationshipProgress(0),
      )
      setMood(getCharacterMood(0))
      return
    }

    const context =
      getCharacterEngineContext(character.id)

    setRelationshipProgress(
      context.relationshipProgress,
    )
    setMood(context.mood)
  }, [character])

  if (!character) {
    return (
      <>
        <Navbar />

        <main className="chat-page">
          <h1>Character not found</h1>

          <Link to="/characters">
            Back to Characters
          </Link>
        </main>
      </>
    )
  }

  const currentCharacter = character

  const characterInitials =
    currentCharacter.name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()

  function addMessageToConversation(
    conversationId: number,
    newMessage: Message,
  ) {
    setConversations(
      (currentConversations) =>
        currentConversations.map(
          (conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: [
                    ...conversation.messages,
                    newMessage,
                  ],
                }
              : conversation,
        ),
    )
  }

  function sendMessage() {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || isTyping) {
      return
    }

    const currentConversationId =
      activeConversationId

    rememberUserMessage(
      currentCharacter.id,
      trimmedMessage,
    )

    updateMoodFromMessage(
      currentCharacter.id,
      trimmedMessage,
    )

    const engineContext =
      getCharacterEngineContext(
        currentCharacter.id,
      )

    setRelationshipProgress(
      engineContext.relationshipProgress,
    )
    setMood(engineContext.mood)

    addMessageToConversation(
      currentConversationId,
      {
        id: Date.now(),
        sender: 'user',
        text: trimmedMessage,
        timestamp: getCurrentTime(),
      },
    )

    const reply = getCharacterReply(
      engineContext,
      currentCharacter.name,
      trimmedMessage,
    )

    setMessage('')
    setIsTyping(true)

    window.setTimeout(() => {
      applyReplyEffects(
        currentCharacter.id,
        reply,
      )

      const updatedContext =
        getCharacterEngineContext(
          currentCharacter.id,
        )

      setRelationshipProgress(
        updatedContext.relationshipProgress,
      )

      setMood(updatedContext.mood)

      addMessageToConversation(
        currentConversationId,
        {
          id: Date.now() + 1,
          sender: 'character',
          text: reply.text,
          timestamp: getCurrentTime(),
        },
      )

      setIsTyping(false)
    }, reply.typingDelay)
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    sendMessage()
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      sendMessage()
    }
  }

  function handleSelectConversation(
    conversationId: number,
  ) {
    setActiveConversationId(
      conversationId,
    )
    setMessage('')
    setIsTyping(false)
  }

  function handleNewConversation() {
    const newConversationId = Date.now()

    const context =
      getCharacterEngineContext(
        currentCharacter.id,
      )

    const memory = context.memory
    const currentStage =
      context.relationshipStage

    let personalisedOpening =
      memory.userName
        ? `Welcome back, ${memory.userName}. Tell me, what brings you into my world tonight?`
        : openingMessage

    if (currentStage === 'Soulmate') {
      personalisedOpening = `${
        memory.userName
          ? `${memory.userName}... `
          : ''
      }You returned. I have missed your presence more than I care to admit.`
    } else if (
      currentStage === 'Best Friend' ||
      currentStage === 'Trusted'
    ) {
      personalisedOpening = `Welcome back${
        memory.userName
          ? `, ${memory.userName}`
          : ''
      }. I am glad to see you again.`
    } else if (
      currentStage === 'Hostile'
    ) {
      personalisedOpening =
        `${currentCharacter.name} watches you cautiously. "You have returned. Speak."`
    }

    const newConversation: Conversation = {
      id: newConversationId,
      title:
        `Conversation ${conversations.length + 1}`,
      dateLabel: 'Today',
      messages: [
        {
          id: newConversationId + 1,
          sender: 'character',
          text: personalisedOpening,
          timestamp: getCurrentTime(),
        },
      ],
    }

    setConversations(
      (currentConversations) => [
        newConversation,
        ...currentConversations,
      ],
    )

    setActiveConversationId(
      newConversationId,
    )
    setMessage('')
    setIsTyping(false)
  }

  return (
    <>
      <Navbar />

      <main
        className="chat-page"
        style={
          {
            '--accent-color':
              currentCharacter.accentColor,
          } as React.CSSProperties
        }
      >
        <div className="chat-layout">
          <ChatSidebar
            conversations={conversations}
            activeConversationId={
              activeConversationId
            }
            onSelectConversation={
              handleSelectConversation
            }
            onNewConversation={
              handleNewConversation
            }
          />

          <section className="chat-shell">
            <ChatHeader
              id={currentCharacter.id}
              name={currentCharacter.name}
              title={currentCharacter.title}
              image={currentCharacter.image}
              initials={characterInitials}
              avatarFailed={avatarFailed}
              relationshipStage={
                relationshipStage
              }
              relationshipProgress={
                relationshipProgress
              }
              mood={mood}
              onAvatarError={() =>
                setAvatarFailed(true)
              }
            />

            <div className="chat-messages">
              {messages.map(
                (chatMessage) => (
                  <MessageBubble
                    key={chatMessage.id}
                    sender={
                      chatMessage.sender
                    }
                    text={chatMessage.text}
                    timestamp={
                      chatMessage.timestamp
                    }
                  />
                ),
              )}

              {isTyping && (
                <article className="chat-message chat-message-character">
                  <div
                    className="typing-indicator"
                    aria-label={`${currentCharacter.name} is typing`}
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                </article>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              className="chat-form"
              onSubmit={handleSubmit}
            >
              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value,
                  )
                }
                onKeyDown={handleKeyDown}
                placeholder={`Message ${currentCharacter.name}...`}
                rows={1}
                disabled={isTyping}
              />

              <button
                type="submit"
                disabled={
                  !message.trim() ||
                  isTyping
                }
              >
                Send
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  )
}

export default ChatPage