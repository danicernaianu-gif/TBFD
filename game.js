const BOARD_URI="assets/img/img_2ca9d6918768fc41.png";
const SQ_POS=[
  {x:61,y:62},{x:130,y:61},{x:201,y:63},{x:270,y:61},{x:340,y:61},
  {x:410,y:61},{x:482,y:63},{x:551,y:61},{x:621,y:61},
  {x:621,y:131},{x:621,y:201},{x:621,y:271},{x:622,y:343},
  {x:621,y:411},{x:621,y:481},{x:622,y:552},
  {x:620,y:621},{x:551,y:623},{x:480,y:621},{x:410,y:621},
  {x:340,y:621},{x:270,y:621},{x:200,y:620},{x:131,y:622},
  {x:60,y:621},{x:60,y:551},{x:61,y:483},{x:60,y:411},
  {x:60,y:341},{x:61,y:272},{x:61,y:203},{x:60,y:131}
];
const SQ_SIZE=56;
const PLAYERS=[
  {id:0,name:'The Ploughman',ch:'#E74C3C',desc:'Walking this field since 1847.'},
  {id:1,name:'Barley The Ox',ch:'#3498DB',desc:'Massive. Slow. Gasping for a pint.'},
  {id:2,name:'Hops McGraw',ch:'#9B59B6',desc:'Stole a beer from a moving tractor.'},
  {id:3,name:'Kernel Fury',ch:'#2ECC71',desc:'Sentient wheat. Immediately wanted a drink.'}
];
const SQ=[
{t:'start',l:'START'},{t:'harvest',l:'Harvest'},{t:'sabotage',l:'Sabotage'},{t:'fragment',l:'FRAGMENT'},
{t:'mudfield',l:'Mud'},{t:'harvest',l:'Harvest'},{t:'sabotage',l:'Sabotage'},{t:'harvest',l:'Harvest'},
{t:'pub',l:'THE PUB'},{t:'harvest',l:'Harvest'},{t:'shortcut',l:'Tractor!'},{t:'fragment',l:'FRAGMENT'},
{t:'sabotage',l:'Sabotage'},{t:'harvest',l:'Harvest'},{t:'mudfield',l:'Mud'},{t:'blessing',l:'Blessing'},
{t:'harvest',l:'Harvest'},{t:'sabotage',l:'Sabotage'},{t:'harvest',l:'Harvest'},{t:'fragment',l:'FRAGMENT'},
{t:'mudfield',l:'Mud'},{t:'harvest',l:'Harvest'},{t:'pub',l:'THE PUB'},{t:'sabotage',l:'Sabotage'},
{t:'shortcut',l:'Tractor!'},{t:'harvest',l:'Harvest'},{t:'sabotage',l:'Sabotage'},{t:'fragment',l:'FRAGMENT'},
{t:'mudfield',l:'Mud'},{t:'blessing',l:'Blessing'},{t:'sabotage',l:'Sabotage'},{t:'harvest',l:'Harvest'}
];
function pN(i){return `<span style="color:${PLAYERS[i].ch};font-weight:700">${PLAYERS[i].name}</span>`}
const HC=[
{n:'Good Yield',e:'Move forward 3 spaces.',f:'The wheat gods smile upon you.',a:p=>{mv(p,3)}},
{n:'Barley Surplus',e:'Take another turn immediately.',f:'The harvest waits for no one.',a:p=>{S.extra=true}},
{n:'Rain Dance',e:'All OTHER players move back 2.',f:'Everyone else is now soggy.',a:p=>{oth(p).forEach(o=>mv(o,-2))}},
{n:'Broken Tractor',e:'Miss your next turn.',f:"It's a Massey Ferguson. What did you expect?",a:p=>{S.p[p].skip=true}},
{n:'Hops Inspection',e:'Roll 4+: move 4. Under 4: nothing.',f:'The inspector eyes your hops suspiciously.',a:p=>{pendRoll(p,4,()=>mv(p,4),()=>log(p,'Inspector disappointed.'))}},
{n:'Bumper Harvest',e:'Move to nearest Fragment ahead!',f:'Land directly on it.',a:p=>{mvNF(p)}},
{n:'Wheat Thief!',e:'Player to your left: -2 next roll.',f:'Sticky fingers.',a:p=>{let t=(p+1)%4;S.p[t].pen=2;log(p,`steals from ${pN(t)}`)}},
{n:'Fermentation Delay',e:'Move back 4.',f:'Yeast takes its time.',a:p=>{mv(p,-4)}},
{n:'Scarecrow Malfunction',e:'Swap positions with any player!',f:'The scarecrow scared YOU.',a:p=>{pickP(p,'Swap with whom?',t=>{swap(p,t)})}},
{n:'Brewery Tour',e:'Skip to next Harvest square.',f:'Learning the craft. Slowly.',a:p=>{mvNT(p,'harvest')}},
{n:'Subsidy Approved',e:'Gain 1 Stone Fragment!',f:'Bureaucracy works.',a:p=>{giveF(p)}},
{n:'Grain Elevator Jam',e:'ALL players move back 1.',f:'Everything grinds to a halt.',a:p=>{for(let i=0;i<4;i++)mv(i,-1)}},
{n:'Perfect Pint Preview',e:'Move forward 2.',f:'Beautiful. And cold.',a:p=>{mv(p,2)}},
{n:'Sunny Spell',e:'Double turn!',f:"Weather's nice for once.",a:p=>{S.extra=true}},
{n:'Combine Harvester Race',e:'You and nearest both roll. High +4, low -2.',f:'Nobody wins a tie.',a:p=>{hRace(p)}},
{n:'Early Frost',e:'Lose 1 Stone Fragment.',f:'Nature is cruel.',a:p=>{loseF(p)}},
{n:'Beer Festival Invite',e:'Move forward 6!',f:'Somewhere important.',a:p=>{mv(p,6)}},
{n:'Apprentice Brewer',e:'Next turn: 2 dice, pick higher.',f:'Unreliable help, but help.',a:p=>{S.p[p].dbl=true}},
{n:'Tasting Committee',e:'All roll. Lowest loses a fragment.',f:'Harsh but fair.',a:p=>{tCom()}},
{n:'Muscle Memory',e:'Move to any square within 6.',f:'You know this field.',a:p=>{pickSqR(p,6)}}
];
const SC=[
{n:'Stolen Hops',e:'Steal 1 fragment from any player.',f:'Look them in the eye.',a:p=>{pickF(p,'Steal from whom?',t=>{steal(p,t)})}},
{n:'Blocked Path',e:'Choose a player: must roll 4+ to move.',f:'Fallen tree. Convenient.',a:p=>{pickP(p,'Block whom?',t=>{S.p[t].blk=true;log(p,`blocks ${pN(t)}!`)})}},
{n:'Tractor Redirect',e:'Send any player to nearest Pub.',f:"They didn't want to go.",a:p=>{pickP(p,'Send who to pub?',t=>{toPub(t);log(p,`sends ${pN(t)} to pub!`)})}},
{n:'Scarecrow Swap',e:'Swap with player furthest ahead.',f:'Self-sabotage achieved.',a:p=>{let t=fur();if(t!==p)swap(p,t);else log(p,'already furthest.')}},
{n:'Mud Splash',e:'Choose a player: back 3.',f:'Puddle. On purpose.',a:p=>{pickP(p,'Splash whom?',t=>{mv(t,-3);log(p,`splashes ${pN(t)}!`)})}},
{n:'Harvest Tax',e:'All others: -1 next roll.',f:'Tax is theft, but strategy.',a:p=>{oth(p).forEach(o=>S.p[o].pen=(S.p[o].pen||0)+1);log(p,'imposes harvest tax!')}},
{n:'Crow Attack',e:'Choose a player: next card discarded.',f:'Crows got to it.',a:p=>{pickP(p,'Whose card eaten?',t=>{S.p[t].cBlk=true;log(p,`crows after ${pN(t)}!`)})}},
{n:'Field Fire',e:'All within 5 spaces move to you.',f:'Controlled burn. Mostly.',a:p=>{fFire(p)}},
{n:'Slippery Slope',e:'Most fragments player loses 1.',f:'Tall poppy.',a:p=>{let t=mostF(p);if(t>=0){loseF(t);log(p,`targets ${pN(t)}!`)}}},
{n:'Pub Detour',e:'Choose a player: pub + miss turn.',f:'"Just a quick one."',a:p=>{pickP(p,'Send who on detour?',t=>{toPub(t);S.p[t].skip=true;log(p,`${pN(t)} pub detour!`)})}},
{n:'Equipment Failure',e:'Choose a player: next roll halved.',f:'Boots broken.',a:p=>{pickP(p,'Whose equipment?',t=>{S.p[t].half=true;log(p,`breaks ${pN(t)}'s gear!`)})}},
{n:'Boundary Dispute',e:'You and chosen player roll off.',f:'You asked for it.',a:p=>{pickP(p,'Dispute with?',t=>{bDisp(p,t)})}},
{n:'Bribe the Inspector',e:'Pay 1 frag: any player back 8.',f:'Rural corruption.',a:p=>{if(S.p[p].frags>0){pickP(p,'Bribe target?',t=>{loseF(p);mv(t,-8);log(p,`bribes against ${pN(t)}!`)})}else log(p,'no fragments to bribe with.')}},
{n:'Pesticide Spill',e:'Players on Harvest/Mud/Shortcut back 2.',f:'Environmental disaster.',a:p=>{for(let i=0;i<4;i++){let sq=SQ[S.p[i].pos%32];if(['harvest','mudfield','shortcut'].includes(sq.t))mv(i,-2)}}},
{n:'Fox in the Henhouse',e:'Steal 1 from whoever has most.',f:'Fox plays favourites.',a:p=>{let t=mostF(p);if(t>=0&&t!==p)steal(p,t);else log(p,'no one worth robbing.')}},
{n:'Wrong Turn',e:'Choose a player: backward next turn.',f:'Lost in a wheat field.',a:p=>{pickP(p,'Who turns wrong?',t=>{S.p[t].rev=true;log(p,`${pN(t)} wrong way!`)})}},
{n:'Union Strike',e:'ALL capped at 3 movement.',f:'Solidarity. Unfortunately.',a:p=>{for(let i=0;i<4;i++)S.p[i].cap=3;log(p,'union strike!')}},
{n:'Suspicious Scarecrow',e:'Swap a player with player to their left.',f:'Musical chairs, wheat edition.',a:p=>{pickP(p,"Who gets scarecrow'd?",t=>{let l=(t+1)%4;swap(t,l);log(p,`swaps ${pN(t)} & ${pN(l)}!`)})}},
{n:'Fake Fragment',e:'Counts until challenged.',f:'Is it real?',a:p=>{S.p[p].fake=true;S.p[p].frags++;log(p,'plays Fake Fragment!');checkW(p)}},
{n:'Total Chaos',e:'ALL pass fragments left.',f:'Redistributive agriculture.',a:p=>{chaos()}}
];

let S={cur:0,p:[],phase:'roll',extra:false,pend:null,cardCb:null,turn:1};
function initS(){S.cur=0;S.extra=false;S.phase='roll';S.turn=1;S.p=PLAYERS.map(()=>({pos:0,frags:0,skip:false,blk:false,pen:0,half:false,dbl:false,rev:false,cap:0,cBlk:false,fake:false,laps:0}))}

function loadBoard(){
  const bc=document.getElementById('bc');
  const img=document.createElement('img');img.src=BOARD_URI;img.className='board-img';bc.appendChild(img);
  for(let i=0;i<32;i++){const ov=document.createElement('div');ov.className='sq-overlay';ov.id=`so-${i}`;
    const p=SQ_POS[i],half=SQ_SIZE/2;
    ov.style.cssText=`left:${((p.x-half)/684*100).toFixed(2)}%;top:${((p.y-half)/684*100).toFixed(2)}%;width:${(SQ_SIZE/684*100).toFixed(2)}%;height:${(SQ_SIZE/684*100).toFixed(2)}%`;
    bc.appendChild(ov);}
  renderTk();
}
function renderTk(){for(let i=0;i<32;i++){const c=document.getElementById(`so-${i}`);if(c)c.querySelectorAll('.board-token').forEach(t=>t.remove())}
  for(let p=0;p<4;p++){const pos=S.p[p].pos%32,c=document.getElementById(`so-${pos}`);
    if(c){const t=document.createElement('div');t.className='board-token';t.style.background=PLAYERS[p].ch;t.textContent=p+1;c.appendChild(t)}}}

function renderP(){
  const pp=document.getElementById('pp');pp.innerHTML='';
  for(let i=0;i<4;i++){
    const p=PLAYERS[i],s=S.p[i],act=i===S.cur&&S.phase!=='gameover';
    const c=document.createElement('div');c.className=`player-card ${act?'active':'inactive'}`;
    let st=[];
    if(s.skip)st.push('Skipping');if(s.blk)st.push('Blocked');if(s.pen>0)st.push(`-${s.pen}`);
    if(s.half)st.push('Half');if(s.dbl)st.push('2 dice');if(s.rev)st.push('Backward');
    if(s.cap>0)st.push(`Max ${s.cap}`);if(s.fake)st.push('Fake');if(s.cBlk)st.push('Eaten');
    let fr='';for(let f=0;f<4;f++)fr+=`<div class="frag-pip ${f<s.frags?'filled':''}"></div>`;
    c.innerHTML=`<div class="player-header"><div class="player-dot" style="background:${p.ch}"><svg viewBox="0 0 24 24"><path d="M12 4C9 4 7 6 7 8.5C7 12 12 17 12 17S17 12 17 8.5C17 6 15 4 12 4Z"/></svg></div><div><div class="player-name">${p.name}</div><div class="player-desc">${p.desc}</div></div></div>
    <div class="player-info"><span class="pi-tag" style="color:${p.ch}">SQ ${s.pos%32}</span><span class="pi-tag">LAP ${s.laps}</span><span class="pi-tag">${s.frags}/4</span></div>
    <div class="frag-row">${fr}</div>
    <div class="status-line">${st.join(' · ')||''}</div>`;
    pp.appendChild(c);}
  const tb=document.createElement('div');tb.className='turn-badge';tb.textContent='Turn '+S.turn;pp.appendChild(tb);
}

function log(p,msg){const l=document.getElementById('le'),e=document.createElement('div');e.className='log-entry';
e.innerHTML=p>=0?`<span class="lp" style="color:${PLAYERS[p].ch}">${PLAYERS[p].name}</span> ${msg}`:`<em>${msg}</em>`;l.prepend(e)}
function setTi(t){document.getElementById('ti').innerHTML=t||''}
function setAa(h){document.getElementById('aa').innerHTML=h||''}

function rollDice(){
const p=S.cur,s=S.p[p];if(S.phase!=='roll')return;
if(s.skip){s.skip=false;log(p,'misses turn.');nextTurn();return}
S.phase='rolling';document.getElementById('rb').disabled=true;
const dd=document.getElementById('dd');dd.classList.add('rolling');
let r=15,iv=setInterval(()=>{dd.textContent=Math.floor(Math.random()*6)+1;r--;
if(r<=0){clearInterval(iv);dd.classList.remove('rolling');
let v;if(s.dbl){let r1=Math.floor(Math.random()*6)+1,r2=Math.floor(Math.random()*6)+1;v=Math.max(r1,r2);log(p,`double: ${r1}&${r2}→${v}`);s.dbl=false}else v=Math.floor(Math.random()*6)+1;
if(s.pen>0){let o=v;v=Math.max(1,v-s.pen);log(p,`${o}→${v} (penalty)`);s.pen=0}
if(s.half){let o=v;v=Math.max(1,Math.floor(v/2));log(p,`halved ${o}→${v}`);s.half=false}
if(s.cap>0){v=Math.min(v,s.cap);s.cap=0}
dd.textContent=v;
if(s.blk){s.blk=false;if(v<4){log(p,`${v} — blocked!`);nextTurn();return}log(p,`${v} — breaks through!`)}
if(s.rev){v=-v;s.rev=false;log(p,`BACKWARD ${Math.abs(v)}!`)}else log(p,`rolls ${v}`);
mv(p,v,true)}},60)}

function mv(pl,sp,main){const s=S.p[pl];s.pos+=sp;if(s.pos<0)s.pos=32+(s.pos%32);
if(main&&sp>0&&Math.floor(s.pos/32)>s.laps){s.laps=Math.floor(s.pos/32);log(pl,'completes a lap!')}
renderTk();renderP();if(main)resolve(pl)}
function resolve(pl){const s=S.p[pl],si=s.pos%32,sq=SQ[si];
document.querySelectorAll('.sq-overlay.active').forEach(e=>e.classList.remove('active'));
const ov=document.getElementById(`so-${si}`);if(ov)ov.classList.add('active');
switch(sq.t){
case'harvest':if(s.cBlk){s.cBlk=false;log(pl,'card eaten by crows!');nextTurn()}else drawCard(pl,'harvest');break;
case'sabotage':if(s.cBlk){s.cBlk=false;log(pl,'card eaten by crows!');nextTurn()}else drawCard(pl,'sabotage');break;
case'fragment':giveF(pl);log(pl,'Fragment square!');nextTurn();break;
case'pub':log(pl,'THE PUB. Misses next turn.');s.skip=true;nextTurn();break;
case'shortcut':log(pl,'Tractor path! +5!');mv(pl,5);resolve(pl);return;
case'mudfield':log(pl,'Mudfield!');pendRoll(pl,4,()=>{log(pl,'trudges through!');nextTurn()},()=>{log(pl,'STUCK! Miss turn.');s.skip=true;nextTurn()});return;
case'blessing':log(pl,'Hawkstone Blessing!');showCh(pl,'Blessing:',[
{text:'Steal a fragment',action:()=>{pickF(pl,'From whom?',t=>{steal(pl,t)})}},
{text:'Move to any Fragment sq',action:()=>{pickAnySq(pl)}}],false);return;
case'start':log(pl,'passes start.');nextTurn();break;
default:nextTurn()}}

function drawCard(pl,type){const d=type==='harvest'?HC:SC,c=d[Math.floor(Math.random()*d.length)];
showCard(type,c,()=>{c.a(pl);if(S.phase==='resolving')nextTurn()})}
function showCard(type,card,cb){S.phase='card';const o=document.getElementById('cardOv'),p=document.getElementById('cardPop');
p.className=`card-popup ${type}`;document.getElementById('cType').textContent=type.toUpperCase();
document.getElementById('cType').style.color=type==='harvest'?'#8B6914':'#C0392B';
document.getElementById('cName').textContent=card.n;document.getElementById('cName').style.color=type==='harvest'?'#6B4A00':'#962D22';
document.getElementById('cEff').textContent=card.e;document.getElementById('cFlav').textContent=card.f;
S.cardCb=cb;o.classList.add('show')}
function closeCard(){document.getElementById('cardOv').classList.remove('show');if(S.cardCb){const cb=S.cardCb;S.cardCb=null;S.phase='resolving';cb()}}

function showCh(pl,title,opts,auto=true){S.phase='choice';const o=document.getElementById('choiceOv');document.getElementById('chTitle').textContent=title;
const b=document.getElementById('chBtns');b.innerHTML='';
opts.forEach((opt,i)=>{const btn=document.createElement('button');btn.className=`action-btn ${['gold','blue','green','red'][i%4]}`;
btn.textContent=opt.text;btn.onclick=()=>{o.classList.remove('show');S.phase='resolving_choice';opt.action();
if(auto&&S.phase==='resolving_choice')nextTurn()};b.appendChild(btn)});o.classList.add('show')}
function pickP(cp,title,cb){const opts=[];for(let i=0;i<4;i++)if(i!==cp)opts.push({text:PLAYERS[i].name,action:()=>cb(i)});showCh(cp,title,opts)}
function pickF(cp,title,cb){const opts=[];for(let i=0;i<4;i++)if(i!==cp&&S.p[i].frags>0)opts.push({text:`${PLAYERS[i].name} (${S.p[i].frags})`,action:()=>cb(i)});
if(!opts.length){log(cp,'no one has fragments.');nextTurn();return}showCh(cp,title,opts)}
function pickSqR(pl,range){const pos=S.p[pl].pos%32,opts=[];
for(let d=-range;d<=range;d++){if(!d)continue;let t=((pos+d)%32+32)%32;if(SQ[t].t==='fragment')opts.push({text:`Sq ${t}: FRAGMENT`,action:()=>{S.p[pl].pos=(S.p[pl].pos-pos+t);if(S.p[pl].pos<0)S.p[pl].pos+=32;renderTk();renderP();resolve(pl)}})}
if(!opts.length){opts.push({text:`+${range} fwd`,action:()=>{mv(pl,range);nextTurn()}});opts.push({text:`${range} back`,action:()=>{mv(pl,-range);nextTurn()}})};showCh(pl,'Move where?',opts,false)}
function pickAnySq(pl){const opts=[];for(let i=0;i<32;i++)if(SQ[i].t==='fragment')opts.push({text:`Sq ${i}: FRAGMENT`,action:()=>{const b=Math.floor(S.p[pl].pos/32)*32;S.p[pl].pos=b+i;renderTk();renderP();resolve(pl)}});showCh(pl,'Which Fragment?',opts,false)}

function giveF(pl){if(S.p[pl].frags<4){S.p[pl].frags++;log(pl,`+1 Fragment (${S.p[pl].frags}/4)`);renderP();checkW(pl)}}
function loseF(pl){if(S.p[pl].frags>0){if(S.p[pl].fake){S.p[pl].fake=false;S.p[pl].frags--;log(pl,'Fake Fragment lost!')}else{S.p[pl].frags--;log(pl,`-1 Fragment (${S.p[pl].frags}/4)`)}renderP()}}
function steal(th,vi){if(S.p[vi].frags>0){if(S.p[vi].fake){S.p[vi].fake=false;S.p[vi].frags--;log(th,`steals from ${pN(vi)}... FAKE!`)}else{S.p[vi].frags--;S.p[th].frags=Math.min(4,S.p[th].frags+1);log(th,`steals from ${pN(vi)}!`)}renderP();checkW(th)}}
function chaos(){log(-1,'TOTAL CHAOS!');const f=S.p.map(p=>p.frags),fk=S.p.map(p=>p.fake);for(let i=0;i<4;i++){S.p[i].frags=f[(i+3)%4];S.p[i].fake=fk[(i+3)%4]}renderP();for(let i=0;i<4;i++)checkW(i)}

function pendRoll(pl,th,ok,fail){S.phase='action';setAa(`<button class="action-btn gold" onclick="doPR(${pl},${th})">Roll (need ${th}+)</button>`);S.pend={ok,fail}}
function doPR(pl,th){const r=Math.floor(Math.random()*6)+1;document.getElementById('dd').textContent=r;log(pl,`rolls ${r} (need ${th}+)`);setAa('');if(r>=th)S.pend.ok();else S.pend.fail();S.pend=null;if(S.phase==='action')nextTurn()}
function mvNF(pl){const pos=S.p[pl].pos%32;for(let d=1;d<32;d++)if(SQ[(pos+d)%32].t==='fragment'){mv(pl,d);return}}
function mvNT(pl,type){const pos=S.p[pl].pos%32;for(let d=1;d<32;d++)if(SQ[(pos+d)%32].t===type){mv(pl,d);return}}
function toPub(pl){const pos=S.p[pl].pos%32;for(let d=1;d<32;d++){let t=(pos+d)%32;if(SQ[t].t==='pub'){const b=Math.floor(S.p[pl].pos/32)*32;S.p[pl].pos=b+t;S.p[pl].skip=true;renderTk();renderP();return}}}
function swap(a,b){let t=S.p[a].pos;S.p[a].pos=S.p[b].pos;S.p[b].pos=t;log(-1,`${pN(a)} swaps with ${pN(b)}!`);renderTk();renderP()}
function oth(p){return[0,1,2,3].filter(i=>i!==p)}
function fur(){let b=-1,bp=-1;for(let i=0;i<4;i++)if(S.p[i].pos>bp){bp=S.p[i].pos;b=i}return b}
function mostF(ex){let b=-1,bf=0;for(let i=0;i<4;i++)if(i!==ex&&S.p[i].frags>bf){bf=S.p[i].frags;b=i}return b}
function fFire(pl){const mp=S.p[pl].pos%32;let hit=false;for(let i=0;i<4;i++){if(i!==pl){const tp=S.p[i].pos%32,d=Math.min(Math.abs(mp-tp),32-Math.abs(mp-tp));if(d<=5){S.p[i].pos=Math.floor(S.p[i].pos/32)*32+mp;log(pl,`drags ${pN(i)} into fire!`);hit=true}}}if(!hit)log(pl,'fire fizzles.');renderTk();renderP()}
function hRace(pl){let nr=-1,md=999;const mp=S.p[pl].pos%32;for(let i=0;i<4;i++)if(i!==pl){const d=Math.min(Math.abs(mp-S.p[i].pos%32),32-Math.abs(mp-S.p[i].pos%32));if(d<md){md=d;nr=i}}
if(nr<0)return;const r1=Math.floor(Math.random()*6)+1,r2=Math.floor(Math.random()*6)+1;
log(-1,`RACE! ${pN(pl)}: ${r1} vs ${pN(nr)}: ${r2}`);if(r1>r2){mv(pl,4);mv(nr,-2)}else if(r2>r1){mv(nr,4);mv(pl,-2)}else{mv(pl,-2);mv(nr,-2);log(-1,'Tie!')}}
function tCom(){const rs=[0,1,2,3].map(()=>Math.floor(Math.random()*6)+1);log(-1,`TASTING: ${PLAYERS.map((p,i)=>`${p.name}:${rs[i]}`).join(' ')}`);const mn=Math.min(...rs);for(let i=0;i<4;i++)if(rs[i]===mn)loseF(i)}
function bDisp(pl,tg){const r1=Math.floor(Math.random()*6)+1,r2=Math.floor(Math.random()*6)+1;log(-1,`DISPUTE! ${pN(pl)}: ${r1} vs ${pN(tg)}: ${r2}`);if(r1>=r2){if(S.p[tg].pos>S.p[pl].pos)swap(pl,tg)}else{if(S.p[pl].pos>S.p[tg].pos)swap(pl,tg)}}

function checkW(pl){if(S.p[pl].frags>=4){S.phase='gameover';log(-1,`${PLAYERS[pl].name} PULLS THE PINT!`);
setTimeout(()=>{document.getElementById('winN').textContent=`${PLAYERS[pl].name} wins!`;
document.getElementById('winQ').textContent=["Beer. Earned. Journey preposterous.","And on that bombshell... pint.","The wheat field was never the obstacle.","Harder than actual farming."][pl];
document.getElementById('winOv').classList.add('show')},1000)}}

function nextTurn(){if(S.phase==='gameover')return;
document.querySelectorAll('.sq-overlay.active').forEach(e=>e.classList.remove('active'));
if(S.extra){S.extra=false;log(S.cur,'takes another turn!');S.phase='roll';document.getElementById('rb').disabled=false;setTi(`${PLAYERS[S.cur].name}'s BONUS turn.`);renderP();return}
S.cur=(S.cur+1)%4;if(S.cur===0)S.turn++;S.phase='roll';document.getElementById('rb').disabled=false;
setTi(`${PLAYERS[S.cur].name}'s turn to roll.`);setAa('');renderP();
for(let i=0;i<4;i++){if(i!==S.cur&&S.p[i].fake){setAa(`<button class="action-btn red" onclick="chalF(${i})" style="font-size:.7em">Challenge ${PLAYERS[i].name}?</button><button class="action-btn green" onclick="skipCh()" style="font-size:.7em">Ignore</button>`);S.phase='challenge';return}}}
function chalF(t){if(S.p[t].fake){S.p[t].fake=false;S.p[t].frags--;log(S.cur,`challenges ${pN(t)} — FAKE!`);renderP()}S.phase='roll';document.getElementById('rb').disabled=false;setAa('')}
function skipCh(){S.phase='roll';document.getElementById('rb').disabled=false;setAa('')}


/* === SVG FIELD REPORT PANEL ===
   Requires: assets/svg/field-report.svg
   In the SVG, add a rectangle named/id'd: slot_log (invisible guide)
*/
async function injectSVGInto(el, url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  el.innerHTML = await res.text();
  return el.querySelector('svg');
}

function positionOverlayFromSlot(svgEl, slotId, overlayEl, wrapEl){
  // For inline SVG, getElementById works on the SVG document fragment
  const slot = (svgEl && svgEl.getElementById) ? svgEl.getElementById(slotId) : document.getElementById(slotId);
  if(!slot) throw new Error(`Slot not found in SVG: ${slotId}`);
  const r = slot.getBoundingClientRect();
  const w = wrapEl.getBoundingClientRect();
  overlayEl.style.left = (r.left - w.left) + "px";
  overlayEl.style.top = (r.top - w.top) + "px";
  overlayEl.style.width = r.width + "px";
  overlayEl.style.height = r.height + "px";
}

let _frResizeTimer = null;
async function initFieldReport(){
  const wrap = document.getElementById('frw');
  const host = document.getElementById('frSvg');
  const overlay = document.getElementById('le');
  if(!wrap || !host || !overlay) return;

  try{
    const svg = await injectSVGInto(host, 'assets/svg/field-report.svg');

    const relayout = () => {
      try{
        positionOverlayFromSlot(svg, 'slot_log', overlay, wrap);
        overlay.style.visibility = 'visible';
      }catch(e){
        console.warn(e);
      }
    };

    relayout();
    window.addEventListener('resize', () => {
      clearTimeout(_frResizeTimer);
      _frResizeTimer = setTimeout(relayout, 50);
    });
  }catch(e){
    console.warn('Field report SVG failed to load:', e);
    // Fallback: just show the HTML log in normal flow
    overlay.style.position = 'static';
    overlay.style.visibility = 'visible';
  }
}

initFieldReport();

initS();loadBoard();renderP();setTi(`${PLAYERS[0].name}'s turn to roll.`);log(-1,'"You\'d think getting a beer would be simple."');
