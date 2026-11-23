// Presentation-only guard for legacy early replies. Never forwards their
// unlabelled scalar/brain text. The engine's original effects remain unchanged.
export function scopedGuestLocalReply(intent,alias){
 const name=typeof alias==='string'&&/^[A-Za-z][A-Za-z -]{0,39}$/.test(alias)?alias:'traveler'
 if(intent==='Greeting')return `Seraphina inclines her head. "Welcome, ${name}."`
 if(intent==='Memory')return `Seraphina considers the traveler. "For this story, I will call you ${name}."`
 if(intent==='Secrets')return 'Seraphina holds her boundary. "I will not disclose or invent private reasons."'
 if(intent==='Identity')return 'Seraphina inclines her head. "I am Lady Seraphina."'
 if(intent==='Gratitude')return 'Seraphina nods. "You are welcome."'
 return 'Seraphina considers the scene. "Let us stay with what we have witnessed here."'
}
