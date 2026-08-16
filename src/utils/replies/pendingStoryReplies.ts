import type {
  ReplyHandler,
} from './types'

import {
  createReply,
} from './replyFactory'

import {
  getLifeState,
  markLifeEventDiscussed,
} from '../lifeEngine'

import {
  buildRelationshipLifeHook,
} from '../lifeRelationship'

export const getPendingStoryReply:
  ReplyHandler = ({
    context,
    characterName,
    emotion,
  }) => {
    const lifeState =
      getLifeState(
        context.characterId,
      )

    const currentEvent =
      lifeState.currentEvent

    if (!currentEvent) {
      return null
    }

    /*
      If the event has already been
      introduced, let the normal dynamic
      dialogue system take over.

      The active story is now included in
      the LLM prompt by
      characterDialogueService.ts.
    */
    if (currentEvent.discussed) {
      return null
    }

    const personalisedHook =
      buildRelationshipLifeHook({
        relationshipStage:
          context.relationshipStage,

        mood:
          context.mood,

        memory:
          context.memory,

        originalHook:
          currentEvent.description,
      })

    markLifeEventDiscussed(
      context.characterId,
    )

    return createReply(
      `${characterName} turns their attention fully to you. "Before anything else, there is something I need to tell you. ${personalisedHook}"`,
      {
        emotion:
          emotion.emotion,

        animation:
          emotion.animation,

        internalThought:
          `I have finally introduced the active story event: ${currentEvent.title}.`,
      },
    )
  }