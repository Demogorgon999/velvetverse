import type {
  CharacterEngineContext,
} from '../characterEngine'

import type {
  CharacterReply,
} from '../../types/reply'

import type {
  ReplyHandler,
  ReplyHandlerArgs,
  ConversationHistoryMessage,
} from './types'

import {
  detectIntent,
} from '../intent'

import {
  makeCharacterDecision,
} from '../decisionEngine'

import {
  detectCharacterEmotion,
} from '../emotionEngine'

import {
  createResponsePlan,
} from '../responsePlanner'

import {
  calculateRelationshipDelta,
} from '../relationshipEffects'

import {
  evaluateRelationshipInteraction,
} from '../relationshipEngine'

import {
  getGreetingReply,
} from './greetingReplies'

import {
  getGratitudeReply,
} from './gratitudeReplies'

import {
  getSecretReply,
} from './secretReplies'

import {
  getIdentityReply,
} from './identityReplies'

import {
  getLoreReply,
} from './loreReplies'

import {
  getMemoryReply,
} from './memoryReplies'

import {
  getFallbackReply,
} from './fallbackReplies'

import {
  generateDialogue,
} from '../../services/characterDialogueService'

import {
  createReply,
} from './replyFactory'

import {
  getLifeState,
} from '../lifeEngine'

import {
  interpretRoleplay,
} from '../../services/roleplayInterpreterService'

import {
  updatePresenceFromMovement,
} from '../presenceEngine'

import {
  resolvePerception,
} from '../intent/perceptionEngine'


const replyHandlers:
  ReplyHandler[] = [
    getGreetingReply,
    getGratitudeReply,
    getSecretReply,
    getIdentityReply,
    getLoreReply,
    getMemoryReply,
  ]


export async function getCharacterReply(
  context:
    CharacterEngineContext,

  characterName:
    string,

  userMessage:
    string,

  conversationHistory:
    ConversationHistoryMessage[] = [],
): Promise<CharacterReply> {
  const intent =
    detectIntent(
      userMessage,
    )


  const decision =
    makeCharacterDecision({
      context,
      intent,
    })


  const detectedEmotion =
    detectCharacterEmotion({
      userMessage,

      mood:
        context.mood,

      relationshipStage:
        context.relationshipStage,
    })


  const responsePlan =
    createResponsePlan({
      context,
      intent,
      decision,

      emotion:
        detectedEmotion,
    })


  const args:
    ReplyHandlerArgs = {
      context,

      characterName,

      userMessage,

      lowerMessage:
        userMessage.toLowerCase(),

      conversationHistory,

      intent,

      decision,

      emotion:
        detectedEmotion,

      responsePlan,
    }


  /*
   * ================================================================
   * ROLEPLAY INTERPRETER
   * ================================================================
   */

  const roleplayInterpretation =
    await interpretRoleplay({
      context,

      characterName,

      userMessage,

      conversationHistory,
    })


  console.log(
    '[VelvetVerse Roleplay Interpretation]',
    {
      character:
        characterName,

      message:
        userMessage,

      interpretation:
        roleplayInterpretation,
    },
  )


  /*
   * ================================================================
   * PRESENCE ENGINE
   * ================================================================
   */

  const lifeState =
    getLifeState(
      context.characterId,
    )


  const presenceState =
    updatePresenceFromMovement({
      characterId:
        context.characterId,

      currentCharacterLocation:
        lifeState.currentLocation,

      changesLocation:
        roleplayInterpretation
          .movement
          .changesLocation,

      targetLocation:
        roleplayInterpretation
          .movement
          .targetLocation,

      leavesCharacter:
        roleplayInterpretation
          .movement
          .leavesCharacter,

      approachesCharacter:
        roleplayInterpretation
          .movement
          .approachesCharacter,
    })


  console.log(
    '[VelvetVerse Presence State]',
    {
      character:
        characterName,

      message:
        userMessage,

      presence:
        presenceState,
    },
  )


  /*
   * ================================================================
   * PERCEPTION ENGINE
   * ================================================================
   */

  const perceptionState =
    resolvePerception({
      characterName,

      interpretation:
        roleplayInterpretation,

      presence:
        presenceState,
    })


  console.log(
    '[VelvetVerse Perception]',
    {
      character:
        characterName,

      message:
        userMessage,

      presence:
        presenceState.mode,

      perception:
        perceptionState,
    },
  )


  /*
   * ================================================================
   * RELATIONSHIP + CHEMISTRY
   * ================================================================
   */

  const relationshipEvaluation =
    await evaluateRelationshipInteraction({
      context,

      characterName,

      userMessage,

      conversationHistory,

      perceptionState,
    })


  console.log(
    '[VelvetVerse Relationship]',
    {
      character:
        characterName,

      message:
        userMessage,

      before:
        relationshipEvaluation.before,

      changes:
        relationshipEvaluation.changes,

      after:
        relationshipEvaluation.after,

      chemistry:
        relationshipEvaluation.chemistry,

      reason:
        relationshipEvaluation.reason,
    },
  )


  /*
   * ================================================================
   * SPECIAL REPLY HANDLERS
   * ================================================================
   */

  for (
    const handler of
    replyHandlers
  ) {
    const reply =
      handler(
        args,
      )

    if (
      reply
    ) {
      console.log(
        '[VelvetVerse Reply Handler]',
        {
          handler:
            handler.name,

          intent,

          message:
            userMessage,
        },
      )

      return reply
    }
  }


  /*
   * ================================================================
   * DYNAMIC DIALOGUE DEBUG
   * ================================================================
   */

  console.log(
    '[VelvetVerse Dynamic Dialogue]',
    {
      intent,

      message:
        userMessage,

      presence:
        presenceState.mode,

      userLocation:
        presenceState.userLocation,

      characterLocation:
        presenceState.characterLocation,

      roleplay:
        roleplayInterpretation,

      perception:
        perceptionState,

      chemistry:
        relationshipEvaluation
          .chemistry,
    },
  )


  /*
   * ================================================================
   * DYNAMIC OLLAMA DIALOGUE
   * ================================================================
   */

  try {
    const dialogue =
      await generateDialogue({
        args,

        roleplayInterpretation,

        presenceState,

        perceptionState,

        chemistry:
          relationshipEvaluation
            .chemistry,
      })


    /*
     * OLD RELATIONSHIP SYSTEM
     *
     * Keep temporarily because the
     * existing visible relationship bar
     * still depends on relationshipScore.
     */

    const relationshipDelta =
      calculateRelationshipDelta({
        userMessage,

        intent,

        decision,

        relationshipStage:
          context.relationshipStage,

        conversationHistory,
      })


    return createReply(
      dialogue.text,
      {
        emotion:
          detectedEmotion.emotion,

        animation:
          detectedEmotion.animation,

        relationshipDelta,

        internalThought:
          responsePlan.internalThought,
      },
    )
  } catch (error) {
    console.warn(
      'Dynamic dialogue unavailable. Using fallback reply.',
      error,
    )


    const fallbackReply =
      getFallbackReply(
        args,
      )


    if (
      !fallbackReply
    ) {
      throw new Error(
        'The fallback reply handler did not return a reply.',
      )
    }


    return fallbackReply
  }
}