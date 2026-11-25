import * as THREE from "./three.module.min.js";

export const landmarks = [
  { id:"solvex", name:"SolveX Lab", x:-11, z:-8, pinX:-11, pinZ:-10, height:4.7 },
  { id:"stylesearch", name:"StyleSearch Market", x:10, z:-8, pinX:10, pinZ:-10, height:4.7 },
  { id:"polishcv", name:"PolishCV Press", x:-11, z:7, pinX:-11, pinZ:5, height:4.8 },
  { id:"foundersync", name:"FounderSync Lookout", x:10, z:7, pinX:10, pinZ:5, height:4.6 },
];
export const treats = [
  { id:"treat-1", name:"Treat by the pond", x:3.5, z:3.9 },
  { id:"treat-2", name:"Treat by the lab", x:-6, z:-5.5 },
  { id:"treat-3", name:"Treat by the market", x:6.1, z:-5 },
];
export const careStations = [
  {id:"food",name:"Food bowl",verb:"Eat food",x:-4.65,z:5.8,pinX:-4.65,pinZ:4.57,height:1.1},
  {id:"milk",name:"Milk bowl",verb:"Drink milk",x:-2.1,z:5.8,pinX:-2.1,pinZ:4.57,height:1.1},
  {id:"fish",name:"Fish pond",verb:"Catch a fish",x:4.35,z:2.5,pinX:4.35,pinZ:.9,height:1.2},
];
export const carSpot={id:"car",name:"Roadster",verb:"Enter roadster",x:6.7,z:8.9,heading:Math.PI/2,height:2.05};
export const nameSign={x:-2.1,z:10.85,width:11.52};
export const worldBounds={x:30.5,z:22.5};
export const playSpots=[
  {id:"chase",name:"Butterfly Orchard",verb:"Start butterfly chase",x:-22,z:-5.5,height:2.25},
  {id:"scratch",name:"Scratching Post",verb:"Scratch the post",x:20.7,z:-7,pinX:21.5,pinZ:-7,height:2.7},
  {id:"nap",name:"Nap Nook",verb:"Take a nap",x:-23.2,z:7.4,pinX:-23.2,pinZ:6.2,height:2.05},
  {id:"rally",name:"Roadster Rally",verb:"Start roadster rally",x:18.6,z:9,height:2.8},
];
export const butterflies=[
  {id:"fly-1",name:"Amber butterfly",x:-25.8,z:-6.2,color:0xe6a54e},
  {id:"fly-2",name:"Pink butterfly",x:-23.5,z:-10.2,color:0xdb8e9d},
  {id:"fly-3",name:"Blue butterfly",x:-19.5,z:-9.4,color:0x88bdd4},
  {id:"fly-4",name:"Cream butterfly",x:-18.8,z:-3.8,color:0xf6dda6},
  {id:"fly-5",name:"Copper butterfly",x:-24.6,z:-1.4,color:0xc7755c},
];
export const rallyGates=[
  {id:"gate-1",name:"Gate 1",x:24.8,z:8.8,height:3.45,heading:Math.PI/2},
  {id:"gate-2",name:"Gate 2",x:26,z:-1,height:3.45,heading:0},
  {id:"gate-3",name:"Gate 3",x:24,z:-13.3,height:3.45,heading:0},
  {id:"gate-4",name:"Gate 4",x:13.8,z:-17.4,height:3.45,heading:Math.PI/2},
];

export function butterflyPosition(index,seconds,motion=true) {
  const {x,z}=butterflies[index];
  const t=motion?seconds:0;
  const angle=t*.94+index*1.8;
  return {x:x+Math.cos(angle)*.7,z:z+Math.sin(angle)*.65,y:1.05+Math.sin(angle*1.37)*.22};
}
export function skyAt(seconds) {
  const t=seconds%150;
  if(t<54) return {night:0,label:"Day"};
  if(t<74) return {night:(t-54)/20,label:"Dusk"};
  if(t<130) return {night:1,label:"Night"};
  return {night:1-(t-130)/20,label:"Dawn"};
}
const boxShape = new THREE.BoxGeometry(1,1,1);
const ballShape = new THREE.SphereGeometry(1,16,12);
const coneShape = new THREE.ConeGeometry(1,1,5);
const cylinderShape = new THREE.CylinderGeometry(1,1,1,20);
const rockShape = new THREE.IcosahedronGeometry(1,0);
const materials = new Map();

function material(color) {
  if (!materials.has(color)) materials.set(color,new THREE.MeshLambertMaterial({color}));
  return materials.get(color);
}

function mesh(parent,geometry,color,x,y,z,sx,sy,sz) {
  const piece = new THREE.Mesh(geometry,material(color));
  piece.scale.set(sx,sy,sz);
  piece.position.set(x,y,z);
  parent.add(piece);
  return piece;
}
const box = (p,c,x,y,z,w,h,d) => mesh(p,boxShape,c,x,y,z,w,h,d);
const ball = (p,c,x,y,z,w,h,d) => mesh(p,ballShape,c,x,y,z,w,h,d);
const cylinder = (p,c,x,y,z,w,h,d = w) => mesh(p,cylinderShape,c,x,y,z,w,h,d);

function group(parent,x,y,z) {
  const g = new THREE.Group();
  g.position.set(x,y,z);
  parent.add(g);
  return g;
}
function shadow(parent,x,z,w,d,y=.021) {
  const obj = cylinder(parent,0x4f5a42,x,y,z,w,.026,d);
  obj.material = new THREE.MeshBasicMaterial({color:0x273123,transparent:true,opacity:.25,depthWrite:false});
  return obj;
}
function tube(parent,points,radius,color) {
  const path = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const obj = new THREE.Mesh(new THREE.TubeGeometry(path,15,radius,6,false),material(color));
  parent.add(obj);
  return obj;
}

function sign(parent,text,x,y,z,color) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#292822";
  ctx.fillRect(0,0,768,160);
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.strokeRect(11,11,746,138);
  ctx.font = "bold 70px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe4ba";
  ctx.fillText(text,384,83,680);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.8,.79),new THREE.MeshBasicMaterial({map:texture}));
  panel.position.set(x,y,z);
  parent.add(panel);
}

function building(parent,station,kind) {
  const g = group(parent,station.x,0,station.z-2.6);
  const palette = [
    {wall:0xb4b889, trim:0x405d50, roof:0x4c6e5b, sign:"#a4c59c", text:"SolveX Lab"},
    {wall:0xe2b386, trim:0x7a5145, roof:0xa45e4f, sign:"#e6aa83", text:"StyleSearch Market"},
    {wall:0xe2c98e, trim:0x836549, roof:0x865f3f, sign:"#e1c388", text:"PolishCV Press"},
    {wall:0xb1ac8e, trim:0x61584c, roof:0x6f6550, sign:"#c4aa7d", text:"FounderSync Lookout"},
  ][kind];
  shadow(g,.42,.4,4.5,2.95);
  box(g,0x92866c,0,.11,0,6.65,.22,5.25);
  box(g,palette.wall,0,1.65,-1.12,5.55,3.05,2.52);
  box(g,palette.trim,0,.38,-1.05,5.58,.34,2.68);
  box(g,palette.trim,-2.62,1.56,.19,.18,2.8,.15);
  box(g,palette.trim,2.62,1.56,.19,.18,2.8,.15);
  const windowColor = kind === 0 ? 0x7db296 : 0xe4af76;
  for (const x of [-1.72,1.72]) {
    box(g,palette.trim,x,1.8,.18,1.13,1.22,.16);
    box(g,windowColor,x,1.8,.28,.92,1,.05);
    box(g,palette.trim,x,1.8,.32,.06,1,.045);
    box(g,palette.trim,x,1.8,.32,.93,.055,.045);
  }
  box(g,palette.trim,0,1.24,.19,1.26,1.99,.22);
  box(g,0x342e26,0,1.22,.32,1.03,1.79,.05);
  ball(g,0xf0c686,.35,1.18,.4,.058,.058,.05);
  box(g,palette.roof,0,3.35,-.94,6.1,.34,3.3);
  box(g,palette.trim,0,3.52,-.95,5.95,.2,3.16);
  for (let i=0;i<6;i++) box(g,palette.wall,-2.35+i*.94,3.12,.72,.95,.18,.12);
  sign(g,palette.text,0,2.77,.89,palette.sign);
  for (const x of [-2.57,2.57]) {
    cylinder(g,0x80654a,x,.41,1.28,.28,.43);
    ball(g,0x73805c,x,.82,1.28,.34,.51,.35);
  }
  if (kind === 0) {
    box(g,0x577769,2.03,3.84,-1.5,.58,.5,.57);
    box(g,0xc3ceaa,2.03,4.17,-1.5,.15,.67,.15);
    ball(g,0xe0cd86,2.03,4.54,-1.5,.12,.12,.12);
    for (let i=0;i<3;i++) {
      box(g,0x566653,-1.52+i*.58,.43,1.3,.47,.49,.38);
      box(g,0xaac68a,-1.52+i*.58,.56,1.5,.28,.12,.04);
    }
  } else if (kind === 1) {
    for(let i=0;i<9;i++) {
      const canopy = box(g,i%2 ? 0xd9ae82 : 0xa85c50,-2.4+i*.6,2.31,1.05,.605,.09,1.48);
      canopy.rotation.x = .19;
    }
    for (let i=0;i<4;i++) {
      const crate = box(g,[0xc98564,0xa4ae86,0xe7b07c,0x9a7768][i],-1.67+i*.7,.46,1.36,.53,.47,.52);
      crate.rotation.y = i*.13;
    }
  } else if (kind === 2) {
    const press = box(g,0x645b48,-1.58,.7,1.35,1.02,.96,.59);
    press.rotation.y=.16;
    for (let i=0;i<4;i++) box(g,0xdfcc9a,-1.59,.28+i*.06,1.7,.54,.025,.3);
    box(g,0xc49461,1.38,.51,1.38,.64,.55,.66);
    box(g,0xe0b970,1.38,.79,1.38,.7,.08,.7);
  } else {
    const tower=group(g,1.78,3.63,-1.42);
    for(const x of [-.67,.67])for(const z of [-.52,.52])box(tower,palette.trim,x,.72,z,.16,1.5,.16);
    box(tower,palette.wall,0,.21,0,1.53,.23,1.19);
    box(tower,palette.roof,0,1.56,0,1.72,.26,1.39);
    box(tower,0xd1ba90,0,.52,.61,1.2,.08,.11);
    cylinder(g,0x7b674b,-1.52,.82,1.4,.74,1.17);
    cylinder(g,0xc89963,-1.52,1.45,1.4,.92,.13);
    box(g,0xd3ae82,-1.52,1.54,1.36,.55,.05,.28);
    for (let i=0;i<3;i++) box(g,0x6c6652,1.43,.48+i*.16,1.55,.72,.16,.58);
  }
}

function tree(scene,x,z,hue,size=1) {
  const g=group(scene,x,0,z);
  g.scale.setScalar(size);
  shadow(g,.5,.25,1.15,.63);
  cylinder(g,0x695142,0,.79,0,.23,1.6);
  const tones = hue ? [0xad824c,0xc99b55,0xa8794a] : [0x5e7657,0x74865b,0x809367];
  for (const [i,px,y,pz,sx,sy] of [[0,0,2,0,.98,1.03],[1,-.37,2.45,.17,.73,.9],[2,.34,2.47,-.22,.69,.83]]) {
    const crown=mesh(g,rockShape,tones[i],px,y,pz,sx,sy,.86);
    crown.rotation.y=x*.31+z*.18;
  }
}

function blockLetters(scene) {
  const glyphs={
    A:["01110","11011","11011","11111","11011","11011","11011"],
    D:["11110","11011","11011","11011","11011","11011","11110"],
    R:["11110","11011","11011","11110","11100","11010","11011"],
    S:["01111","11000","11000","01110","00011","00011","11110"],
    H:["11011","11011","11011","11111","11011","11011","11011"],
  };
  const unit=.32;
  const sign=group(scene,nameSign.x,.13,nameSign.z);
  box(sign,0x75624e,0,-.045,0,nameSign.width+.34,.16,1.16);
  const face=material(0xf9dfb6);
  const depth=material(0xc58157);
  const blocks=[];
  [..."ADARSH"].forEach((letter,index)=>{
    glyphs[letter].forEach((row,y)=>{
      for(const run of row.matchAll(/1+/g))blocks.push([index*6+run.index+run[0].length/2,6-y,run[0].length]);
    });
  });
  const text=new THREE.InstancedMesh(boxShape,[depth,depth,face,depth,face,depth],blocks.length);
  const transform=new THREE.Object3D();
  for(const [index,[x,y,w]] of blocks.entries()){
    transform.position.set((x-17.5)*unit,(y+.5)*unit,0);
    transform.scale.set(w*unit,unit+.001,.6);
    transform.updateMatrix();
    text.setMatrixAt(index,transform.matrix);
  }
  sign.add(text);
}

function trail(parent,points,width,color) {
  for(let i=1;i<points.length;i++){
    const [x,z]=points[i-1], [nx,nz]=points[i];
    const dx=nx-x,dz=nz-z;
    const segment=box(parent,color,(x+nx)/2,.066+i*.0007,(z+nz)/2,width,.027,Math.hypot(dx,dz)+width*.55);
    segment.rotation.y=Math.atan2(dx,dz);
  }
}

function makeOutskirts(scene) {
  const road=[[8.65,8.9],[18.6,9],[24.8,8.8],[26,-1],[24,-13.3],[13.8,-17.4],[.1,-17.4],[.1,-6]];
  trail(scene,road,3.02,0xbba387);
  trail(scene,[[-11.2,.65],[-17,.35],[-22,-5.5],[-26,-10.5]],2.2,0xb4a075);
  trail(scene,[[-11.2,8.9],[-18.4,8.9],[-23.2,7.4],[-25.3,1]],2,0xb4a075);
  trail(scene,[[10.3,-5.9],[15.5,-5.9],[20.7,-7],[25.5,-7]],2.1,0xc4ad84);
  trail(scene,[[18.6,9],[19.4,16.1],[7,16.1],[-4,17.2],[-14,16],[-18.4,8.9]],2.7,0xc4ad84);
  const orchardTrees=[[-27,-12],[-21,-13],[-17,-11],[-28,-7],[-27,-1],[-19,-1.5],[-25,4],[-27,9],[-27,15],[-19,15]];
  const meadowTrees=[[16,-18],[21,-18.1],[29,-12],[29,-5],[30,1],[22,1],[21,4],[28,15],[21,19],[14,20],[6,20],[-4,21],[-12,20],[-21,20],[-7,-19],[-13,-20],[1,-21]];
  orchardTrees.forEach(([x,z],i)=>tree(scene,x,z,true,.84+i%3*.12));
  meadowTrees.forEach(([x,z],i)=>tree(scene,x,z,i%4===0,.76+i%5*.1));
  const petalColors=[0xe5aa64,0xead492,0xc18a7c,0x9fa874];
  for(let i=0;i<52;i++){
    const x=(i%2?20:-22)+Math.sin(i*19.17)*5.5;
    const z=Math.cos(i*11.65)*13.4;
    const flower=mesh(scene,rockShape,petalColors[i%4],x,.16,z,.105,.12,.105);
    flower.rotation.y=i;
  }
  const [chase,scratch,nap,rally]=playSpots;
  function waypost(spot,title,color,dx){
    const g=group(scene,spot.x+dx,0,spot.z-.6);
    cylinder(g,0x755944,0,.91,0,.11,1.82);
    sign(g,title,0,1.57,.11,color);
  }
  waypost(chase,"Butterfly Orchard","#d6bd82",-1.65);
  waypost(rally,"Roadster Rally","#edc188",-1.1);
  const post=group(scene,scratch.pinX,0,scratch.pinZ);
  shadow(post,.08,.04,.82,.64);
  box(post,0x826349,0,.11,0,1.44,.22,1.3);
  cylinder(post,0x9a6949,0,1.03,0,.33,1.85);
  for(let i=0;i<8;i++)cylinder(post,i%2?0xbf9665:0xba8a58,0,.44+i*.14,0,.35,.125);
  ball(post,0xe1b67e,0,2.02,0,.41,.18,.41);
  const nook=group(scene,nap.pinX,0,nap.pinZ);
  shadow(nook,.17,0,1.6,.96);
  box(nook,0x987259,0,.12,0,2.85,.24,1.62);
  box(nook,0xa96e57,0,.3,0,2.52,.18,1.47);
  box(nook,0xdeaf83,0,.406,0,2.4,.06,1.34);
  const pillow=ball(nook,0x879780,-.66,.48,-.02,.55,.21,.53);
  pillow.rotation.y=.25;
  for(const x of [-1.7,1.7]){
    cylinder(nook,0x79634a,x,.33,-.5,.11,.66);
    box(nook,0x9b634a,x,.69,-.5,.29,.25,.29);
  }
  const gates=rallyGates.map((gate,i)=>{
    const g=group(scene,gate.x,0,gate.z);
    g.rotation.y=gate.heading;
    for(const x of [-1.57,1.57]){
      box(g,0x8c6951,x,1.15,0,.22,2.28,.31);
      for(let j=0;j<4;j++)box(g,j%2?0xd8b88b:0xb97957,x,.38+j*.48,.02,.24,.26,.33);
    }
    box(g,0x77553f,0,2.35,0,3.49,.22,.37);
    const flag=box(g,0xe3b072,0,2.37,.02,2.18,.39,.39);
    sign(g,"GATE "+(i+1),0,2.38,.234,"#e9c895");
    return flag;
  });
  const wingsShape=new THREE.SphereGeometry(1,9,6);
  const insects=butterflies.map(({color})=>{
    const g=group(scene,0,1,0);
    const wings=[-1,1].map(side=>{
      const root=group(g,0,0,0);
      mesh(root,wingsShape,color,side*.19,.02,0,.23,.045,.28);
      mesh(root,wingsShape,0x493a2f,side*.139,.001,.171,.11,.034,.12);
      return root;
    });
    ball(g,0x48392e,0,0,0,.033,.04,.25);
    return {g,wings};
  });
  return {gates,insects};
}

function scenery(scene) {
  box(scene,0x715d47,0,-1.2,0,64,2.1,48);
  box(scene,0x929364,0,-.12,0,64,.24,48);
  box(scene,0x849065,-24.5,.003,-.3,13.8,.007,32);
  box(scene,0xa0996d,24.5,.003,.55,13.8,.007,34);
  const outskirts=makeOutskirts(scene);
  const pathSections = [
    [0,8.8,23,2.45],[-.2,-5.9,23,2.5],[.05,.9,2.5,16.2],[-11.2,.55,2.6,13.5],[10.3,.55,2.65,13.5],
  ];
  for (const [x,z,w,d] of pathSections) {
    box(scene,0x968366,x,.012,z,w,.024,d);
    box(scene,0xc4aa80,x,.035,z,w-.16,.025,d-.16);
  }
  const seed = (value) => (Math.sin(value*127.1)*43758.5453)%1;
  for (let i=0;i<72;i++) {
    const x = seed(i+.4)*17;
    const z = seed(i+7.4)*13.8;
    if (pathSections.some(([px,pz,w,d]) => Math.abs(x-px)<w/2 && Math.abs(z-pz)<d/2) || Math.hypot(x+3,z-3.5)<3.2) continue;
    const tuft = mesh(scene,rockShape,i%5 === 0 ? 0xbfa873 : 0x7e875b,x,.095,z,.12,.13,.17);
    tuft.rotation.y=i;
  }
  const treeSpots=[[-16,-12],[-12,-13],[-5,-12],[3,-12],[9,-13],[15,-12],[16,-6],[16,1],[16,10],[12,12],[8.3,13],[-10.9,13],[-13.5,13],[-16,11.5],[-17,5],[-17,-3],[-7,0],[9,0],[-6,5],[-1,-10],[4,-9]];
  treeSpots.forEach(([x,z],i)=>tree(scene,x,z,i%3===0,.77+(i%5)*.09));
  const pond = group(scene,4.3,0,0);
  cylinder(pond,0x9b957b,0,.06,0,2.75,.22,2.05);
  cylinder(pond,0x577f77,0,.18,0,2.47,.04,1.8);
  for (let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    mesh(pond,rockShape,0xbbad8e,Math.sin(a)*2.31,.26,Math.cos(a)*1.64,.47,.23,.39);
  }
  for(let i=0;i<4;i++) {
    cylinder(pond,0x779b73,-1+i*.5,.22,Math.sin(i)*.55,.28,.035);
  }
  const fish=[0xcb814e,0xebc582,0xb56f60].map(()=>group(pond,0,.25,0));
  fish.forEach((swimmer,i)=>makeFish(swimmer,[0xcb814e,0xebc582,0xb56f60][i],false));
  const lamps=[];
  const warmBulb=new THREE.MeshBasicMaterial({color:0xf9cf8e});
  for (const [x,z] of [[-9,-5],[8,-5],[-9,8],[7,8],[-.3,-6],[-.3,8.6]]) {
    cylinder(scene,0x625641,x,.65,z,.08,1.3);
    box(scene,0x655843,x,1.33,z,.27,.28,.27);
    box(scene,0xf9cf8e,x,1.34,z+.14,.19,.18,.02).material=warmBulb;
    mesh(scene,coneShape,0x665742,x,1.55,z,.23,.18,.23);
    const glow=cylinder(scene,0xffb968,x,.051,z,1.38,.009);
    glow.material=new THREE.MeshBasicMaterial({color:0xffa44e,transparent:true,opacity:0,depthWrite:false});
    lamps.push(glow);
  }
  for(let i=0;i<13;i++){
    const a=(i/13)*Math.PI*2;
    const hill=mesh(scene,rockShape,i%2 ? 0x819074 : 0x6f836f,Math.cos(a)*48,-3,Math.sin(a)*39,5+i%4,3+i%3,4+i%4);
    hill.rotation.y=a;
  }
  blockLetters(scene);
  return {fish,lamps,...outskirts};
}

function makeCat(scene) {
  const g=group(scene,0,0,0);
  const groundShadow=shadow(g,.15,0,.93,1.04);
  const cat=group(g,0,0,0);
  const fur=0x353a36, face=0x454842, pale=0x555750, inside=0xa8776b;
  ball(cat,fur,0,.62,-.28,.56,.45,.9);
  ball(cat,pale,0,.73,.25,.49,.43,.5);
  const paws=[];
  for(const z of [-.79,.49])for(const x of [-.37,.37]){
    const paw=group(cat,x,.57,z);
    ball(paw,fur,0,-.23,0,.165,.27,.17);
    ball(paw,face,0,-.46,.09,.185,.115,.238);
    paws.push(paw);
  }
  const tail=group(cat,.14,.69,-.92);
  tube(tail,[[0,0,0],[.15,.17,-.39],[.4,.45,-.78],[.63,.7,-.78]],.101,fur);
  cylinder(cat,0xc88c55,0,.927,.36,.466,.1,.43);
  ball(cat,0xffc77e,0,.86,.79,.103,.108,.075);
  const head=group(cat,0,1.18,.47);
  ball(head,face,0,0,0,.71,.57,.57);
  const ears = [];
  for (const side of [-1,1]) {
    const ear=group(head,.44*side,.4,-.03);
    ear.rotation.z=side*-.26;
    mesh(ear,coneShape,face,0,.19,0,.31,.58,.24);
    mesh(ear,coneShape,inside,0,.18,.112,.195,.38,.106);
    ears.push(ear);
  }
  const eyes=[];
  for (const side of [-1,1]) {
    const eye=group(head,side*.27,.075,.495);
    eye.rotation.y=side*.12;
    ball(eye,0x302e29,0,0,0,.176,.134,.097);
    ball(eye,0xf0b963,0,.01,.064,.145,.107,.054);
    const pupil=group(eye,0,.011,.108);
    ball(pupil,0x232624,0,0,0,.058,.09,.023);
    ball(pupil,0xffefd2,.018,.033,.02,.019,.024,.011);
    eyes.push({eye,pupil});
    ball(head,pale,side*.15,-.16,.49,.19,.115,.094);
    for (let i=0;i<2;i++) tube(head,[[side*.32,-.16+i*.05,.51],[side*.57,-.15+i*.09,.51],[side*.75,-.11+i*.09,.46]],.009,0xc2b8a0);
  }
  ball(head,0xba8075,0,-.095,.594,.073,.046,.029);
  const caughtFish=group(head,0,-.31,.77);
  makeFish(caughtFish,0xe69a60,true);
  caughtFish.visible=false;
  return {g,cat,head,ears,eyes,tail,paws,caughtFish,groundShadow};
}

function makeFish(parent,color,caught) {
  const fish=group(parent,0,0,0);
  if(caught)fish.rotation.y=Math.PI/2;
  ball(fish,color,0,0,0,.15,.112,.31);
  const fin=mesh(fish,coneShape,color,0,0,-.32,.155,.23,.057);
  fin.rotation.x=-Math.PI/2;
  ball(fish,0x423834,.131,.025,.134,.027,.028,.025);
  ball(fish,0x423834,-.131,.025,.134,.027,.028,.025);
}

function makeBowls(scene) {
  return careStations.slice(0,2).map(({id,pinX,pinZ})=>{
    const bowl=group(scene,pinX,0,pinZ);
    const milk=id==="milk";
    shadow(bowl,.13,.1,.62,.54);
    cylinder(bowl,milk?0x577a75:0xa35e45,0,.1,0,.49,.2);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(.46,.065,7,24),material(milk?0x8ca69b:0xedab77));
    lip.rotation.x=Math.PI/2;
    lip.position.y=.22;
    bowl.add(lip);
    cylinder(bowl,0x51483a,0,.165,0,.432,.03);
    const contents=group(bowl,0,.213,0);
    if(milk)cylinder(contents,0xffefcc,0,0,0,.427,.03);
    else for(let i=0;i<9;i++)ball(contents,0xad714a,Math.sin(i*2)*.33,(i%3)*.025,Math.cos(i*2)*.31,.091,.066,.082);
    return contents;
  });
}

function makeCar(scene) {
  const g=group(scene,carSpot.x,0,carSpot.z);
  shadow(g,.12,.16,1.48,2.33);
  const body=group(g,0,0,0);
  const paint=0x506f69;
  box(body,paint,0,.5,0,2.11,.36,3.73);
  box(body,0x729588,0,.79,1.07,1.92,.36,1.56);
  box(body,0x64837a,0,.84,-1.33,1.94,.37,.88);
  box(body,0x9a634a,0,.65,-.44,1.59,.25,.78);
  box(body,0xa77657,0,.96,-.69,1.56,.7,.2);
  for(const x of [-.94,.94]){
    box(body,paint,x,.87,-.35,.24,.55,1.36);
    box(body,0x8ba594,x,1.17,-.33,.25,.09,1.2);
    const pillar=box(body,0x5b6e62,x,1.25,.51,.1,.77,.1);
    pillar.rotation.x=-.24;
  }
  const frame=box(body,0x667b72,0,1.58,.46,1.93,.1,.12);
  frame.rotation.x=-.24;
  const hood=box(body,0xe2ca9e,0,.993,1.1,.33,.032,1.34);
  hood.rotation.x=-.035;
  box(body,0x3c4640,0,.46,1.89,1.43,.26,.1);
  box(body,0xd0a478,0,.39,1.95,2.22,.13,.18);
  box(body,0xd0a478,0,.4,-1.95,2.21,.13,.13);
  const wheels=[];
  const beams=[];
  const beamCanvas=document.createElement("canvas");
  beamCanvas.width=64;
  beamCanvas.height=256;
  const ctx=beamCanvas.getContext("2d");
  const glow=ctx.createRadialGradient(32,224,1,32,224,224);
  glow.addColorStop(0,"#ffd8a2ff");
  glow.addColorStop(.56,"#f6b97690");
  glow.addColorStop(1,"#d28f4b00");
  ctx.fillStyle=glow;
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(64,0);
  ctx.lineTo(39,255);
  ctx.lineTo(25,255);
  ctx.closePath();
  ctx.fill();
  const beamTexture=new THREE.CanvasTexture(beamCanvas);
  beamTexture.colorSpace=THREE.SRGBColorSpace;
  for(const x of [-.88,.88]){
    const lamp=ball(body,0xffd39a,x,.7,1.873,.17,.16,.11);
    lamp.material=new THREE.MeshBasicMaterial({color:0xffdc9a});
    box(body,0xc46951,x,.66,-1.87,.21,.12,.09);
    const light=new THREE.Mesh(new THREE.PlaneGeometry(2.1,6),new THREE.MeshBasicMaterial({map:beamTexture,transparent:true,opacity:0,depthWrite:false}));
    light.rotation.x=-Math.PI/2;
    light.position.set(x,.064,4.95);
    body.add(light);
    beams.push(light.material);
  }
  for(const z of [-1.35,1.27])for(const x of [-1.07,1.07]){
    const wheel=group(body,x,.42,z);
    cylinder(wheel,0x2d322c,0,0,0,.42,.29).rotation.z=Math.PI/2;
    cylinder(wheel,0xbca183,Math.sign(x)*.166,0,0,.201,.052).rotation.z=Math.PI/2;
    box(wheel,0x625747,Math.sign(x)*.198,0,0,.035,.062,.33);
    wheels.push(wheel);
  }
  return {g,body,wheels,beams};
}

export function createScene(container) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setClearColor(0xc4aa88,1);
  renderer.domElement.setAttribute("aria-hidden","true");
  container.append(renderer.domElement);
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xc4aa88,42,77);
  const fill=new THREE.HemisphereLight(0xffe5bc,0x616f63,2.17);
  scene.add(fill);
  const sun=new THREE.DirectionalLight(0xffdfb2,2.3);
  sun.position.set(-14,23,12);
  scene.add(sun);
  const camera = new THREE.OrthographicCamera(-16,16,9,-9,.1,150);
  const center = new THREE.Vector3(-1.2,0,3.4);
  const cameraOffset = new THREE.Vector3(12.3,20,23.7);
  const scratch = new THREE.Vector3();
  const catScreen = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const dest = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const smooth = THREE.MathUtils.damp;
  const {fish,lamps,gates,insects}=scenery(scene);
  landmarks.forEach((station,i)=>building(scene,station,i));
  const cat = makeCat(scene);
  const sleep=group(scene,0,0,0);
  for(let i=0;i<3;i++){
    const z=group(sleep,0,0,0);
    box(z,0xecd6a4,0,.13,0,.32,.056,.049);
    box(z,0xecd6a4,0,-.13,0,.32,.056,.049);
    box(z,0xecd6a4,0,0,0,.387,.055,.049).rotation.z=.72;
  }
  const bowls=makeBowls(scene);
  const car=makeCar(scene);
  const daySky=new THREE.Color(0xc4aa88), nightSky=new THREE.Color(0x17283e);
  const dayTint=new THREE.Color(0xffe5bc), nightTint=new THREE.Color(0x91b7ec);
  const snacks = new Map(treats.map((item) => {
    const g=group(scene,item.x,.48,item.z);
    const icon=mesh(g,rockShape,0xf5b35e,0,.27,0,.32,.38,.32);
    const base=cylinder(g,0x996e42,0,-.39,0,.49,.12);
    base.position.y=-.39;
    return [item.id,{g,icon}];
  }));
  let width=1,height=1;
  function resize() {
    width=container.clientWidth || 1;
    height=container.clientHeight || 1;
    const ratio=width/height;
    const span=ratio<.85 ? 9.0 : 9.5;
    camera.left=-span*ratio;
    camera.right=span*ratio;
    camera.top=span;
    camera.bottom=-span;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
  }
  let wheelAngle=0;
  function step(state,dt,time) {
    const {position,pointer,motion,activity,collected,vehicle,driving,worldSeconds,challenge}=state;
    const playing=Boolean(activity);
    const napping=activity?.id==="nap";
    const scratching=activity?.id==="scratch";
    const chirping=worldSeconds<state.meowUntil;
    const fishCaught=activity?.id==="fish"&&activity.left<2.05&&activity.left>.45;
    const {night}=skyAt(worldSeconds);
    scene.fog.color.copy(daySky).lerp(nightSky,night);
    renderer.setClearColor(scene.fog.color);
    fill.color.copy(dayTint).lerp(nightTint,night);
    fill.intensity=2.04-1.04*night;
    sun.intensity=2.3-2.07*night;
    lamps.forEach((glow)=>{glow.material.opacity=.25*night;});
    car.beams.forEach((light)=>{light.opacity=night*(driving?.73:.42);});
    fish.forEach((swimmer,i)=>{
      const angle=time*(.79+i*.16)+i*2.1;
      const a=motion?angle:i*2+1;
      swimmer.position.set(Math.sin(a)*(1.42+i*.18),.235,Math.cos(a)*(.75+i*.09));
      swimmer.rotation.y=Math.PI/2+a;
      swimmer.visible=activity?.id!=="fish"||i!==0;
    });
    insects.forEach(({g,wings},index)=>{
      const insect=butterflies[index];
      const spot=butterflyPosition(index,worldSeconds,motion);
      g.visible=challenge?.id!=="chase"||!challenge.caught.has(insect.id);
      g.position.set(spot.x,spot.y,spot.z);
      g.rotation.y=motion?worldSeconds*.94+index*1.8:0;
      wings.forEach((wing,i)=>{wing.rotation.z=motion?Math.sin(time*20)*.73*(i?1:-1):0;});
    });
    gates.forEach((flag,index)=>{
      const active=challenge?.id==="rally"&&challenge.next===index;
      flag.material=material(active?0xffd997:0xb47d56);
    });
    const targetX=position.x-1.26;
    const targetZ=position.z-1.08;
    center.x = motion ? smooth(center.x,targetX,4.5,dt) : targetX;
    center.z = motion ? smooth(center.z,targetZ,4.5,dt) : targetZ;
    camera.zoom=motion?smooth(camera.zoom,playing?1.29:driving?.88:1,4.8,dt):1;
    camera.updateProjectionMatrix();
    camera.position.copy(center).add(cameraOffset);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    car.g.position.set(vehicle.x,0,vehicle.z);
    const carTurn=Math.atan2(Math.sin(vehicle.heading-car.body.rotation.y),Math.cos(vehicle.heading-car.body.rotation.y));
    car.body.rotation.y=motion?car.body.rotation.y+carTurn*(1-Math.exp(-9*dt)):vehicle.heading;
    if(driving&&motion) wheelAngle-=state.speed*dt*2.45;
    car.wheels.forEach((wheel)=>{wheel.rotation.x=wheelAngle;});
    const jump=motion&&state.jump>0?Math.sin((1-state.jump/.51)*Math.PI)*.8:0;
    const carHeading=car.body.rotation.y;
    const napSpot=playSpots[2];
    const catX=napping?napSpot.pinX+.37:position.x-(driving?Math.sin(carHeading)*.43:0);
    const catZ=napping?napSpot.pinZ:position.z-(driving?Math.cos(carHeading)*.43:0);
    cat.g.position.set(catX,0,catZ);
    cat.g.scale.setScalar(driving?.72:1);
    cat.cat.position.y=driving?.96:napping?.54:jump+(state.moving&&motion?Math.abs(Math.sin(time*15))*.1:0);
    cat.cat.scale.y=napping?.64:scratching?1.15:1;
    cat.cat.rotation.x=scratching?-.38:0;
    cat.groundShadow.visible=!driving&&!napping;
    const heading=driving?carHeading:napping?Math.PI*.57:fishCaught?.48:position.heading;
    const rotationDelta=Math.atan2(Math.sin(heading-cat.cat.rotation.y),Math.cos(heading-cat.cat.rotation.y));
    cat.cat.rotation.y=motion?cat.cat.rotation.y+rotationDelta*(1-Math.exp(-14*dt)):heading;
    cat.paws.forEach((paw,i)=>{
      const stride=i===0||i===3?0:Math.PI;
      paw.rotation.x=scratching&&i>1?-.9+(motion?Math.sin(time*15+stride)*.35:0):
        state.moving&&!driving&&motion?Math.sin(time*17+stride)*.55:0;
      paw.position.y=driving?.43:.57;
    });
    cat.cat.getWorldPosition(catScreen);
    catScreen.y+=1.45;
    catScreen.project(camera);
    const lookX=motion&&pointer.active?THREE.MathUtils.clamp((pointer.x-catScreen.x)*1.18,-1,1):0;
    const lookY=motion&&pointer.active?THREE.MathUtils.clamp((pointer.y-catScreen.y)*1.25,-1,1):0;
    const eating=playing&&!napping&&!scratching&&motion;
    cat.head.position.y=smooth(cat.head.position.y,eating&&!fishCaught?.83:1.18,10,dt);
    cat.head.rotation.y = smooth(cat.head.rotation.y,eating?0:lookX*.76,10,dt);
    cat.head.rotation.x = smooth(cat.head.rotation.x,eating?(fishCaught?-.09:.44)+Math.sin(time*11)*.095:-lookY*.27,9,dt);
    cat.head.rotation.z = smooth(cat.head.rotation.z,lookX*-.13,8,dt);
    const blink = motion && (time%5.9>.0 && time%5.9<.13);
    for (const {eye,pupil} of cat.eyes) {
      eye.scale.y=napping||blink?.12:1;
      pupil.position.x=lookX*.069;
      pupil.position.y=.011+lookY*.037;
    }
    const earTwitch=chirping&&motion?Math.sin(time*25)*.17:0;
    cat.ears[0].rotation.z=.26+lookX*.16+earTwitch;
    cat.ears[1].rotation.z=-.26+lookX*.16-earTwitch;
    cat.tail.rotation.y=motion?Math.sin(time*(state.moving?5:playing?6:2.2))*.34:0;
    cat.caughtFish.visible=fishCaught;
    sleep.visible=napping;
    sleep.position.set(catX,1.45,catZ);
    sleep.rotation.y=.35;
    sleep.children.forEach((z,i)=>{
      z.position.set(i*.24,i*.29+(motion?Math.sin(time*3+i)*.13:0),0);
      z.scale.setScalar(.65+i*.18);
    });
    const [food,milk]=bowls;
    food.children.forEach((bite,i)=>{bite.visible=activity?.id!=="food"||activity.left>(i+1)*.25;});
    milk.scale.setScalar(activity?.id==="milk"?.62+activity.left*.13:1);
    snacks.forEach(({g,icon},id)=>{
      g.visible=!collected.has(id);
      icon.rotation.y=motion?time*2:0;
      icon.position.y=motion?.26+Math.sin(time*3+g.position.x)*.13:.26;
    });
    renderer.render(scene,camera);
  }
  return {
    resize, step,
    canvas:renderer.domElement,
    project(x,y,z) {
      scratch.set(x,y,z).project(camera);
      return {x:(scratch.x+1)*width/2,y:(1-scratch.y)*height/2};
    },
    worldPoint(x,y) {
      ndc.set(x,y);
      ray.setFromCamera(ndc,camera);
      const hit=ray.ray.intersectPlane(plane,dest);
      return hit?{x:hit.x,z:hit.z}:null;
    },
    moveVector(x,z) {
      return {x:.887*x-.461*z,z:-.461*x-.887*z};
    },
  };
}
