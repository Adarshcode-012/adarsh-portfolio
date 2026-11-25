import {createScene,landmarks,careStations,carSpot,nameSign,skyAt,treats,worldBounds,playSpots,butterflies,rallyGates,butterflyPosition} from "./world-scene.js";

const world=document.getElementById("world");
const viewport=document.getElementById("world-view");
const pins=document.getElementById("world-labels");
const action=document.getElementById("world-action");
const carAction=document.getElementById("world-car");
const skyStatus=document.getElementById("world-sky");
const progress=document.getElementById("world-progress");
const quest=document.getElementById("world-quest");
const hint=document.getElementById("world-hint");
const complete=document.getElementById("world-complete");
const loadNotice=document.getElementById("world-loading");
const mapButton=document.getElementById("world-map-toggle");
const mapMenu=document.getElementById("world-map");
const mapCanvas=document.getElementById("world-map-image");
const mapPaint=mapCanvas.getContext("2d");
const challengePanel=document.getElementById("world-challenge");
const challengeReadout=document.getElementById("challenge-readout");
const challengeGuide=document.getElementById("challenge-guide");
const meowBubble=document.getElementById("world-meow");
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
const touchLayout=matchMedia("(pointer: coarse)");
const state={
  position:{x:0,z:6.5,heading:.49},
  pointer:{x:0,y:0,active:false},
  moving:false,
  motion:!reducedMotion.matches,
  collected:new Set(),
  completed:new Set(),
  activity:null,
  vehicle:{...carSpot},
  driving:false,
  speed:0,
  jump:0,
  worldSeconds:0,
  challenge:null,
  meowUntil:0,
};
const projects=new Set();
const keys=new Set();
const activities=[...careStations,...playSpots];
const available=[...landmarks,...activities,state.vehicle,...treats];
const challengePoints=[...butterflies,...rallyGates];
const bestRuns=new Map();
const directionFor={ArrowUp:"up",w:"up",ArrowLeft:"left",a:"left",ArrowDown:"down",s:"down",ArrowRight:"right",d:"right"};
let scene;
let fallback=false;
let frame=0;
let lastFrame=0;
let route=[];
let pending=null;
let feedback="";
let feedbackUntil=0;
let controlsWired=false;
let hoverNear=null;
let openButton=null;
let phase="Day";
let nextMeow=9+Math.random()*9;
let lastMapFrame=-1;

function signal(name,detail) {
  document.dispatchEvent(new CustomEvent("studio:"+name,{detail}));
}

function near(point,distance=1.6) {
  return Math.hypot(point.x-state.position.x,point.z-state.position.z)<distance;
}
function nearTarget() {
  return available.filter((point)=>point.id!=="car"&&!state.collected.has(point.id)&&near(point))
    .sort((a,b)=>Math.hypot(a.x-state.position.x,a.z-state.position.z)-Math.hypot(b.x-state.position.x,b.z-state.position.z))[0] || null;
}
function worldStatus(text,duration=2350) {
  feedback=text;
  feedbackUntil=performance.now()+duration;
  updateHud();
}
function updateHud() {
  const count=state.collected.size;
  const nearby=hoverNear;
  progress.textContent=`${state.completed.size}/${activities.length} activities · ${projects.size}/${landmarks.length} stations · ${count}/${treats.length} treats`;
  const next=activities.find(({id})=>!state.completed.has(id));
  quest.textContent=state.challenge?.id==="chase"?"Catch the flying butterflies.":
    state.challenge?.id==="rally"?"Drive through the highlighted gate.":
      next?activityGoals[next.id]:"Miso explored every activity.";
  complete.hidden=!(state.completed.size===activities.length&&projects.size===landmarks.length);
  hint.textContent=performance.now()<feedbackUntil?feedback:
    touchLayout.matches?"Tap to move or use the direction buttons. Tap a label to interact.":
      "WASD or arrows to move · E to interact · F for the car · Space to hop";
  const activeStart=Boolean(nearby&&nearby.id===state.challenge?.id);
  action.disabled=!nearby||Boolean(state.activity)||activeStart;
  action.textContent=activeStart?"Challenge active":nearby?.verb||
    (nearby?.id.startsWith("treat")?"Pick up treat":nearby?"Open project":"Interact");
  updateCarButton();
}

function collect(point) {
  if (state.collected.has(point.id)) return;
  state.collected.add(point.id);
  worldStatus(state.collected.size===treats.length?"Miso found all three treats.":point.name+" collected.");
}

const activityMessages={
  food:"Miso munched the food.",
  milk:"Miso lapped up the milk.",
  fish:"Miso caught and ate a fish.",
  nap:"Miso woke up from a nap.",
  scratch:"Miso sharpened their claws.",
};
const activityGoals={
  food:"Eat at the food bowl.",milk:"Drink from the milk bowl.",fish:"Catch a fish at the pond.",
  chase:"Catch five butterflies in the orchard.",scratch:"Try the scratching post in the meadow.",
  nap:"Take a nap in the western grove.",rally:"Drive through all four rally gates.",
};
const activityStart={
  food:"Miso eats from the bowl…",milk:"Miso laps the milk…",fish:"Miso watches for a fish…",
  nap:"Miso curls up for a nap…",scratch:"Miso scratches the post…",
};

function beginChallenge(id) {
  if(fallback) {
    worldStatus("Timed challenges need the 3D world.");
    return;
  }
  if(id==="rally"&&!state.driving) {
    worldStatus("Bring the roadster here to start the rally.");
    return;
  }
  if(state.challenge?.id===id) {
    worldStatus("This round is already running.");
    return;
  }
  const duration=id==="rally"?32:27;
  state.challenge={id,duration,left:duration,caught:new Set(),next:0};
  challengePanel.hidden=false;
  worldStatus(id==="rally"?"Drive through the four gates in order.":"Run close to the butterflies to catch them.",3500);
  updateChallenge(0);
}

function finishChallenge(won) {
  const run=state.challenge;
  state.challenge=null;
  challengePanel.hidden=true;
  if(!won) {
    worldStatus("Time’s up. Return to the start for another try.",4000);
    return;
  }
  state.completed.add(run.id);
  const seconds=run.duration-run.left;
  bestRuns.set(run.id,Math.min(seconds,bestRuns.get(run.id)??Infinity));
  worldStatus(`${run.id==="rally"?"Rally complete":"Five butterflies caught"} in ${seconds.toFixed(1)}s. Best ${bestRuns.get(run.id).toFixed(1)}s.`,5200);
  signal("meow");
}

function targetPosition(point) {
  const index=butterflies.indexOf(point);
  return index<0?point:{...point,...butterflyPosition(index,state.worldSeconds,state.motion)};
}

function isChallengeTarget(point) {
  const run=state.challenge;
  if(run?.id==="rally")return point===rallyGates[run.next];
  return run?.id==="chase"&&butterflies.includes(point)&&!run.caught.has(point.id);
}

function updateChallenge(elapsed) {
  const run=state.challenge;
  if(!run)return;
  run.left-=elapsed;
  if(run.left<=0){
    finishChallenge(false);
    return;
  }
  if(run.id==="chase"&&!state.driving) {
    for(const insect of butterflies){
      if(run.caught.has(insect.id)||!near(targetPosition(insect),.99))continue;
      run.caught.add(insect.id);
      if(pending===insect){
        pending=null;
        route=[];
      }
    }
    if(run.caught.size===butterflies.length){
      finishChallenge(true);
      return;
    }
  }
  if(run.id==="rally"&&state.driving&&near(rallyGates[run.next],1.35)) {
    run.next++;
    if(run.next===rallyGates.length){
      finishChallenge(true);
      return;
    }
  }
  const label=run.id==="chase"?`Butterflies ${run.caught.size}/5`:`Rally gates ${run.next}/4`;
  const text=`${label} · ${Math.ceil(run.left)}s`;
  if(challengeReadout.textContent!==text)challengeReadout.textContent=text;
}

function guideToTarget() {
  const run=state.challenge;
  if(!run)return;
  const point=run.id==="rally"?rallyGates[run.next]:
    butterflies.filter(isChallengeTarget).sort((a,b)=>{
      const first=targetPosition(a),second=targetPosition(b);
      return Math.hypot(first.x-state.position.x,first.z-state.position.z)-Math.hypot(second.x-state.position.x,second.z-state.position.z);
    })[0];
  if(point)go(point);
}

function updateCarButton() {
  const canEnter=fallback||near(state.vehicle,2.65);
  carAction.disabled=(!state.driving&&!canEnter)||Boolean(state.activity);
  const label=state.driving?"Exit car":"Enter car";
  if(carAction.textContent!==label)carAction.textContent=label;
}

function toggleCar() {
  if(state.activity)return;
  if(!state.driving&&!fallback&&!near(state.vehicle,2.65)) {
    worldStatus("Get closer to the roadster to get in.");
    return;
  }
  pending=null;
  route=[];
  keys.clear();
  state.speed=0;
  state.moving=false;
  if(state.driving) {
    const {x,z,heading}=state.vehicle;
    const angles=[Math.PI/2,-Math.PI/2,Math.PI,0];
    const place=angles.map((angle)=>({x:x+Math.sin(heading+angle)*1.75,z:z+Math.cos(heading+angle)*1.75}))
      .find((candidate)=>walkable(candidate.x,candidate.z,false));
    state.driving=false;
    if(place)Object.assign(state.position,place);
    worldStatus("Miso hopped out of the roadster.");
  } else {
    state.driving=true;
    Object.assign(state.position,{x:state.vehicle.x,z:state.vehicle.z,heading:state.vehicle.heading});
    worldStatus(touchLayout.matches?"Miso is driving. Use the direction buttons or tap a destination.":"Miso is driving. Steer with WASD or arrows. Press F to hop out.",3200);
  }
}

function interact(point) {
  if(!point) return;
  if(state.activity) return;
  pending=null;
  route=[];
  keys.clear();
  if(point.id.startsWith("treat")) {
    collect(point);
    return;
  }
  if(point.id==="car") {
    toggleCar();
    return;
  }
  if(challengePoints.includes(point))return;
  if(point.id==="chase"||point.id==="rally") {
    if(point.id==="chase"&&state.driving) {
      worldStatus("Hop out of the car to chase butterflies.");
      return;
    }
    beginChallenge(point.id);
    return;
  }
  if(point.verb) {
    if(state.driving) {
      worldStatus(touchLayout.matches?"Exit the car first.":"Press F to hop out first.");
      return;
    }
    state.position.heading=Math.atan2(point.pinX-state.position.x,point.pinZ-state.position.z);
    state.speed=0;
    state.moving=false;
    if(fallback) finishActivity(point.id);
    else {
      state.activity={id:point.id,left:point.id==="nap"?3.6:point.id==="fish"||point.id==="scratch"?2.75:2.25};
      worldStatus(activityStart[point.id],4000);
    }
    return;
  }
  projects.add(point.id);
  updateHud();
  signal("project",point.id);
}

function finishActivity(id) {
  state.activity=null;
  state.completed.add(id);
  worldStatus(activityMessages[id],3000);
  signal("meow");
}

function walkable(x,z,driving=state.driving) {
  const margin=driving?.61:0;
  if (Math.abs(x)>worldBounds.x-margin||Math.abs(z)>worldBounds.z-margin) return false;
  if (((x-4.3)/(2.82+margin))**2+(z/(1.93+margin))**2<1) return false;
  if(Math.abs(x-nameSign.x)<nameSign.width/2+margin&&Math.abs(z-nameSign.z)<.56+margin)return false;
  return !landmarks.some((point)=>Math.abs(x-point.x)<3.02+margin&&z>point.z-5.15-margin&&z<point.z-2.48+margin);
}
function clearLine(from,to) {
  const distance=Math.hypot(from.x-to.x,from.z-to.z);
  const steps=Math.max(1,Math.ceil(distance/.34));
  for(let i=1;i<=steps;i++) {
    const t=i/steps;
    if(!walkable(from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t)) return false;
  }
  return true;
}
function pathTo(target) {
  const start=state.position;
  if (!walkable(target.x,target.z)) return [];
  if (clearLine(start,target)) return [target];
  const origin={x:Math.round(start.x),z:Math.round(start.z),previous:null};
  const queue=[origin];
  const seen=new Set([`${origin.x},${origin.z}`]);
  const steps=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let i=0;i<queue.length;i++) {
    const node=queue[i];
    if(Math.hypot(node.x-target.x,node.z-target.z)<1.5 && clearLine(node,target)) {
      const points=[target];
      for(let found=node;found.previous;found=found.previous) points.push(found);
      points.reverse();
      const waypoints=[];
      let anchor=start;
      for(let j=0;j<points.length;j++){
        if(!clearLine(anchor,points[j])&&j>0){
          anchor=points[j-1];
          waypoints.push(anchor);
        }
      }
      return [...waypoints,target];
    }
    for(const [dx,dz] of steps) {
      const x=node.x+dx,z=node.z+dz,id=`${x},${z}`;
      if(seen.has(id)||!walkable(x,z))continue;
      seen.add(id);
      queue.push({x,z,previous:node});
    }
  }
  return [];
}

function go(point) {
  if(state.activity)return;
  if(state.collected.has(point.id)) return;
  if(state.driving&&activities.includes(point)&&point.id!=="rally") {
    worldStatus(touchLayout.matches?"Exit the car first.":"Press F to hop out first.");
    return;
  }
  if(challengePoints.includes(point)&&!isChallengeTarget(point))return;
  if (point.id==="car"&&state.driving) {
    toggleCar();
    return;
  }
  if (fallback||near(point,point.id==="car"?2.65:.8)) {
    if (point.id) interact(point);
    return;
  }
  keys.clear();
  route=pathTo(targetPosition(point));
  pending=route.length&&point.id?point:null;
}

function move(dx,dz,dt) {
  const speed=state.driving?Math.max(8,state.speed):7.4;
  const x=state.position.x+dx*speed*dt;
  const z=state.position.z+dz*speed*dt;
  if(walkable(x,state.position.z)) state.position.x=x;
  if(walkable(state.position.x,z)) state.position.z=z;
  state.position.heading=Math.atan2(dx,dz);
  if(state.driving)Object.assign(state.vehicle,{x:state.position.x,z:state.position.z,heading:state.position.heading});
}

function steer(dt) {
  if(state.activity)return;
  const horizontal=Number(keys.has("right"))-Number(keys.has("left"));
  const vertical=Number(keys.has("up"))-Number(keys.has("down"));
  if(horizontal||vertical) {
    route=[];
    pending=null;
    const vector=scene.moveVector(horizontal,vertical);
    const magnitude=Math.hypot(vector.x,vector.z);
    state.moving=true;
    if(state.driving)state.speed=Math.min(16,state.speed+dt*24);
    move(vector.x/magnitude,vector.z/magnitude,dt);
  } else if(route.length) {
    state.moving=true;
    const point=route.length===1&&butterflies.includes(pending)?targetPosition(pending):route[0];
    const dx=point.x-state.position.x,dz=point.z-state.position.z;
    const distance=Math.hypot(dx,dz);
    if(distance<.23) route.shift();
    else {
      if(state.driving)state.speed=Math.min(14,state.speed+dt*20);
      move(dx/distance,dz/distance,Math.min(dt,distance/(state.driving?Math.max(8,state.speed):7.4)));
    }
    if(!route.length&&pending) interact(pending);
  } else {
    state.moving=false;
    state.speed=0;
  }
  for(const treat of treats) if(near(treat,.74)) collect(treat);
  const next=nearTarget();
  if(next!==hoverNear) {
    hoverNear=next;
    updateHud();
  }
  updateCarButton();
}

const buttons=new Map();
function drawPins() {
  for(const point of [...available,...challengePoints]) {
    const button=buttons.get(point.id);
    const target=targetPosition(point);
    const screen=scene.project(target.pinX??target.x,target.height??(target.y?target.y+.37:1.6),target.pinZ??target.z);
    const out=screen.x<12||screen.y<48||screen.x>viewport.clientWidth-12||screen.y>viewport.clientHeight-68;
    button.hidden=out||state.collected.has(point.id)||(point.id==="car"&&state.driving)||
      (challengePoints.includes(point)&&!isChallengeTarget(point));
    if(!button.hidden) {
      button.style.left=screen.x+"px";
      button.style.top=screen.y+"px";
      button.classList.toggle("near",hoverNear===point);
    }
  }
  const meowing=state.worldSeconds<state.meowUntil;
  meowBubble.hidden=!meowing;
  if(meowing){
    const screen=scene.project(state.position.x,state.driving?3:2.65,state.position.z);
    meowBubble.style.left=screen.x+"px";
    meowBubble.style.top=screen.y+"px";
  }
}

function mapCoordinates(x,z) {
  return [13+(x+worldBounds.x)/(2*worldBounds.x)*(mapCanvas.width-26),
    13+(z+worldBounds.z)/(2*worldBounds.z)*(mapCanvas.height-26)];
}
function drawMap() {
  if(!mapPaint||lastMapFrame===Math.floor(state.worldSeconds*8))return;
  lastMapFrame=Math.floor(state.worldSeconds*8);
  const ctx=mapPaint;
  const {width,height}=mapCanvas;
  ctx.fillStyle="#292e24";
  ctx.fillRect(0,0,width,height);
  ctx.fillStyle="#5f694d";
  ctx.fillRect(10,10,width-20,height-20);
  ctx.fillStyle="#485d45";
  ctx.fillRect(11,11,width*.22,height-22);
  ctx.fillStyle="#726f4e";
  ctx.fillRect(width*.78,11,width*.22-11,height-22);
  ctx.strokeStyle="#c0a986";
  ctx.lineWidth=3;
  for(const path of [
    [[-23,7.4],[-11,8.9],[18.6,9],[24.8,8.8],[26,-1],[24,-13.3],[13.8,-17.4],[0,-17.4],[0,9]],
    [[-26,-10],[-22,-5.5],[-15.5,0],[-11,0],[-11,8.9]], [[-11,-6],[20.7,-7]], [[10,-8],[10,9]],
    [[-23,7.4],[-16,16],[-4,17],[12,16],[19.4,16.1],[18.6,9]],
  ]){
    ctx.beginPath();
    path.forEach(([x,z],index)=>{
      const p=mapCoordinates(x,z);
      if(index)ctx.lineTo(...p);
      else ctx.moveTo(...p);
    });
    ctx.stroke();
  }
  function dot(x,z,radius,color) {
    ctx.beginPath();
    ctx.arc(...mapCoordinates(x,z),radius,0,Math.PI*2);
    ctx.fillStyle=color;
    ctx.fill();
  }
  dot(4.3,0,6,"#78ada3");
  landmarks.forEach(({x,z})=>dot(x,z,3,"#fddeab"));
  playSpots.forEach(({x,z})=>dot(x,z,3.7,"#f6af6b"));
  dot(state.vehicle.x,state.vehicle.z,3.2,"#83bbb2");
  for(const point of challengePoints.filter(isChallengeTarget)) {
    const {x,z}=targetPosition(point);
    dot(x,z,3.1,"#ffe28b");
  }
  dot(state.position.x,state.position.z,5.3,"#252821");
  dot(state.position.x,state.position.z,3.3,"#fff8e3");
  ctx.font="bold 11px system-ui";
  ctx.fillStyle="#f7e9ce";
  ctx.fillText("Orchard",18,26);
  ctx.fillText("Meadow",width-62,26);
}

function startFrame(now) {
  if(!world.open||!scene) return;
  const elapsed=lastFrame?(now-lastFrame)/1000:.016;
  const dt=Math.min(elapsed,.045);
  state.worldSeconds+=Math.max(0,elapsed);
  const nextPhase=skyAt(state.worldSeconds).label;
  if(nextPhase!==phase) {
    phase=nextPhase;
    skyStatus.textContent=phase;
  }
  lastFrame=now;
  const overlay=Boolean(document.querySelector("#project-dialog[open],#miso-dialog[open]"));
  if(!overlay) {
    let remaining=Math.min(elapsed,.14);
    while(remaining>0){
      const slice=Math.min(remaining,.034);
      steer(slice);
      remaining-=slice;
    }
    updateChallenge(Math.min(elapsed,.5));
    if(state.worldSeconds>=nextMeow&&!state.activity) {
      nextMeow=state.worldSeconds+14+Math.random()*16;
      state.meowUntil=state.worldSeconds+1.25;
      signal("meow","ambient");
    }
  }
  else {
    keys.clear();
    state.moving=false;
  }
  state.jump=Math.max(0,state.jump-elapsed);
  if(state.activity) {
    state.activity.left-=Math.min(elapsed,.17);
    if(state.activity.left<=0)finishActivity(state.activity.id);
  }
  scene.step(state,dt,now/1000);
  drawPins();
  if(!mapMenu.hidden)drawMap();
  if(feedbackUntil&&performance.now()>=feedbackUntil) {
    feedbackUntil=0;
    updateHud();
  }
  frame=requestAnimationFrame(startFrame);
}

function setupFallback() {
  fallback=true;
  loadNotice.hidden=true;
  viewport.hidden=true;
  pins.hidden=true;
  document.querySelector(".world-controller").hidden=true;
  const fallbackMenu=document.getElementById("world-fallback");
  fallbackMenu.hidden=false;
  const list=fallbackMenu.querySelector(".world-fallback-actions");
  for(const item of available) {
    const button=document.createElement("button");
    button.type="button";
    button.className="world-button";
    button.textContent=item.name;
    button.addEventListener("click",()=>{
      interact(item);
      button.disabled=state.collected.has(item.id);
    });
    list.append(button);
  }
  updateHud();
}

function bindScene() {
  for(const point of [...available,...challengePoints]) {
    const button=document.createElement("button");
    button.type="button";
    button.className="world-pin"+(point.id.startsWith("treat")?" treat":challengePoints.includes(point)?" challenge-pin":"");
    button.textContent=point.id.startsWith("treat")?"Treat":point.name;
    button.setAttribute("aria-label",point.name);
    button.dataset.worldPoint=point.id;
    button.addEventListener("click",()=>go(point));
    buttons.set(point.id,button);
    pins.append(button);
  }
  const canvas=scene.canvas;
  const updatePointer=(event)=>{
    if(event.pointerType==="touch") return;
    const rect=canvas.getBoundingClientRect();
    state.pointer.x=(event.clientX-rect.left)/rect.width*2-1;
    state.pointer.y=1-(event.clientY-rect.top)/rect.height*2;
    state.pointer.active=true;
  };
  canvas.addEventListener("pointermove",updatePointer);
  canvas.addEventListener("pointerleave",()=>{state.pointer.active=false;});
  canvas.addEventListener("pointerdown",(event)=>{
    if(event.button!==0) return;
    viewport.focus({preventScroll:true});
    const rect=canvas.getBoundingClientRect();
    const x=event.clientX-rect.left,y=event.clientY-rect.top;
    const cat=scene.project(state.position.x,state.driving?2.2:1.4,state.position.z);
    if(!state.driving&&!state.moving&&!state.activity&&Math.hypot(cat.x-x,cat.y-y)<Math.max(20,rect.height*.036)) {
      signal("miso");
      return;
    }
    const point=scene.worldPoint(x/rect.width*2-1,1-y/rect.height*2);
    if(point) go(point);
  });
  new ResizeObserver(()=>{if(world.open)scene.resize();}).observe(viewport);
}

function bindControls() {
  controlsWired=true;
  function showMap(open) {
    mapMenu.hidden=!open;
    mapButton.setAttribute("aria-expanded",String(open));
    if(open){
      lastMapFrame=-1;
      drawMap();
    }
  }
  mapButton.addEventListener("click",()=>showMap(mapMenu.hidden));
  mapCanvas.addEventListener("click",(event)=>{
    if(!scene)return;
    const rect=mapCanvas.getBoundingClientRect();
    const px=(event.clientX-rect.left)/rect.width*mapCanvas.width;
    const py=(event.clientY-rect.top)/rect.height*mapCanvas.height;
    const x=(px-13)/(mapCanvas.width-26)*worldBounds.x*2-worldBounds.x;
    const z=(py-13)/(mapCanvas.height-26)*worldBounds.z*2-worldBounds.z;
    showMap(false);
    viewport.focus({preventScroll:true});
    go({x,z});
  });
  const list=mapMenu.querySelector(".world-map-list");
  for(const point of [...landmarks,...activities,state.vehicle]) {
    const button=document.createElement("button");
    button.type="button";
    button.className="world-button";
    button.textContent=point.name;
    button.addEventListener("click",()=>{
      showMap(false);
      mapButton.focus();
      go(point);
    });
    list.append(button);
  }
  const ask=document.createElement("button");
  ask.type="button";
  ask.className="world-button";
  ask.textContent="Ask Miso";
  ask.addEventListener("click",()=>{
    showMap(false);
    mapButton.focus();
    signal("miso");
  });
  list.append(ask);
  challengeGuide.addEventListener("click",guideToTarget);
  document.getElementById("challenge-stop").addEventListener("click",()=>{
    state.challenge=null;
    challengePanel.hidden=true;
    route=[];
    pending=null;
    worldStatus("Challenge stopped.");
  });
  const blocked=()=>Boolean(document.querySelector("#project-dialog[open],#miso-dialog[open]"));
  world.addEventListener("keydown",(event)=>{
    if (blocked()) return;
    const key=event.key.toLowerCase();
    const direction=directionFor[event.key.length===1?key:event.key];
    if(direction&&scene) {
      event.preventDefault();
      keys.add(direction);
    } else if(key==="e"&&!event.repeat&&hoverNear) {
      event.preventDefault();
      interact(hoverNear);
    } else if(key==="f"&&!event.repeat) {
      event.preventDefault();
      toggleCar();
    } else if(key===" "&&scene&&!state.driving&&!state.activity&&!event.repeat&&event.target.tagName!=="BUTTON") {
      event.preventDefault();
      state.jump=.51;
    }
  });
  window.addEventListener("keyup",(event)=>{
    keys.delete(directionFor[event.key.length===1?event.key.toLowerCase():event.key]);
  });
  window.addEventListener("blur",()=>keys.clear());
  action.addEventListener("click",()=>interact(hoverNear));
  carAction.addEventListener("click",toggleCar);
  document.querySelectorAll("[data-world-move]").forEach((button)=>{
    const direction=button.dataset.worldMove;
    function nudge() {
      if(!scene||state.activity)return;
      const vector=scene.moveVector(Number(direction==="right")-Number(direction==="left"),Number(direction==="up")-Number(direction==="down"));
      route=[];
      pending=null;
      move(vector.x,vector.z,.065);
    }
    button.addEventListener("pointerdown",(event)=>{
      button.setPointerCapture(event.pointerId);
      keys.add(direction);
      nudge();
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"]) {
      button.addEventListener(type,()=>keys.delete(direction));
    }
    button.addEventListener("click",(event)=>{
      if(event.detail===0)nudge();
    });
  });
}

function start(event) {
  if(world.open) return;
  openButton=event.currentTarget;
  world.showModal();
  updateHud();
  if(!controlsWired) bindControls();
  if(!scene&&!fallback) {
    try {
      scene=createScene(viewport);
      bindScene();
      loadNotice.hidden=true;
    } catch(error) {
      console.warn("3D studio unavailable",error);
      setupFallback();
    }
  }
  if(scene) {
    scene.resize();
    viewport.focus({preventScroll:true});
    lastFrame=0;
    frame=requestAnimationFrame(startFrame);
  }
}

document.querySelectorAll("[data-open-world]").forEach((button)=>{
  button.addEventListener("click",start);
  button.disabled=false;
});
world.addEventListener("close",()=>{
  cancelAnimationFrame(frame);
  keys.clear();
  route=[];
  pending=null;
  state.pointer.active=false;
  mapMenu.hidden=true;
  mapButton.setAttribute("aria-expanded","false");
  openButton?.focus({preventScroll:true});
});
reducedMotion.addEventListener("change",()=>{state.motion=!reducedMotion.matches;});
