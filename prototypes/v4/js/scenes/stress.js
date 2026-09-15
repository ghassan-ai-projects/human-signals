/* Scene: "Something stressful happens" → Fast route (nerves → adrenal medulla) and Slow route (HPA axis).
   Illustrative textbook-level content for design; requires scientific review before release. */
HS.scenes.stress={
 id:'stress',
 trigger:{title:'Something stressful happens',sub:'Watch the fast and slow response',caption:'The brain registers it',lights:['brain','hyp'],first:'fast',autoplay:true,atmosphere:'rgba(240,138,102,.10)',incite:{color:'#F3936F',from:[46,-104]}},
 toggle:{label:'Route speed',options:[['fast','Fast'],['slow','Slow']]},

 routes:{
  nerve:{d:'M 372 96 C 540 150 540 430 318 514',kind:'nerve',pass:'sympStress',label:'nerve signals · schematic route',at:.42,dx:18,dy:0},
  adrenaline:{d:'M 298 504 C 262 452 292 404 342 398',kind:'msg',label:'adrenaline · blood',at:.45,dx:-18,dy:0},
  crh:{d:'M 108 177 Q 118 189 101 196',kind:'msg',label:'CRH · portal',at:.5,dx:40,dy:26},
  acth:{d:'M 102 210 C 130 330 130 480 284 512',kind:'msg',label:'ACTH · schematic route',at:.45,dx:20,dy:0},
  cort:{d:'M 312 512 C 340 522 368 512 365 490',kind:'msg',label:'cortisol · blood',at:.55,dx:40,dy:30},
  f1:{d:'M 284 528 C 60 560 34 400 40 300 C 44 250 58 214 83 200',kind:'fb',label:'cortisol · feedback',at:.35,dx:-18,dy:0},
  f2:{d:'M 288 536 C 30 590 12 400 20 300 C 24 230 56 176 90 172',kind:'fb'}
 },

 pathways:{
  fast:{name:'Fast route',node:'fastP',chip:'within seconds',region:'fast',layer:'nervous',segDur:800,
   organs:['brain','adr','heart','lungs','liver'],draw:['nerve','adrenaline'],
   compare:{first:'Nerve signals, then adrenaline',carried:'Nerves, then the blood',reaches:'Adrenal medulla, heart, lungs and liver',time:'Within seconds',notice:'Heart pounds, pupils widen, breathing quickens',off:'Adrenaline is cleared within minutes',effect:'A quick burst of readiness',lane:[1]},
   rebuild:{chain:['brain','adr','heart'],links:['nerve signals','adrenaline'],distractors:['thy','panc'],extra:['cortisol','insulin']},
   hots:[
    {org:'brain',num:1,dx:-32,dy:4,seg:null,t:1,region:'head',one:'Brain sends nerve signals',adv:'Hypothalamus and brainstem drive sympathetic nerves through the spinal cord',lab:{body:'Brain',organ:'nerve signals',structure:'Hypothalamus starts the nerve alarm'},ldx:34,ldy:-14},
    {org:'adr',num:2,dx:-28,dy:24,seg:'nerve',t:1,region:'adr',one:'Adrenal medulla releases adrenaline',adv:'Acetylcholine from sympathetic fibres makes chromaffin cells release adrenaline',lab:{body:'Adrenal glands',organ:'adrenaline',structure:'Medulla · adrenaline'},ldx:-40,ldy:-30},
    {org:'heart',num:3,dx:-38,dy:-18,seg:'adrenaline',t:1,region:'heart',one:'Heart beats faster',adv:'Adrenaline and noradrenaline on β1 receptors: faster, stronger beats',lab:{body:'Heart',organ:'adrenaline',structure:'Heart muscle responds'},ldx:52,ldy:-24},
    {org:'liver',num:4,dx:-10,dy:-34,seg:null,t:1,region:'liver',one:'Liver releases glucose',adv:'Adrenergic receptors switch on glycogen breakdown in liver cells',lab:{body:'Liver',organ:'glucose',structure:'Liver cells release glucose'},ldx:-70,ldy:-4,leads:{scene:'meal',path:'after',why:'Glucose released into the blood is sensed by the pancreas, which releases insulin.'}}],
   afterPlay:{tip:{key:'slow',text:'That was the fast route, within seconds. Now follow the slow route: choose Slow.',pos:{right:16,bottom:214}}},
   reflect:{q:'In a sentence, how does the fast route get the body ready so quickly?',model:'Nerve signals reach the adrenal medulla within seconds; it releases adrenaline into the blood, and the heart, lungs and liver respond, so the body is ready almost at once.'}
  },
  slow:{name:'HPA axis',node:'hpaP',chip:'over minutes, lasting hours',region:'hpa',segDur:1000,minTime:1,orgRegions:{brain:'brain'},
   organs:['hyp','pit','adr','liver'],draw:['crh','acth','cort'],
   compare:{first:'CRH, then ACTH, then cortisol',carried:'Portal blood, then the blood',reaches:'Pituitary, adrenal cortex, liver and many tissues',time:'Over minutes, lasting hours',notice:'Little you can feel directly',off:'Cortisol brakes its own release',effect:'Energy kept available for longer',lane:[2,3]},
   rebuild:{chain:['hyp','pit','adr','liver'],links:['CRH','ACTH','cortisol'],distractors:['thy','kid'],extra:['adrenaline','glucagon']},
   hots:[
    {org:'hyp',num:1,dx:-28,dy:-14,seg:null,t:2,region:'brain',one:'Hypothalamus releases CRH',adv:'Paraventricular nucleus neurons release CRH into portal blood',lab:{body:'Hypothalamus',organ:'CRH',structure:'Releases CRH into portal blood'},ldx:34,ldy:-18,leads:{scene:'dark',path:'night',why:'The body clock next door also shapes cortisol’s daily rhythm.'}},
    {org:'pit',num:2,dx:-28,dy:16,seg:'crh',t:2,region:'brain',one:'Pituitary releases ACTH',adv:'Corticotrophs cut ACTH from POMC and release it',lab:{body:'Pituitary',organ:'ACTH',structure:'Anterior lobe releases ACTH'},ldx:34,ldy:20},
    {org:'adr',num:3,dx:-28,dy:24,seg:'acth',t:2,region:'adr',one:'Adrenal cortex releases cortisol',adv:'Zona fasciculata cells make cortisol from cholesterol',lab:{body:'Adrenal glands',organ:'cortisol',structure:'Cortex · cortisol'},ldx:-40,ldy:-30},
    {org:'liver',num:4,dx:-10,dy:-34,seg:'cort',t:3,region:'liver',one:'Liver makes glucose available',adv:'Cortisol raises gluconeogenic enzymes through the glucocorticoid receptor',lab:{body:'Liver',organ:'glucose',structure:'Liver cells make glucose'},ldx:-70,ldy:-4,cell:'liverCort',leads:{scene:'meal',path:'after',why:'Glucose made available by cortisol is sensed by the pancreas, which releases insulin.'}}],
   enterTip:{key:'numbers',text:'Numbers show the order. Press ▶ to watch the signal travel, or click any number.',pos:{right:16,bottom:214}},
   afterPlay:{whenHidden:true,time:3,tip:{key:'ghost',text:'Something acts back on the brain. Open Try it? on the dashed line.',pos:{left:340,top:150}}},
   reflect:{q:'Why does the stress response eventually settle itself?',model:'Cortisol acts back on the pituitary and the hypothalamus to slow its own release — negative feedback — so the response winds down instead of running away.'},
   gate:{
    routes:['f1','f2'],at:['f1',.5],labelRoutes:['f1'],tipKey:'ghost',from:'adr',loopFrom:'acth',
    aria:'Try it: something acts back here',ariaRevealed:'Feedback: cortisol acts back on the pituitary and hypothalamus, revealed',dotAria:'Try it: what acts back?',
    calmBlocked:'The body can’t calm down until something acts back. Open Try it? on the dashed line.',
    calmButton:'Watch the body calm down',
    afterTip:{key:'whatif',text:'Route explored. Try What if? in the pathway bar to test the brake.',pos:{right:16,bottom:214}},
    try:{
     region:'hpa',q:{body:'Where does the stress hormone act back to calm the response?',organ:'Where does cortisol act to slow its own release?',structure:'Which structures does cortisol act on to slow its own release?'},hint:'Tap all that apply on the body.',
     candidates:['hyp','pit','adr','liver'],answer:['hyp','pit'],
     why:'Acting at the top of a chain turns down every later step at once.',
     correct:'Cortisol acts back on the pituitary and the hypothalamus. This is negative feedback.',
     feedback({all,wrong,picks}){
      if(all) return {tone:'good',head:'That’s it.',txt:this.correct};
      if(!wrong) return {tone:'warm',head:'Nearly.',txt:picks.has('pit')?'Cortisol also acts on the hypothalamus. This is negative feedback.':'Cortisol also acts on the pituitary. This is negative feedback.'};
      return {tone:'warm',head:'Not quite.',txt:'The adrenal glands and liver are downstream. Cortisol acts back upstream, on the pituitary and the hypothalamus.'};
     }
    }
   },
   whatIf:{
    q:'What if the brake stops working?',region:'hpa',
    p:'Cortisol can no longer act back on the pituitary and hypothalamus. Predict first: what happens to cortisol?',
    options:[['high','Cortisol stays high'],['falls','Cortisol falls'],['same','Nothing changes']],correct:'high',
    outcome:'Without the brake, ACTH and cortisol stay high for longer.',
    extra:{falls:' Cortisol falls only when something turns its release down, and here nothing does.',same:' The first steps still run, but nothing turns them down, so the response doesn’t settle.'},
    fade:['f1','f2'],blocks:[['f1',.5],['f2',.62]],blockLabel:{text:'brake blocked',route:'f2',t:.62,dx:-22,dy:0},
    badges:[{org:'pit',text:'ACTH stays high',dx:40,dy:-4},{org:'adr',text:'cortisol stays high',dx:-44,dy:-36}],
    holdTime:3,holdToast:'In this thought experiment nothing turns the response down, so it doesn’t settle.',replay:['acth','cort']
   }
  }
 },

 time:[
  {w:'now',c:'<b>Now:</b> something stressful happens, and the brain registers it.'},
  {w:'seconds',c:'<b>Seconds:</b> nerve signals reach the adrenal medulla. Adrenaline: heart faster, pupils wider, breathing quicker.'},
  {w:'minutes',c:'<b>Minutes:</b> CRH, then ACTH, then cortisol rises in the blood.'},
  {w:'hours',c:'<b>Hours:</b> cortisol keeps glucose available, and a brake begins to act.'},
  {w:'calm again',c:'<b>Calm again:</b> cortisol’s brake turns CRH and ACTH down, and the signs settle.',show:['f1','f2']}
 ],

 signs:[
  {id:'heart',type:'ripple',org:'heart',color:'#FF8F8F',on:[1,2,3],calmAt:[3],label:{org:'heart',text:t=>t===3?'Heart settling':'Heart beats faster',dx:56,dy:-30,info:'heart'}},
  {id:'pupils',type:'pupils',on:[1,2],label:{text:'Pupils widen',anchor:[370,108],dx:40,dy:-6}},
  {id:'breath',type:'breathe',org:'lungs',on:[1,2],label:{org:'lungs',text:'Breathing quickens',anchor:[396,300],dx:74,dy:-10,info:'lungs'}},
  {id:'glucose',type:'glyphs',org:'liver',offset:[40,-24],drift:[48,-42],on:[1,2,3],label:{org:'liver',text:'Liver releases glucose',anchor:[280,448],dx:-96,dy:-10,info:'liver'}},
  {id:'calm',type:'none',on:[4],label:{org:'heart',always:true,text:'Signs settle',dx:56,dy:-30}}
 ],

 info:{
  brain:{t:'Brain',body:'Your brain notices the threat and starts the response.',organ:'The hypothalamus turns the alarm into signals: nerve signals for the fast route, CRH for the slow route.',structure:'The hypothalamus sits just above the pituitary gland.'},
  hyp:{t:'Hypothalamus',body:'Part of your brain starts the slower hormone response.',organ:'The hypothalamus releases CRH, the first hormone of the slow route.',structure:'CRH travels a short portal blood route to the anterior pituitary.'},
  pit:{t:'Pituitary gland',body:'A small gland under the brain passes the message on.',organ:'The anterior pituitary answers CRH by releasing ACTH into the blood.',structure:'The anterior lobe makes ACTH; the posterior lobe releases different hormones.'},
  adr:{t:'Adrenal glands',body:'Glands on top of your kidneys release stress hormones.',organ:'ACTH makes the adrenal cortex release cortisol. Nerve signals make the medulla release adrenaline.',structure:'Cortex, the outer layer: cortisol. Medulla, the inner core: adrenaline.'},
  liver:{t:'Liver',body:'Your liver makes energy available as glucose.',organ:'Adrenaline quickly, and cortisol more slowly, help the liver release glucose.',structure:'Liver cells respond to cortisol by making more glucose. Open the cell view to see how.'},
  heart:{t:'Heart',body:'Your heart beats faster and harder.',organ:'Nerve signals and adrenaline in the blood speed up the heart.',structure:'Adrenaline acts on receptors in heart muscle cells.'},
  lungs:{t:'Lungs',body:'Your breathing quickens.',organ:'Adrenaline relaxes the airways, so air moves more easily.',structure:'Airway muscle relaxes in response to adrenaline.'},
  kid:{t:'Kidneys',body:'The adrenal glands sit on top of the kidneys.',organ:'Not part of this response in this lesson.',structure:'Not part of this response in this lesson.'},
  stom:{t:'Stomach',body:'Digestion slows during a stress response.',organ:'Not traced in this lesson.',structure:'Not traced in this lesson.'},
  panc:{t:'Pancreas',body:'Part of blood-glucose control, covered in another scene.',organ:'Covered in the “You skip a meal” scene.',structure:'Covered in the “You skip a meal” scene.'},
  thy:{t:'Thyroid',body:'Sets the pace of metabolism; not part of this scene.',organ:'Covered in the thyroid axis.',structure:'Covered in the thyroid axis.'},
  int:{t:'Intestines',body:'Not traced in this scene.',organ:'Not traced in this scene.',structure:'Not traced in this scene.'}
 },

 cells:{liverCort:{
  aria:'Liver cell: how cortisol works',title:'Inside a liver cell',sub:'Cell · mechanism · illustrative draft',
  svg:`<rect x="0" y="0" width="70" height="214" fill="#0B1E28"/><text x="35" y="20" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="9" fill="#5F8A96">BLOOD</text>
    <rect x="78" y="14" width="288" height="186" rx="40" fill="#1A2A2F" stroke="#7B4A3E" stroke-width="3"/>
    <text x="100" y="36" font-family="Roboto Mono,monospace" font-size="9" fill="#9A7A70">LIVER CELL</text>
    <circle cx="258" cy="104" r="50" fill="#232F45" stroke="#56688E" stroke-width="2"/><text x="258" y="68" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="9" fill="#8C9CC0">NUCLEUS</text>
    <path d="M232 112 C 242 100 252 124 262 112 C 272 100 282 124 292 112" fill="none" stroke="#8C9CC0" stroke-width="2"/><path d="M232 120 C 242 108 252 132 262 120 C 272 108 282 132 292 120" fill="none" stroke="#8C9CC0" stroke-width="2" opacity=".6"/>
    <g><path d="M150 132 v-16 M150 116 l-8 -10 M150 116 l8 -10" stroke="#43D99A" stroke-width="3" stroke-linecap="round" fill="none"/></g>
    <circle id="cellMol" cx="36" cy="104" r="7" fill="#7CCBFF"/><text x="36" y="107.5" text-anchor="middle" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="8" font-weight="700" fill="#06202E">C</text>
    <path id="cellPath" d="M36 104 C 90 104 120 100 150 104 C 190 108 210 110 250 112" fill="none" stroke="#7CCBFF" stroke-width="1" stroke-dasharray="3 4" opacity=".5"/>
    <g fill="rgba(247,216,138,.25)" stroke="#F7D88A" stroke-width="1.2"><path d="M120 176 l5 -3 5 3 v6 l-5 3 -5 -3z"/><path d="M96 170 l5 -3 5 3 v6 l-5 3 -5 -3z" opacity=".7"/><path d="M60 180 l5 -3 5 3 v6 l-5 3 -5 -3z" opacity=".5"/></g>
    <path d="M200 170 C 160 180 140 180 128 178" fill="none" stroke="#F7D88A" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>
    <g font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="11" font-weight="700" fill="#E6EFEF">
      <circle cx="74" cy="84" r="9" fill="#0B171C" stroke="#7CCBFF"/><text x="74" y="88" text-anchor="middle">1</text>
      <circle cx="150" cy="146" r="9" fill="#0B171C" stroke="#43D99A"/><text x="150" y="150" text-anchor="middle">2</text>
      <circle cx="304" cy="70" r="9" fill="#0B171C" stroke="#8C9CC0"/><text x="304" y="74" text-anchor="middle">3</text>
      <circle cx="214" cy="178" r="9" fill="#0B171C" stroke="#F7D88A"/><text x="214" y="182" text-anchor="middle">4</text>
    </g>`,
  end:[250,112],
  focus:[[72,100,46],[150,122,40],[258,104,62],[110,176,58]],
  adv:['Cortisol is fat-soluble, so it diffuses through the membrane; most cortisol in the blood travels bound to carrier proteins.','It binds the glucocorticoid receptor (GR) in the cytoplasm, which releases its chaperone proteins.','GR pairs bind glucocorticoid response elements (GREs) on DNA and switch target genes on or off.','Transcription of gluconeogenic enzymes such as PEPCK rises, so the cell makes more glucose.'],
  steps:['Cortisol from the blood crosses the cell membrane.','Inside the cell, it binds its receptor.','Together they move into the nucleus and change which genes are active.','The cell makes more glucose-producing enzymes, so more glucose is released.'],
  say:'Inside a liver cell. Cortisol crosses the membrane, binds its receptor, moves into the nucleus and changes gene activity, so more glucose is released.'
 }},

 search:[
  {t:'Fast route',k:'Pathway',syn:['sympathetic','adrenal medulla','nerves','fight or flight'],go:{pathway:['stress','fast']}},
  {t:'HPA axis',k:'Pathway',syn:['slow route','stress axis','hypothalamic-pituitary-adrenal'],go:{pathway:['stress','slow']}},
  {t:'Adrenaline',k:'Signal',syn:['epinephrine'],go:{node:'adrenaline'}},
  {t:'Noradrenaline',k:'Signal',syn:['norepinephrine'],go:{node:'noradrenaline'}},
  {t:'CRH',k:'Signal',syn:['corticotropin-releasing hormone'],go:{node:'crh'}},
  {t:'ACTH',k:'Signal',syn:['adrenocorticotropic hormone','corticotropin'],go:{node:'acth'}},
  {t:'Cortisol',k:'Signal',syn:['stress hormone','glucocorticoid'],go:{node:'cortisol'}},
  {t:'Hypothalamus',k:'Organ',syn:['brain'],go:{organ:'hyp'}},
  {t:'Pituitary gland',k:'Organ',syn:['hypophysis','anterior lobe'],go:{organ:'pit'}},
  {t:'Adrenal glands',k:'Organ',syn:['adrenal cortex','adrenal medulla','suprarenal'],go:{organ:'adr'}},
  {t:'Liver',k:'Organ',syn:['hepatic','liver cell'],go:{organ:'liver'}},
  {t:'Heart',k:'Organ',syn:['cardiac','heartbeat'],go:{organ:'heart'}},
  {t:'Lungs',k:'Organ',syn:['breathing','airways'],go:{organ:'lungs'}}
 ],

 read({revealed}){
  return `<h4>Fast route · within seconds</h4><ol>
   <li>The brain registers the threat and sends <span class="n">nerve signals · schematic route</span> to the adrenal medulla. <span class="n">activates</span></li>
   <li>The adrenal medulla releases <span class="m">adrenaline · blood</span>. <span class="m">stimulates</span></li>
   <li>Adrenaline reaches the heart: it beats faster and harder.</li>
   <li>Adrenaline reaches the liver: glucose is made available.</li></ol>
  <h4>Slow route (HPA axis) · over minutes, lasting hours</h4><ol>
   <li>The hypothalamus releases <span class="m">CRH · portal blood</span> to the anterior pituitary. <span class="m">stimulates</span></li>
   <li>The anterior pituitary releases <span class="m">ACTH · blood</span> to the adrenal cortex. <span class="m">stimulates</span></li>
   <li>The adrenal cortex releases <span class="m">cortisol · blood</span>.</li>
   <li>Cortisol helps the liver make glucose available and affects many tissues.</li>
   <li>${revealed('slow')?'Cortisol acts back on the anterior pituitary and the hypothalamus. <span class="f">inhibits · negative feedback</span>':'Something acts back on the brain. <span class="f">hidden until you try it</span>'}</li></ol>
  <h4>What you would notice</h4><ul><li>Heart beats faster</li><li>Pupils widen</li><li>Breathing quickens</li><li>Later, signs settle as the body calms</li></ul>`;
 }
};
