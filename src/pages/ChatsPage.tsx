import {
  useMemo,
  useState,
} from 'react'

import type {
  CSSProperties,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import Navbar from '../components/Navbar'
import LifeStatus from '../components/Chat/LifeStatus'

import {
  characters,
} from '../data/characters'

import {
  simulateLifeSinceLastSeen,
} from '../utils/lifeEngine'

import type {
  LifeState,
} from '../utils/lifeEngine'

import './ChatsPage.css'

type StoredMessage = {
  id: number
  sender: 'character' | 'user'
  text: string
  timestamp: string
}

type StoredConversation = {
  id: number
  title: string
  dateLabel: string
  messages: StoredMessage[]
}

type ActiveChat = {
  characterId: number
  characterName: string
  characterTitle: string
  characterImage: string
  accentColor: string
  lastMessage: string
  lastTimestamp: string
  conversationCount: number
  lifeState: LifeState
}

function getActiveChats(): ActiveChat[] {
  return characters.flatMap(
    (character) => {
      const storageKey =
        `velvetverse-chat-${character.id}`

      const savedValue =
        localStorage.getItem(storageKey)

      if (!savedValue) {
        return []
      }

      try {
        const conversations =
          JSON.parse(
            savedValue,
          ) as StoredConversation[]

        if (
          !Array.isArray(conversations) ||
          conversations.length === 0
        ) {
          return []
        }

        const newestConversation =
          conversations[0]

        const latestMessage =
          newestConversation.messages?.[
            newestConversation.messages.length -
              1
          ]

        const lifeState =
          simulateLifeSinceLastSeen(
            character.id,
          )

        return [
          {
            characterId:
              character.id,

            characterName:
              character.name,

            characterTitle:
              character.title,

            characterImage:
              character.image,

            accentColor:
              character.accentColor,

            lastMessage:
              latestMessage?.text ??
              'Open this conversation.',

            lastTimestamp:
              latestMessage?.timestamp ??
              newestConversation.dateLabel ??
              'Today',

            conversationCount:
              conversations.length,

            lifeState,
          },
        ]
      } catch {
        return []
      }
    },
  )
}

function ChatsPage() {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<number | null>(null)

  const activeChats =
    useMemo(
      () => getActiveChats(),
      [],
    )

  const filteredChats =
    activeChats.filter(
      (chat) => {
        const search =
          searchTerm
            .trim()
            .toLowerCase()

        if (!search) {
          return true
        }

        return (
          chat.characterName
            .toLowerCase()
            .includes(search) ||
          chat.characterTitle
            .toLowerCase()
            .includes(search) ||
          chat.lastMessage
            .toLowerCase()
            .includes(search)
        )
      },
    )

  function toggleMenu(
    characterId: number,
  ) {
    setOpenMenuId(
      (currentId) =>
        currentId === characterId
          ? null
          : characterId,
    )
  }

  function handleRenameConversation(
    characterName: string,
  ) {
    setOpenMenuId(null)

    window.alert(
      `Rename conversation for ${characterName} will be connected later.`,
    )
  }

  function handleClearConversation(
    characterName: string,
  ) {
    setOpenMenuId(null)

    window.alert(
      `Clear Conversation for ${characterName} will be connected next.`,
    )
  }

  function handleFullReset(
    characterName: string,
  ) {
    setOpenMenuId(null)

    window.alert(
      `Full Character Reset for ${characterName} will be connected next.`,
    )
  }

  return (
    <>
      <Navbar />

      <main className="chats-page">
        <header className="chats-header">
          <div>
            <p className="chats-eyebrow">
              Your living worlds
            </p>

            <h1>Conversations</h1>

            <p className="chats-header-copy">
              Return to the characters,
              stories, and worlds that
              continue to evolve around you.
            </p>
          </div>

          <Link
            to="/characters"
            className="chats-primary-button"
          >
            + New Chat
          </Link>
        </header>

        <section className="chats-toolbar">
          <div className="chats-search">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search conversations..."
            />
          </div>

          <span className="chats-count">
            {activeChats.length}{' '}
            {activeChats.length === 1
              ? 'conversation'
              : 'conversations'}
          </span>
        </section>

        {filteredChats.length > 0 ? (
          <section className="chats-list">
            {filteredChats.map(
              (chat) => (
                <article
                  key={
                    chat.characterId
                  }
                  className={
                    chat.lifeState
                      .needsAttention
                      ? 'chat-hub-row chat-hub-row-attention'
                      : 'chat-hub-row'
                  }
                  style={
                    {
                      '--chat-accent':
                        chat.accentColor,
                    } as CSSProperties
                  }
                >
                  <Link
                    to={`/chat/${chat.characterId}`}
                    className="chat-hub-main-link"
                  >
                    <div className="chat-hub-avatar">
                      <img
                        src={
                          chat.characterImage
                        }
                        alt={
                          chat.characterName
                        }
                      />

                      {chat.lifeState
                        .needsAttention && (
                        <span
                          className="chat-hub-attention-dot"
                          aria-label="Needs your attention"
                        />
                      )}
                    </div>

                    <div className="chat-hub-content">
                      <div className="chat-hub-name-row">
                        <div>
                          <h2>
                            {
                              chat.characterName
                            }
                          </h2>

                          <p>
                            {
                              chat.characterTitle
                            }
                          </p>
                        </div>

                        <span className="chat-hub-time">
                          {
                            chat.lastTimestamp
                          }
                        </span>
                      </div>

                      <LifeStatus
                        lifeState={
                          chat.lifeState
                        }
                        compact
                      />

                      {chat.lifeState
                        .returnHook ? (
                        <p className="chat-hub-story-hook">
                          {
                            chat.lifeState
                              .returnHook
                          }
                        </p>
                      ) : (
                        <p className="chat-hub-last-message">
                          {
                            chat.lastMessage
                          }
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="chat-hub-menu-wrapper">
                    <button
                      type="button"
                      className="chat-hub-menu-button"
                      aria-label={`Options for ${chat.characterName}`}
                      aria-expanded={
                        openMenuId ===
                        chat.characterId
                      }
                      onClick={() =>
                        toggleMenu(
                          chat.characterId,
                        )
                      }
                    >
                      ⋮
                    </button>

                    {openMenuId ===
                      chat.characterId && (
                      <div className="chat-hub-menu">
                        <Link
                          to={`/chat/${chat.characterId}`}
                          className="chat-hub-menu-item"
                          onClick={() =>
                            setOpenMenuId(
                              null,
                            )
                          }
                        >
                          Open Chat
                        </Link>

                        <button
                          type="button"
                          className="chat-hub-menu-item"
                          onClick={() =>
                            handleRenameConversation(
                              chat.characterName,
                            )
                          }
                        >
                          Rename Conversation
                        </button>

                        <div className="chat-hub-menu-divider" />

                        <button
                          type="button"
                          className="chat-hub-menu-item"
                          onClick={() =>
                            handleClearConversation(
                              chat.characterName,
                            )
                          }
                        >
                          Clear Conversation
                        </button>

                        <button
                          type="button"
                          className="chat-hub-menu-item chat-hub-menu-danger"
                          onClick={() =>
                            handleFullReset(
                              chat.characterName,
                            )
                          }
                        >
                          Full Character Reset
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ),
            )}
          </section>
        ) : activeChats.length > 0 ? (
          <section className="chats-empty-state">
            <div className="chats-empty-icon">
              ⌕
            </div>

            <h2>
              No conversations found
            </h2>

            <p>
              Try searching for a different
              character or message.
            </p>
          </section>
        ) : (
          <section className="chats-empty-state">
            <div className="chats-empty-icon">
              ◇
            </div>

            <h2>
              No conversations yet
            </h2>

            <p>
              Choose a character and begin
              your first journey.
            </p>

            <Link
              to="/characters"
              className="chats-primary-button"
            >
              Explore Characters
            </Link>
          </section>
        )}
      </main>
    </>
  )
}

export default ChatsPage