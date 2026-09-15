/* Scene: "It gets dark" → light-sensing cells in the eyes → body clock (SCN) → pineal gland → melatonin.
   Illustrative textbook-level content for design; requires scientific review before release. */
HS.scenes.dark={
 id:'dark',
 trigger:{title:'It gets dark',sub:'Watch the body clock prepare for sleep',caption:'The eyes sense the light fading',lights:['retina','scn'],first:'night',autoplay:true,atmosphere:'rgba(150,120,220,.12)'},

 routes:{
  rht:{d:'M 40 175 C 54 162 70 160 81 167',kind:'nerve',pass:'light',label:'light signals · nerve',at:.4,dx:-6,dy:-34},
  clockPineal:{d:'M 88 178 C 94 234 152 228 142 172',kind:'nerve',pass:'sympPineal',label:'nerve signals · schematic route',at:.5,dx:0,dy:26},
  melatonin:{d:'M 148 160 C 196 120 258 62 310 68',kind:'msg',label:'melatonin · blood',at:.6,dx:0,dy:-22},
  fbMel:{d:'M 196 124 C 170 92 106 112 89 164',kind:'fb',end:'diamond',label:'melatonin · acts on the clock',at:.42,dx:0,dy:-22}
 },

 pathways:{
  night:{name:'Melatonin at night',node:'melP',chip:'over the evening and night',region:'night',layer:'nervous',segDur:1000,
   organs:['retina','scn','pineal','brain'],draw:['rht','clockPineal','melatonin'],
   rebuild:{chain:['retina','scn','pineal','brain'],links:['light signals','nerve signals','melatonin'],distractors:['pit','thy'],extra:['cortisol','CRH']},
   hots:[
    {org:'retina',num:1,dx:-22,dy:22,seg:null,t:1,region:'clock',one:'Eyes sense the light fading',adv:'Melanopsin ganglion cells report light through the retinohypothalamic tract',lab:{body:'Eyes',organ:'Eyes · light sensors',structure:'Light-sensing cells report darkness'},ldx:22,ldy:52},
    {org:'scn',num:2,dx:-12,dy:-28,seg:'rht',t:1,region:'clock',one:'Body clock reads it as night',adv:'The SCN signals via the paraventricular nucleus, spinal cord and superior cervical ganglion',lab:{body:'Body clock',organ:'Body clock (SCN)',structure:'SCN signals the pineal gland'},ldx:-26,ldy:-60},
    {org:'pineal',num:3,dx:10,dy:-30,seg:'clockPineal',t:2,region:'clock',one:'Pineal gland releases melatonin',adv:'Noradrenaline on β1 receptors raises AANAT activity, so melatonin is made',lab:{body:'Pineal gland',organ:'Pineal gland',structure:'Pineal cells make melatonin'},ldx:34,ldy:-62,cell:'pinealMel'},
    {org:'brain',num:4,dx:42,dy:8,seg:'melatonin',t:2,region:'head',one:'Brain and body get ready for sleep',adv:'Melatonin acts on MT1 and MT2 receptors, including in the SCN',lab:{body:'Brain',organ:'melatonin',structure:'Melatonin acts on brain receptors'},ldx:58,ldy:-18,leads:{scene:'stress',path:'slow',why:'Before waking, cortisol rises too, as part of its daily rhythm.'}}],
   afterPlay:{whenHidden:true,tip:{key:'darkGhost',text:'Melatonin also acts back on something. Open Try it? on the dashed line.',pos:{right:16,bottom:214}}},
   gate:{
    routes:['fbMel'],at:['fbMel',.5],labelRoutes:['fbMel'],tipKey:'darkGhost',from:'pineal',blocksEnd:false,
    aria:'Try it: melatonin acts back somewhere',ariaRevealed:'Melatonin acts back on the body clock, revealed',dotAria:'Try it: where does melatonin act back?',
    calmButton:'Watch the morning come',
    afterTip:{key:'darkWhatIf',text:'Try What if? in the pathway bar: what if the lights stay on?',pos:{right:16,bottom:214}},
    try:{
     region:'night',q:{body:'The night signal also acts back on one place in the brain. Where?',organ:'Melatonin also acts back on one place in the brain. Where?'},hint:'Tap the structure you think in the brain cutaway.',
     candidates:['retina','scn','pit','pineal'],answer:['scn'],
     why:'A clock that can sense its own night signal can keep its timing in step.',
     correct:'Melatonin acts back on the body clock, helping keep its timing in step with night.',
     feedback({all,picks}){
      if(all) return {tone:'good',head:'That’s it.',txt:this.correct};
      if(picks.has('scn')) return {tone:'warm',head:'Nearly.',txt:'The body clock is right. Melatonin doesn’t act back at the other places you picked in this loop.'};
      if(picks.has('pineal')) return {tone:'warm',head:'Not quite.',txt:'The pineal gland releases melatonin. Melatonin acts back on the body clock, which tells the pineal gland when to release it.'};
      if(picks.has('retina')) return {tone:'warm',head:'Not quite.',txt:'The eyes sense light. Melatonin acts back on the body clock itself.'};
      return {tone:'warm',head:'Not quite.',txt:'The pituitary isn’t part of this loop. Melatonin acts back on the body clock.'};
     }
    }
   },
   whatIf:{
    q:'What if the lights stay on?',region:'night',atmos:'rgba(255,228,150,.16)',
    p:'Bright light keeps reaching the eyes all evening. Predict first: what happens to melatonin?',
    options:[['low','Melatonin stays low'],['rises','Melatonin rises anyway'],['same','Nothing changes']],correct:'low',
    outcome:'With bright light, the body clock keeps reading day, so the pineal gland releases little melatonin.',
    extra:{rises:' Melatonin rises when the clock reads darkness, and bright light holds that back.',same:' Light is the clock’s main time signal, so keeping it on changes what the clock reads.'},
    fade:['melatonin','fbMel'],blocks:[['clockPineal',.5]],blockLabel:{text:'release signal held back',route:'clockPineal',t:.5,dx:0,dy:30},
    badges:[{org:'scn',text:'still reads day',dx:-30,dy:-46},{org:'pineal',text:'little melatonin',dx:30,dy:-46}],
    holdTime:1,holdToast:'In this thought experiment the lights stay on, so the clock never reads night.',replay:['rht']
   }
  }
 },

 time:[
  {w:'dusk',c:'<b>Dusk:</b> daylight fades, and the eyes sense less light.',atmos:'rgba(240,150,110,.12)',vignette:.12},
  {w:'evening',c:'<b>Evening:</b> the body clock reads darkness and signals the pineal gland.',atmos:'rgba(150,120,220,.13)',vignette:.28},
  {w:'night',c:'<b>Night:</b> melatonin rises in the blood, and sleep comes more easily.',atmos:'rgba(80,96,210,.13)',vignette:.5},
  {w:'early morning',c:'<b>Early morning:</b> melatonin is still present, and body temperature is at its lowest.',atmos:'rgba(80,96,210,.1)',vignette:.42},
  {w:'morning light',c:'<b>Morning light:</b> light reaches the eyes, the clock stops melatonin release, and waking comes more easily.',atmos:'rgba(255,214,140,.14)',vignette:0}
 ],

 signs:[
  {id:'pupils',type:'pupils',on:[0,1],label:{text:'Pupils widen in dim light',anchor:[370,108],dx:40,dy:-6}},
  {id:'lids',type:'lids',on:[2,3],label:{text:'Sleepiness builds',anchor:[372,110],dx:54,dy:40}},
  {id:'cool',type:'wash',anchor:[350,430],r:[120,230],on:[2,3],label:{text:'Body cools slightly',anchor:[440,430],dx:60,dy:0}},
  {id:'wake',type:'none',on:[4],label:{org:'brain',always:true,text:'Waking comes more easily',dx:58,dy:30}}
 ],

 info:{
  retina:{t:'Eyes',body:'Your eyes sense whether it is light or dark.',organ:'Special light-sensing cells in the eye send signals to the body clock. They are separate from the cells you see with.',structure:'These cells contain melanopsin, a light-sensitive pigment, and connect straight to the body clock.'},
  scn:{t:'Body clock (SCN)',body:'A tiny clock in your brain keeps a roughly 24-hour rhythm.',organ:'The SCN, in the hypothalamus, uses light signals from the eyes to set the time of day.',structure:'The SCN sits just above the place where the optic nerves cross.'},
  pineal:{t:'Pineal gland',body:'A small gland deep in the brain releases melatonin at night.',organ:'In darkness the body clock signals the pineal gland to release melatonin. Light holds it back.',structure:'The signal reaches the pineal gland by a long nerve route through the spinal cord and neck. Open the cell view to see what happens next.'},
  brain:{t:'Brain',body:'Your brain and body get ready for sleep.',organ:'Melatonin in the blood signals that it is night, and sleep comes more easily.',structure:'Melatonin acts on receptors in the brain, including the body clock itself.'},
  hyp:{t:'Hypothalamus',body:'Part of the brain that holds the body clock.',organ:'The body clock (SCN) is a small cluster of cells inside the hypothalamus.',structure:'Not traced further in this scene.'},
  heart:{t:'Heart',body:'Heart rate usually slows during sleep.',organ:'Not traced in this scene.',structure:'Not traced in this scene.'}
 },

 cells:{
  pinealMel:{
   aria:'Pineal cell: how melatonin is made',title:'Inside a pineal cell',sub:'Cell · mechanism · illustrative draft',
   svg:`<rect x="0" y="0" width="60" height="214" fill="#151228"/><text x="30" y="20" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="9" fill="#8C7CC0">NERVE</text>
    <path d="M 0 56 C 24 56 36 60 48 62" stroke="#8C74D6" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="50" cy="63" r="6" fill="#8C74D6"/>
    <rect x="68" y="14" width="234" height="186" rx="34" fill="#1B1A2C" stroke="#6B5E93" stroke-width="3"/>
    <text x="88" y="36" font-family="Roboto Mono,monospace" font-size="9" fill="#9C90C8">PINEAL CELL</text>
    <rect x="310" y="0" width="66" height="214" fill="#0B1E28"/><text x="343" y="20" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="9" fill="#5F8A96">BLOOD</text>
    <path d="M 70 72 h 12 M 70 72 l -7 -7 M 70 72 l -7 7" stroke="#43D99A" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M 86 78 C 112 88 132 96 150 102" fill="none" stroke="#43D99A" stroke-width="1.2" stroke-dasharray="3 4"/>
    <rect x="150" y="90" width="60" height="24" rx="8" fill="#2A2410" stroke="#F0C27E"/><text x="180" y="106" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="9" fill="#F0C27E">ENZYME</text>
    <path d="M 180 116 L 168 152" fill="none" stroke="#F0C27E" stroke-width="1" stroke-dasharray="3 4"/>
    <circle cx="118" cy="162" r="11" fill="#2A2F45" stroke="#A9B4D8"/><text x="118" y="166" text-anchor="middle" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="10" font-weight="700" fill="#C9D2F0">S</text>
    <path d="M 132 162 L 194 162" stroke="#F0C27E" stroke-width="1.6"/><path d="M 198 162 l -8 -4.5 v 9 z" fill="#F0C27E"/>
    <circle cx="214" cy="162" r="11" fill="#7CCBFF"/><text x="214" y="166" text-anchor="middle" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="10" font-weight="700" fill="#06202E">M</text>
    <path d="M 226 160 C 260 158 290 150 336 144" fill="none" stroke="#7CCBFF" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>
    <circle cx="342" cy="143" r="7" fill="#7CCBFF" opacity=".75"/><circle cx="352" cy="170" r="5" fill="#7CCBFF" opacity=".5"/>
    <circle id="cellMol" cx="26" cy="104" r="7" fill="#C4A8FF"/><text x="26" y="107.5" text-anchor="middle" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="8" font-weight="700" fill="#1A1033">N</text>
    <path id="cellPath" d="M 26 104 C 40 96 52 84 62 74" fill="none" stroke="#C4A8FF" stroke-width="1" stroke-dasharray="3 4" opacity=".5"/>
    <g font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="11" font-weight="700" fill="#E6EFEF">
      <circle cx="30" cy="40" r="9" fill="#0B171C" stroke="#C4A8FF"/><text x="30" y="44" text-anchor="middle">1</text>
      <circle cx="122" cy="72" r="9" fill="#0B171C" stroke="#43D99A"/><text x="122" y="76" text-anchor="middle">2</text>
      <circle cx="244" cy="126" r="9" fill="#0B171C" stroke="#F0C27E"/><text x="244" y="130" text-anchor="middle">3</text>
      <circle cx="286" cy="182" r="9" fill="#0B171C" stroke="#7CCBFF"/><text x="286" y="186" text-anchor="middle">4</text>
    </g>`,
   end:[62,74],
   focus:[[56,68,46],[142,92,56],[166,160,64],[312,150,56]],
  adv:['The fibres come from the superior cervical ganglion and release noradrenaline mainly at night.','β1 receptors raise cAMP and activate PKA, which switches on AANAT; α1 receptors amplify the signal.','AANAT turns serotonin into N-acetylserotonin, and HIOMT (ASMT) then makes melatonin.','Melatonin is not stored: it diffuses out of the cell as it is made.'],
  steps:['At night, a nerve ending releases noradrenaline onto the pineal cell.','It binds a receptor, and a key enzyme inside the cell becomes more active.','The enzyme helps turn serotonin into melatonin.','Melatonin leaves the cell and enters the blood.'],
   say:'Inside a pineal cell. At night a nerve ending releases noradrenaline, a receptor switches on a key enzyme, serotonin is turned into melatonin, and melatonin enters the blood.'
  }
 },

 search:[
  {t:'Melatonin at night',k:'Pathway',syn:['sleep','circadian','body clock','darkness','night'],go:{pathway:['dark','night']}},
  {t:'Melatonin',k:'Signal',syn:['sleep hormone'],go:{node:'melatonin'}},
  {t:'Pineal gland',k:'Organ',syn:['pineal','epiphysis'],go:{organ:'pineal'}},
  {t:'Body clock (SCN)',k:'Organ',syn:['scn','suprachiasmatic nucleus','circadian clock','master clock'],go:{organ:'scn'}},
  {t:'Eyes',k:'Organ',syn:['retina','melanopsin','light sensing'],go:{organ:'retina'}}
 ],

 read({revealed}){
  return `<h4>Melatonin at night · over the evening and night</h4><ol>
   <li>Light-sensing cells in the eyes detect the light fading and send <span class="n">nerve signals · schematic route</span> to the body clock (SCN).</li>
   <li>The body clock reads darkness and signals the pineal gland by a <span class="n">nerve route through the spinal cord and neck</span>. <span class="n">activates</span></li>
   <li>The pineal gland releases <span class="m">melatonin · blood</span>.</li>
   <li>Melatonin reaches the brain and body, and sleep comes more easily.</li>
   <li>${revealed('night')?'Melatonin acts back on the body clock, helping keep its timing in step with night. <span class="f">modulates</span>':'Melatonin also acts back on something. <span class="f">hidden until you try it</span>'}</li>
   <li>In the morning, light reaches the eyes, and the body clock stops melatonin release.</li></ol>
  <h4>What you would notice</h4><ul><li>Pupils widen in dim light</li><li>Sleepiness builds</li><li>Body temperature dips slightly overnight</li><li>Morning light helps you wake</li></ul>`;
 }
};
