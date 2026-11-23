import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import OwnerPlayer from '../src/experimental/OwnerPlayer'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('keeps the same Seraphina player behind guest login and clears displayed progress on logout',async()=>{
  HTMLElement.prototype.scrollIntoView=vi.fn()
  const auth={accountId:'fixture-guest',csrf:'synthetic-guest-csrf',mode:'fake',consent:'tester-fake'}
  const progress={alias:null,save:{conversation:1,transcript:[]},budget:{attemptsRemaining:20,availableMicros:225000,heldMicros:0,expired:false,testClosed:false},pending:[]}
  let signedIn=false
  const fetchMock=vi.fn(async(url,options)=>{
    if(String(url).endsWith('/tester/session'))return Response.json({error:'authentication_required'},{status:401})
    if(String(url).endsWith('/tester/login')){expect(JSON.parse(options.body)).toEqual({username:'guest',password:'synthetic-guest-only'});signedIn=true;return Response.json(auth)}
    if(String(url).endsWith('/tester/logout')){signedIn=false;return Response.json({loggedOut:true})}
    if(String(url).endsWith('/acceptance/turn'))return Response.json({reply:'Seraphina lifts the lantern. "[MOCK GUEST] We can wait."',progress:{...progress,save:{...progress.save,transcript:[{spoken:'A fictional bridge scene.',visibleAction:'',reply:'[MOCK GUEST] A saved guest reply.'}]}},engineReceipt:{finalDispatches:1}})
    expect(signedIn).toBe(true);return Response.json(progress)
  })
  vi.stubGlobal('fetch',fetchMock);render(<MemoryRouter><OwnerPlayer audience="guest"/></MemoryRouter>)
  expect(await screen.findByRole('button',{name:'Sign in'})).toBeTruthy();expect(screen.getByRole('img',{name:'Lady Seraphina'})).toBeTruthy()
  expect(screen.queryByRole('link',{name:'Scene / memory controls'})).toBeNull()
  fireEvent.change(screen.getByLabelText('Guest password'),{target:{value:'synthetic-guest-only'}});fireEvent.click(screen.getByRole('button',{name:'Sign in'}))
  await waitFor(()=>expect(screen.getByRole('textbox',{name:'Message Lady Seraphina'})).toHaveProperty('disabled',false))
  expect(screen.queryByLabelText('Guest password')).toBeNull()
  fireEvent.change(screen.getByRole('textbox',{name:'Message Lady Seraphina'}),{target:{value:'A fictional bridge scene.'}});fireEvent.click(screen.getByRole('checkbox',{name:/Share this spoken scene/}));fireEvent.click(screen.getByRole('button',{name:'Send',exact:true}))
  expect(await screen.findByText('[MOCK GUEST] A saved guest reply.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Log out'}));expect(await screen.findByRole('button',{name:'Sign in'})).toBeTruthy()
  expect(screen.queryByText('[MOCK GUEST] A saved guest reply.')).toBeNull();expect(screen.getByLabelText('Guest password')).toHaveProperty('value','')
  expect(fetchMock.mock.calls.every(([url])=>String(url).startsWith('/velvetverse/'))).toBe(true)
})
it('authors explicit scoped guest facts/corrections/revocations through the existing route without a model turn',async()=>{
 HTMLElement.prototype.scrollIntoView=vi.fn()
 const auth={accountId:'guest',csrf:'synthetic-csrf',mode:'live',consent:'openai-tester'}
 const progress={alias:null,save:{conversation:1,transcript:[]},budget:{attemptsRemaining:20,availableMicros:225000,heldMicros:0,expired:false,testClosed:false},pending:[]}
 const labels:Record<string,unknown>[]=[]
 const network=vi.fn(async(url,options)=>{if(String(url).endsWith('/tester/session'))return Response.json(auth);if(String(url).endsWith('/acceptance/label')){labels.push(JSON.parse(options.body));return Response.json(progress)};return Response.json(progress)})
 vi.stubGlobal('fetch',network);render(<MemoryRouter><OwnerPlayer audience="guest"/></MemoryRouter>)
 await screen.findByText('Explicit shared memories')
 const key=screen.getByLabelText('Memory key'),value=screen.getByLabelText('Shared fact'),action=screen.getByLabelText('Memory action'),consent=screen.getByLabelText(/I explicitly authorise/),button=screen.getByRole('button',{name:'Save shared memory',hidden:true})
 fireEvent.change(key,{target:{value:'fact-route'}});fireEvent.change(value,{target:{value:'The bridge is closed.'}})
 fireEvent.submit(button.closest('form')!);expect(labels).toHaveLength(0)
 for(const [mode,text] of [['add','The bridge is closed.'],['correct','The repaired bridge is passable.'],['revoke','']] as const){
  fireEvent.change(action,{target:{value:mode}});if(mode!=='revoke')fireEvent.change(value,{target:{value:text}});fireEvent.click(consent);fireEvent.submit(button.closest('form')!)
  await waitFor(()=>expect(labels).toHaveLength(mode==='add'?1:mode==='correct'?2:3));await waitFor(()=>expect(consent).toHaveProperty('checked',false))
 }
 expect(labels.map(label=>label.action)).toEqual(['add','correct','revoke'])
 expect(labels.every(label=>JSON.stringify(label.scope)===JSON.stringify({testerId:'guest',storyId:'story-one',characterId:1})&&label.factId==='fact-route'&&label.provenance==='observed'&&label.visibility==='provider-shared'&&label.witnessed===true&&label.providerConsent==='openai-tester')).toBe(true)
 expect(network.mock.calls.some(([url])=>String(url).endsWith('/acceptance/turn'))).toBe(false)
})
