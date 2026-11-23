export const storyRedirect = "Let's return to the fictional story. Describe the weather or news your character perceives in the scene; I don't look up real-world current information."

// Deterministic scope routing, not a general semantic classifier. Private
// thoughts are intentionally excluded: the character must not react to them.
export function needsStoryRedirect(input){
  const text=`${input.spoken} ${input.visibleAction}`.toLowerCase()
  const topic=/\b(?:weather|forecast|news|headlines|current events)\b/.test(text)
  if(!topic)return false
  const retrieval=/\b(?:browse|search the (?:web|internet)|check online|look\s?up|real[- ]time|live data)\b/.test(text)
  const real=/\b(?:real[- ]world|in real life|irl|out of (?:the )?(?:story|character)|out-of-character)\b/.test(text)
  const place=/\b(?:jhb|johannesburg|cape town|london|paris|new york)\b/.test(text)
  const fresh=/\b(?:current|latest|right now|today|tonight|breaking|live|now)\b/.test(text)
  const fictional=/\bfictional\b|\b(?:in|within|for) (?:our|the|this|a|my) (?:story|scene|roleplay|role-play)\b/.test(text)
  return retrieval||real||(!fictional&&(place||fresh))
}
export function screenTesterTurn(input){
  if(!needsStoryRedirect(input))return null
  return {reply:storyRedirect,redirected:true,capture:null,usage:{inputUnits:0,outputUnits:0},
    engineReceipt:{actualRoleplayOrchestration:false,finalDispatches:0,guardrail:'real_world_live_info'},
    measurement:{provider:'local-policy',status:'local_redirect',inputTokens:0,outputTokens:0,costMicros:0,latencyMs:0}}
}
