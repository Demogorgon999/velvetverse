import {buildGuestMemoryView,guestVisibleTranscript} from './guestMemoryView.mjs'
// Read-only authored facts, not a generated summary or a second memory store.
export function storyPresentation(save,scope){
 const view=buildGuestMemoryView(save,scope,{spoken:'',visibleAction:''})
 const eligible=new Set(view.eligibleIds)
 const notes=save.labels.events.filter(event=>event.characterId===scope.characterId&&event.storyScopeId===scope.storyId&&eligible.has(event.id)).sort((a,b)=>b.sequence-a.sequence)
  .map(event=>({key:event.factId,value:event.summary}))
 const exchanges=guestVisibleTranscript(save,scope).length
 const facts=notes.filter(note=>note.key!=='alias').slice(0,3).map(note=>note.value.length>240?note.value.slice(0,240)+'…':note.value)
 return{storyNotes:notes,returnSummary:{heading:'Previously with Seraphina…',lines:facts.length?facts:[exchanges?`${exchanges} saved exchange${exchanges===1?'':'s'}. Resume your story below.`:'A new story is ready. No shared events have been recorded yet.'],source:'confirmed-visible-facts',providerCalls:0}}
}
