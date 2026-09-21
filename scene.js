/* Continuous portal gallery: whole modules are renewed only outside the visible range. */
(()=>{'use strict';
const canvas=document.getElementById('world');let gl;
try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){}
if(!gl){document.documentElement.classList.add('no-webgl');return;}
const vertex=`
attribute vec3 pos;attribute vec3 origin;attribute vec3 color;attribute float stage;
uniform float aspect;uniform float offsetZ;uniform float build;uniform float entrance;uniform float drift;uniform float spread;uniform vec2 pointer;
varying vec3 col;varying float depth;
void main(){
 float growth=smoothstep(stage,min(1.,stage+.28),build);
 vec3 p=mix(origin,pos,growth);
 p.z+=offsetZ;
 p.x+=sign(p.x)*spread+2.8*(1.-entrance)-pointer.x*.22;
 p.y+=pointer.y*.12+sin(drift*.00013)*.035-.15;
 // Slow changes of heading move the whole gallery, without bending its beams.
 float seconds=drift*.001;
 float ease=smoothstep(0.,18.,seconds);
 float yaw=ease*(.016*sin(seconds*.09)+.006*sin(seconds*.041));
 float pitch=ease*.009*sin(seconds*.071);
 p.x-=ease*.15*sin(seconds*.083);
 p.y-=ease*.07*sin(seconds*.061);
 float a=-.045+pointer.x*.012+yaw;
 float x=p.x*cos(a)+p.z*sin(a);p.z=-p.x*sin(a)+p.z*cos(a);p.x=x;
 float y=p.y*cos(pitch)-p.z*sin(pitch);p.z=p.y*sin(pitch)+p.z*cos(pitch);p.y=y;
 gl_Position=vec4(p.x*1.7/aspect,p.y*1.7,(-p.z-0.12),-p.z);
 col=color;depth=-p.z;
}`;
const fragment=`precision mediump float;varying vec3 col;varying float depth;
void main(){
 float fade=smoothstep(1.5,10.,depth)*(1.-smoothstep(105.,150.,depth));
 if(fade<.002)discard;
 float fog=exp(-depth*.016);
 gl_FragColor=vec4(col*fog,fade*.86);
}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
try{
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');gl.useProgram(program);
const attributes={};['pos','origin','color','stage'].forEach(n=>attributes[n]=gl.getAttribLocation(program,n));
const uniforms={};['aspect','offsetZ','build','entrance','drift','spread','pointer'].forEach(n=>uniforms[n]=gl.getUniformLocation(program,n));
const faces=[[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]];
function specification(id){return{width:2.5+.38*Math.sin(id*.61),height:3.35+.30*Math.cos(id*.43),length:13+7*(.5+.5*Math.sin(id*.73)),spacing:10+3*(.5+.5*Math.cos(id*.47)),shift:.2*Math.sin(id*.39),kind:id%4};}
function geometry(id){
 const spec=specification(id),data=[];const w=spec.width,h=spec.height,L=spec.length;
 const orange=[.9,.35+.04*Math.sin(id*.53),.14],dim=[.30,.19,.12],metal=[.12,.13,.13];
 function box(x,y,z,bw,bh,bd,c,stage=0,axis='y'){
  const anchor=[x+spec.shift,y,z];anchor['xyz'.indexOf(axis)]-={x:bw,y:bh,z:bd}[axis]/2;
  faces.forEach((face,i)=>[0,1,2,0,2,3].forEach(n=>{const v=face[n],shade=[1,.35,.7,.3,.5,.65][i];data.push(x+spec.shift+(v[0]-.5)*bw,y+(v[1]-.5)*bh,z+(v[2]-.5)*bd,...anchor,c[0]*shade,c[1]*shade,c[2]*shade,stage);}));
 }
 function arch(z,width,height,c,stage=0){box(-width,0,z,.095,height*2,.22,c,stage);box(width,0,z,.095,height*2,.22,c,stage+.08);box(0,height,z,width*2+.095,.095,.22,c,stage+.16,'x');box(0,-height,z,width*2,.025,.1,dim,stage,'x');}
 arch(0,w,h,orange,.10);
 // Long ribs link the entrances into galleries rather than isolated repeated squares.
 for(const x of [-w,w]){box(x,h,-L/2,.042,.042,L,dim,.02,'z');box(x,-h,-L/2,.022,.022,L,dim,.05,'z');}
 if(spec.kind===0){arch(-L*.65,w,h,dim,.24);box(0,h+.16,-L/2,.025,.035,L,dim,.10,'z');}
 if(spec.kind===1){arch(-1.1,w+.22,h+.18,dim,.22);arch(-L*.85,w+.22,h+.18,dim,.38);}
 if(spec.kind===2){box(-w-.22,0,-L*.3,.045,2*h,.12,dim,.20);box(0,h+.22,-L*.3,w*2+.45,.045,.12,dim,.30,'x');arch(-L*.9,w-.08,h-.08,dim,.35);}
 if(spec.kind===3){arch(-L*.4,w,h,dim,.22);arch(-L*.8,w,h,dim,.38);box(0,h,-L/2,.035,.035,L,dim,.05,'z');}
 // Subtle structural edges retain the original dark architectural character.
 box(-w-.14,0,-.22,.12,2*h+.15,.5,metal,.10);box(w+.14,0,-.22,.12,2*h+.15,.5,metal,.18);
 return {spec,data:new Float32Array(data)};
}
const modules=[];let nextId=0;
function makeModule(z){const id=nextId++,mesh=geometry(id);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.data,gl.STATIC_DRAW);return{id,z,spec:mesh.spec,buffer,count:mesh.data.length/10};}
let nextZ=-5;for(let i=0;i<18;i++){const m=makeModule(nextZ);modules.push(m);nextZ-=m.spec.spacing;}
function recycle(){for(let i=0;i<modules.length;i++){const m=modules[i];if(m.z-m.spec.length>14){const far=Math.min(...modules.map(m=>m.z));gl.deleteBuffer(m.buffer);modules[i]=makeModule(far-specification(nextId).spacing);}}}
function bind(m){gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);for(const [n,size,offset] of [['pos',3,0],['origin',3,12],['color',3,24],['stage',1,36]]){gl.enableVertexAttribArray(attributes[n]);gl.vertexAttribPointer(attributes[n],size,gl.FLOAT,false,40,offset);}}
gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
const preference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=preference.matches,active=!document.hidden,frame=0,last=null,elapsed=0,distance=0,px=0,py=0,cx=0,cy=0,spread=0;
// Skip the first six seconds of the very slow ramp; run the trajectory faster for the presentation.
function baseDistance(t){const duration=50,u=Math.min(t/duration,1);return .09*Math.min(t,duration)+.81*duration*(u*u*u-.5*u*u*u*u)+.9*Math.max(0,t-duration);}
function distanceAt(t){return baseDistance(6+t*1.56)-baseDistance(6);}
function schedule(){if(!frame&&active)frame=requestAnimationFrame(render);}
function resize(){const ratio=Math.min(devicePixelRatio,1.35);canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uniforms.aspect,innerWidth/innerHeight);schedule();}
function pause(value){reduced=value;last=null;schedule();}
addEventListener('resize',resize);resize();
addEventListener('pointermove',e=>{if(!reduced&&e.pointerType==='mouse'){px=e.clientX/innerWidth*2-1;py=1-e.clientY/innerHeight*2;}},{passive:true});
addEventListener('motionchange',e=>pause(e.detail));preference.addEventListener('change',e=>pause(e.matches||document.documentElement.classList.contains('reduced-motion')));
addEventListener('scroll',schedule,{passive:true});
document.addEventListener('visibilitychange',()=>{active=!document.hidden;last=null;schedule();});
function render(t){frame=0;if(!active)return;if(last!==null&&t-last<30){schedule();return;}
 const dt=last===null?0:Math.min(.1,Math.max(0,(t-last)/1000));last=t;
 if(!reduced){elapsed+=dt;const next=distanceAt(elapsed),step=next-distance;distance=next;modules.forEach(m=>m.z+=step);recycle();cx+=(px-cx)*.04;cy+=(py-cy)*.04;const wall=document.getElementById('murs');const d=(scrollY-wall.offsetTop)/wall.offsetHeight;const goal=Math.sin(Math.min(1,Math.max(0,d+.3))*Math.PI)*1.1;spread+=(goal-spread)*.035;}
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.entrance,Math.min(distance/14,1));gl.uniform1f(uniforms.drift,elapsed*1000);gl.uniform1f(uniforms.spread,spread);gl.uniform2f(uniforms.pointer,cx,cy);
 // No modulo is applied to vertices. Every beam remains a single intact mesh.
 [...modules].sort((a,b)=>a.z-b.z).forEach(m=>{bind(m);gl.uniform1f(uniforms.offsetZ,m.z);gl.uniform1f(uniforms.build,Math.max(0,Math.min(1,(155+m.z)/72)));gl.drawArrays(gl.TRIANGLES,0,m.count);});
 if(!reduced)schedule();
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;document.documentElement.classList.add('no-webgl');});schedule();
}catch(e){document.documentElement.classList.add('no-webgl');}
})();
