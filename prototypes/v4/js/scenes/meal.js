/* Scene: "You skip a meal" → Between meals (glucagon) and After a meal (insulin).
   Illustrative textbook-level content for design; requires scientific review before release. */
HS.scenes.meal={
 id:'meal',
 trigger:{title:'You skip a meal',sub:'Watch the body keep glucose steady',caption:'Glucose in the blood starts to fall',lights:['panc'],first:'between',autoplay:true,atmosphere:'rgba(240,194,126,.10)'},
 toggle:{label:'Meal timing',options:[['between','Between meals','Between'],['after','After a meal','After']]},

 routes:{
  glucagon:{d:'M 378 536 C 338 570 252 556 256 498',kind:'msg',label:'glucagon · blood',at:.5,dx:0,dy:26},
  glucose:{d:'M 412 446 C 530 384 522 132 396 80',kind:'msg',label:'glucose · blood',at:.45,dx:18,dy:0},
  fbGlu:{d:'M 502 300 C 572 400 548 520 452 516',kind:'fb',label:'glucose · feedback',at:.5,dx:18,dy:0},
  absorb:{d:'M 404 604 C 456 596 462 560 432 540',kind:'msg',label:'glucose · blood',at:.5,dx:22,dy:0},
  insL:{d:'M 372 538 C 332 572 250 558 256 498',kind:'msg',label:'insulin · blood',at:.5,dx:0,dy:26},
  insM:{d:'M 448 506 C 504 500 520 462 494 434',kind:'msg',label:'insulin · blood',at:.5,dx:22,dy:0},
  fbIns:{d:'M 496 462 C 552 556 486 598 446 540',kind:'fb',label:'glucose · feedback',at:.5,dx:18,dy:0}
 },

 pathways:{
  between:{name:'Between meals',node:'betweenP',chip:'over hours',region:'meal',segDur:1000,
   organs:['panc','liver','brain'],draw:['glucagon','glucose'],
   time:[
    {w:'after eating',c:'<b>After eating:</b> glucose from your last meal is in the blood.'},
    {w:'hours later',c:'<b>Hours later:</b> cells keep using glucose, and it slowly falls.'},
    {w:'glucose dips',c:'<b>Glucose dips:</b> the pancreas notices and releases glucagon.'},
    {w:'liver responds',c:'<b>Liver responds:</b> it breaks down stored glycogen and releases glucose.'},
    {w:'steady again',c:'<b>Steady again:</b> rising glucose turns glucagon down, and glucose holds steady.',show:['fbGlu']}
   ],
   hots:[
    {org:'panc',num:1,dx:34,dy:20,seg:null,t:2,region:'panc',one:'Pancreas releases glucagon',lab:{body:'Pancreas',organ:'glucagon',structure:'Alpha cells release glucagon'},ldx:64,ldy:12},
    {org:'liver',num:2,dx:-46,dy:-20,seg:'glucagon',t:3,region:'liver',one:'Liver releases stored glucose',lab:{body:'Liver',organ:'glucose',structure:'Liver cells break down glycogen'},ldx:-86,ldy:-10,cell:'liverGcg',leads:{scene:'stress',path:'slow',why:'During stress, cortisol also helps the liver keep glucose available, more slowly.'}},
    {org:'brain',num:3,dx:40,dy:6,seg:'glucose',t:3,region:'head',one:'Brain keeps its glucose supply',lab:{body:'Brain',organ:'glucose',structure:'Brain cells take up glucose'},ldx:56,ldy:-18}],
   afterPlay:{whenHidden:true,tip:{key:'mealGhost',text:'Something turns glucagon down again. Open Try it? on the dashed line.',pos:{right:16,bottom:214}}},
   gate:{
    routes:['fbGlu'],at:['fbGlu',.5],labelRoutes:['fbGlu'],tipKey:'mealGhost',from:'liver',
    aria:'Try it: something turns glucagon down',ariaRevealed:'Feedback: rising glucose acts back on the pancreas, revealed',dotAria:'Try it: what turns glucagon down?',
    calmBlocked:'Glucose can’t settle until something turns glucagon down. Open Try it? on the dashed line.',
    calmButton:'Watch glucose settle',
    afterTip:{key:'toAfter',text:'What about after eating? Choose After a meal in the pathway bar.',pos:{right:16,bottom:214}},
    try:{
     region:'meal',q:{body:'As glucose rises again, which organ eases off the signal that raised it?',organ:'As glucose rises again, where does it act to turn glucagon down?'},hint:'Tap the organ you think on the body.',
     candidates:['brain','liver','stom','panc'],answer:['panc'],
     why:'The cells that release a hormone are well placed to sense what it controls.',
     correct:'Rising glucose acts back on the pancreas, so it releases less glucagon. This is negative feedback.',
     feedback({all,picks}){
      if(all) return {tone:'good',head:'That’s it.',txt:this.correct};
      if(picks.has('panc')) return {tone:'warm',head:'Nearly.',txt:'The pancreas is right. Glucose doesn’t turn glucagon down at the other organs you picked.'};
      if(picks.has('liver')) return {tone:'warm',head:'Not quite.',txt:'The liver answers glucagon, but the pancreas decides how much glucagon is released.'};
      return {tone:'warm',head:'Not quite.',txt:'Glucose turns glucagon down where glucagon is made: the pancreas.'};
     }
    }
   },
   whatIf:{
    q:'What if the liver couldn’t answer glucagon?',region:'meal',
    p:'Glucagon still arrives, but the liver can’t respond to it. Predict first: what happens to blood glucose between meals?',
    options:[['low','Glucose stays low'],['rises','Glucose rises anyway'],['same','Nothing changes']],correct:'low',
    outcome:'Without the liver answering, glucose stays low between meals, and the pancreas keeps releasing glucagon.',
    extra:{rises:' Between meals, glucose rises mainly because the liver releases it, and here it can’t.',same:' The signal is still sent, but nothing answers it, so glucose doesn’t recover.'},
    fade:['fbGlu','glucose'],blocks:[['glucagon',.9]],blockLabel:{text:'liver not answering',route:'glucagon',t:.9,dx:-24,dy:0},
    badges:[{org:'panc',text:'glucagon stays high',dx:64,dy:-22},{org:'brain',text:'less glucose arriving',dx:56,dy:26}],
    holdTime:3,holdToast:'In this thought experiment glucose can’t recover, so it doesn’t settle.',replay:['glucagon']
   }
  },
  after:{name:'After a meal',node:'afterP',chip:'within minutes, over hours',region:'fed',segDur:900,
   organs:['int','panc','liver','muscle'],draw:['absorb','insL','insM'],
   time:[
    {w:'you eat',c:'<b>You eat:</b> food is digested in the stomach and intestines.'},
    {w:'minutes',c:'<b>Within minutes:</b> glucose from food starts entering the blood.'},
    {w:'glucose rises',c:'<b>Glucose rises:</b> beta cells in the pancreas release insulin.'},
    {w:'insulin acts',c:'<b>Insulin acts:</b> the liver stores glucose, and muscles and fat tissue take it up.'},
    {w:'steady again',c:'<b>Steady again:</b> as glucose falls back, the pancreas releases less insulin.',show:['fbIns']}
   ],
   hots:[
    {org:'int',num:1,dx:-46,dy:18,seg:null,t:1,region:'int',one:'Glucose from food enters the blood',lab:{body:'Intestines',organ:'glucose',structure:'Lining absorbs glucose'},ldx:-86,ldy:12},
    {org:'panc',num:2,dx:34,dy:20,seg:'absorb',t:2,region:'panc',one:'Pancreas releases insulin',lab:{body:'Pancreas',organ:'insulin',structure:'Beta cells release insulin'},ldx:64,ldy:12},
    {org:'liver',num:3,dx:-46,dy:-20,seg:'insL',t:3,region:'liver',one:'Liver stores glucose',lab:{body:'Liver',organ:'stores glucose',structure:'Liver cells store glycogen'},ldx:-86,ldy:-10},
    {org:'muscle',num:4,dx:32,dy:-44,seg:'insM',t:3,region:'muscle',one:'Muscles take up glucose',lab:{body:'Muscles',organ:'insulin',structure:'Muscle cells take up glucose'},ldx:40,ldy:-66,cell:'muscleIns'}],
   afterPlay:{whenHidden:true,tip:{key:'fedGhost',text:'Something stops glucose falling too far. Open Try it? on the dashed line.',pos:{right:16,bottom:214}}},
   gate:{
    routes:['fbIns'],at:['fbIns',.5],labelRoutes:['fbIns'],tipKey:'fedGhost',from:'muscle',
    aria:'Try it: something turns insulin down',ariaRevealed:'Feedback: falling glucose acts back on the pancreas, revealed',dotAria:'Try it: what turns insulin down?',
    calmBlocked:'Glucose can’t settle until something turns insulin down. Open Try it? on the dashed line.',
    calmButton:'Watch glucose settle',
    afterTip:{key:'fedDone',text:'Two hormones, one steady level: glucagon raises glucose between meals, insulin lowers it after eating.',pos:{right:16,bottom:214}},
    try:{
     region:'fed',q:{body:'As glucose falls again, which organ eases off the signal that lowered it?',organ:'As glucose falls again, where is insulin turned down?'},hint:'Tap the organ you think on the body.',
     candidates:['liver','panc','int','muscle'],answer:['panc'],
     why:'A hormone’s own source can sense its effect and ease off.',
     correct:'Falling glucose acts back on the pancreas, so it releases less insulin. This is negative feedback.',
     feedback({all,picks}){
      if(all) return {tone:'good',head:'That’s it.',txt:this.correct};
      if(picks.has('panc')) return {tone:'warm',head:'Nearly.',txt:'The pancreas is right. Insulin isn’t turned down at the other organs you picked.'};
      if(picks.has('liver')||picks.has('muscle')) return {tone:'warm',head:'Not quite.',txt:'The liver and muscles answer insulin. The pancreas decides how much insulin is released.'};
      return {tone:'warm',head:'Not quite.',txt:'Insulin is turned down where it is made: the pancreas.'};
     }
    }
   }
  }
 },

 signs:[
  {id:'hunger',type:'ripple',org:'stom',color:'#F0C27E',r:30,on:[2,3],paths:['between'],label:{org:'stom',text:'You start to feel hungry',dx:74,dy:-8,info:'stom'}},
  {id:'liverOut',type:'glyphs',org:'liver',offset:[44,-22],drift:[50,-44],on:[3],paths:['between'],label:{org:'liver',text:'Liver releases glucose',anchor:[280,448],dx:-96,dy:-10,info:'liver'}},
  {id:'steadyB',type:'none',on:[4],paths:['between'],label:{org:'brain',always:true,text:'Glucose holds steady',dx:56,dy:30}},
  {id:'full',type:'none',on:[0,1],paths:['after'],label:{org:'stom',text:'You feel full',dx:74,dy:-8,info:'stom'}},
  {id:'absorbG',type:'glyphs',org:'int',offset:[12,8],drift:[30,-56],on:[1,2],paths:['after'],label:{org:'int',text:'Glucose enters the blood',dx:-92,dy:34,info:'int'}},
  {id:'liverIn',type:'glyphs',org:'liver',offset:[-44,-40],drift:[34,34],on:[3],paths:['after'],label:{org:'liver',text:'Liver stores glucose',anchor:[280,448],dx:-96,dy:-10,info:'liver'}},
  {id:'muscleIn',type:'glyphs',org:'muscle',offset:[36,34],drift:[-38,-32],on:[3],paths:['after'],label:{org:'muscle',text:'Muscles take up glucose',dx:40,dy:-66,info:'muscle'}},
  {id:'steadyA',type:'none',on:[4],paths:['after'],label:{org:'heart',always:true,text:'Glucose holds steady',dx:62,dy:-30}}
 ],

 info:{
  panc:{t:'Pancreas',body:'Your pancreas helps keep blood glucose steady.',organ:'Between meals, alpha cells release glucagon. After a meal, beta cells release insulin.',structure:'Islets are small clusters of hormone cells: alpha cells make glucagon, beta cells make insulin.'},
  liver:{t:'Liver',body:'Your liver stores glucose and releases it when you need it.',organ:'Glucagon tells the liver to release stored glucose. Insulin tells it to store glucose.',structure:'Liver cells keep glucose as glycogen. Open the cell view to see glucagon at work.'},
  brain:{t:'Brain',body:'Your brain runs mostly on glucose, so it needs a steady supply.',organ:'Glucose released by the liver keeps the brain supplied between meals.',structure:'Brain cells take up glucose from the blood all the time.'},
  muscle:{t:'Muscles',body:'Your muscles use and store glucose.',organ:'After a meal, insulin helps muscle cells take up glucose from the blood.',structure:'Insulin brings glucose transporters to the muscle cell surface. Open the cell view to see how.'},
  int:{t:'Intestines',body:'Food is digested, and glucose passes into the blood.',organ:'Glucose from digested food enters the blood through the intestine wall.',structure:'The intestine lining absorbs glucose into the blood.'},
  stom:{t:'Stomach',body:'An empty stomach is one reason you feel hungry.',organ:'Between meals the stomach releases ghrelin, a hunger signal to the brain. It isn’t traced in this scene.',structure:'Not traced in this scene.'},
  heart:{t:'Heart',body:'Your heart pumps glucose-carrying blood around the body.',organ:'Not traced in this scene.',structure:'Not traced in this scene.'}
 },

 cells:{
  liverGcg:{
   aria:'Liver cell: how glucagon works',title:'Inside a liver cell',sub:'Cell · mechanism · illustrative draft',
   svg:`<rect x="0" y="0" width="70" height="214" fill="#0B1E28"/><text x="35" y="20" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="9" fill="#5F8A96">BLOOD</text>
    <rect x="78" y="14" width="288" height="186" rx="40" fill="#1A2A2F" stroke="#7B4A3E" stroke-width="3"/>
    <text x="100" y="36" font-family="Roboto Mono,monospace" font-size="9" fill="#9A7A70">LIVER CELL</text>
    <path d="M 70 64 h 12 M 70 64 l -8 -8 M 70 64 l -8 8" stroke="#43D99A" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M 86 70 C 130 90 170 96 196 108" fill="none" stroke="#43D99A" stroke-width="1.2" stroke-dasharray="3 4"/>
    <g fill="rgba(247,216,138,.22)" stroke="#F7D88A" stroke-width="1">${[[214,112],[228,104],[240,116],[226,124],[252,106],[262,120],[244,132],[214,130],[270,134]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
    <text x="242" y="96" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="8" fill="#C9B27A">GLYCOGEN</text>
    <path d="M 206 150 C 160 166 120 170 40 172" fill="none" stroke="#F7D88A" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>
    <g fill="rgba(247,216,138,.25)" stroke="#F7D88A" stroke-width="1.2"><path d="M180 156 l5 -3 5 3 v6 l-5 3 -5 -3z"/><path d="M124 164 l5 -3 5 3 v6 l-5 3 -5 -3z" opacity=".8"/><path d="M38 166 l5 -3 5 3 v6 l-5 3 -5 -3z" opacity=".6"/></g>
    <circle id="cellMol" cx="30" cy="104" r="7" fill="#7CCBFF"/><text x="30" y="107.5" text-anchor="middle" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="8" font-weight="700" fill="#06202E">G</text>
    <path id="cellPath" d="M 30 104 C 40 90 50 72 62 64" fill="none" stroke="#7CCBFF" stroke-width="1" stroke-dasharray="3 4" opacity=".5"/>
    <g font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="11" font-weight="700" fill="#E6EFEF">
      <circle cx="44" cy="40" r="9" fill="#0B171C" stroke="#7CCBFF"/><text x="44" y="44" text-anchor="middle">1</text>
      <circle cx="132" cy="72" r="9" fill="#0B171C" stroke="#43D99A"/><text x="132" y="76" text-anchor="middle">2</text>
      <circle cx="292" cy="112" r="9" fill="#0B171C" stroke="#F7D88A"/><text x="292" y="116" text-anchor="middle">3</text>
      <circle cx="100" cy="190" r="9" fill="#0B171C" stroke="#F7D88A"/><text x="100" y="194" text-anchor="middle">4</text>
    </g>`,
   end:[62,64],
   steps:['Glucagon in the blood binds its receptor on the liver cell surface. It stays outside the cell.','The receptor passes a signal inside the cell.','The cell breaks down stored glycogen into glucose.','Glucose leaves the cell and enters the blood.'],
   say:'Inside a liver cell. Glucagon binds a receptor on the surface, a signal passes inside, stored glycogen is broken down, and glucose leaves the cell.'
  },
  muscleIns:{
   aria:'Muscle cell: how insulin works',title:'Inside a muscle cell',sub:'Cell · mechanism · illustrative draft',
   svg:`<rect x="0" y="0" width="70" height="214" fill="#0B1E28"/><text x="35" y="20" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="9" fill="#5F8A96">BLOOD</text>
    <rect x="78" y="14" width="288" height="186" rx="26" fill="#241A20" stroke="#8A4A55" stroke-width="3"/>
    <text x="100" y="36" font-family="Roboto Mono,monospace" font-size="9" fill="#B07A84">MUSCLE CELL</text>
    <g stroke="#4A3038" stroke-width="7" stroke-linecap="round"><path d="M 200 56 L 350 56"/><path d="M 200 78 L 350 78"/><path d="M 226 176 L 350 176"/></g>
    <path d="M 70 64 h 12 M 70 64 l -8 -8 M 70 64 l -8 8" stroke="#43D99A" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M 86 70 C 120 86 150 106 172 124" fill="none" stroke="#43D99A" stroke-width="1.2" stroke-dasharray="3 4"/>
    <g fill="#1E2F2A" stroke="#8FD3AE" stroke-width="1.4"><circle cx="186" cy="136" r="9"/><circle cx="214" cy="120" r="9"/><path d="M 180 136 h 12 M 208 120 h 12" stroke-width="2"/></g>
    <path d="M 172 140 C 140 146 110 150 90 150" fill="none" stroke="#8FD3AE" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>
    <rect x="72" y="140" width="14" height="22" rx="3" fill="#1E2F2A" stroke="#8FD3AE" stroke-width="1.6"/><path d="M 79 144 v 14" stroke="#8FD3AE" stroke-width="1.4"/>
    <g fill="rgba(247,216,138,.25)" stroke="#F7D88A" stroke-width="1.2"><path d="M40 146 l5 -3 5 3 v6 l-5 3 -5 -3z" opacity=".7"/><path d="M98 160 l5 -3 5 3 v6 l-5 3 -5 -3z"/><path d="M128 176 l5 -3 5 3 v6 l-5 3 -5 -3z" opacity=".8"/></g>
    <circle id="cellMol" cx="30" cy="104" r="7" fill="#7CCBFF"/><text x="30" y="107.5" text-anchor="middle" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="8" font-weight="700" fill="#06202E">I</text>
    <path id="cellPath" d="M 30 104 C 40 90 50 72 62 64" fill="none" stroke="#7CCBFF" stroke-width="1" stroke-dasharray="3 4" opacity=".5"/>
    <g font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="11" font-weight="700" fill="#E6EFEF">
      <circle cx="44" cy="40" r="9" fill="#0B171C" stroke="#7CCBFF"/><text x="44" y="44" text-anchor="middle">1</text>
      <circle cx="128" cy="84" r="9" fill="#0B171C" stroke="#43D99A"/><text x="128" y="88" text-anchor="middle">2</text>
      <circle cx="238" cy="130" r="9" fill="#0B171C" stroke="#8FD3AE"/><text x="238" y="134" text-anchor="middle">3</text>
      <circle cx="112" cy="194" r="9" fill="#0B171C" stroke="#F7D88A"/><text x="112" y="198" text-anchor="middle">4</text>
    </g>`,
   end:[62,64],
   steps:['Insulin in the blood binds its receptor on the muscle cell surface.','The receptor passes a signal inside the cell.','Glucose transporters move from inside the cell to its surface.','Glucose enters the cell through them, to be used or stored.'],
   say:'Inside a muscle cell. Insulin binds a receptor on the surface, a signal passes inside, glucose transporters move to the surface, and glucose enters the cell.'
  }
 },

 search:[
  {t:'Between meals',k:'Pathway',syn:['fasting','glucagon pathway','skip a meal','hungry'],go:{pathway:['meal','between']}},
  {t:'After a meal',k:'Pathway',syn:['insulin pathway','eating','fed'],go:{pathway:['meal','after']}},
  {t:'Glucagon',k:'Signal',syn:['alpha cell hormone'],go:{node:'glucagon'}},
  {t:'Insulin',k:'Signal',syn:['beta cell hormone'],go:{node:'insulin'}},
  {t:'Glucose',k:'Signal',syn:['blood sugar','sugar','glycogen'],go:{node:'glucoseSig'}},
  {t:'Pancreas',k:'Organ',syn:['islets','alpha cells','beta cells'],go:{organ:'panc'}},
  {t:'Muscles',k:'Organ',syn:['muscle','skeletal muscle'],go:{organ:'muscle'}},
  {t:'Intestines',k:'Organ',syn:['gut','small intestine','digestion'],go:{organ:'int'}},
  {t:'Liver',k:'Organ',syn:['hepatic','liver cell'],go:{organ:'liver'}}
 ],

 read({revealed}){
  return `<h4>Between meals · over hours</h4><ol>
   <li>Blood glucose slowly falls as cells use it.</li>
   <li>Alpha cells in the pancreas release <span class="m">glucagon · blood</span> to the liver. <span class="m">stimulates</span></li>
   <li>The liver breaks down stored glycogen and releases <span class="m">glucose · blood</span>.</li>
   <li>Glucose keeps the brain and other tissues supplied.</li>
   <li>${revealed('between')?'Rising glucose acts back on the pancreas, so less glucagon is released. <span class="f">inhibits · negative feedback</span>':'Something turns glucagon down again. <span class="f">hidden until you try it</span>'}</li></ol>
  <h4>After a meal · within minutes, over hours</h4><ol>
   <li>Glucose from digested food enters the blood.</li>
   <li>Beta cells in the pancreas release <span class="m">insulin · blood</span>. <span class="m">stimulates</span></li>
   <li>The liver stores glucose as glycogen.</li>
   <li>Muscles and fat tissue take up glucose from the blood.</li>
   <li>${revealed('after')?'As glucose falls, the pancreas releases less insulin. <span class="f">inhibits · negative feedback</span>':'Something stops glucose falling too far. <span class="f">hidden until you try it</span>'}</li></ol>
  <h4>What you would notice</h4><ul><li>Between meals, you start to feel hungry</li><li>After eating, you feel full</li><li>You don’t notice the hormones: they keep glucose steady in the background</li></ul>`;
 }
};
