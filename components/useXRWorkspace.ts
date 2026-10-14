'use client';
import {useEffect,useRef,useState} from 'react';
import type {Product,StoreStyle} from '@/lib/schema';
import type * as Three from 'three';
type Snapshot={product:Product;style:StoreStyle;image:string|null;message:string;state:string;voice:string;busy:boolean};
export function useXRWorkspace(snapshot:Snapshot,onAction:(action:string)=>void){
 const [supported,setSupported]=useState(false),[active,setActive]=useState(false),[error,setError]=useState('');
 const latest=useRef(snapshot);latest.current=snapshot;const action=useRef(onAction);action.current=onAction;
 const sessionRef=useRef<XRSession|null>(null),destroy=useRef<()=>void>(()=>{});
 useEffect(()=>{if(window.isSecureContext&&navigator.xr)void navigator.xr.isSessionSupported('immersive-vr').then(setSupported).catch(()=>setSupported(false));return()=>{void sessionRef.current?.end();destroy.current();};},[]);
 async function enter(){if(!navigator.xr||sessionRef.current)return;setError('');let session:XRSession|null=null;
 try{session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['hand-tracking']});sessionRef.current=session;const THREE=await import('three');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.setSize(window.innerWidth,window.innerHeight);renderer.domElement.className='xr-canvas';document.body.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#0c1009');const camera=new THREE.PerspectiveCamera(65,1,.01,100),group=new THREE.Group();group.position.set(0,0,-2);scene.add(group);
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=850;const ctx=canvas.getContext('2d')!;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.63),new THREE.MeshBasicMaterial({map:texture}));group.add(panel);
 const buttons:Three.Mesh[]=[];const labels=[['camera','OPEN CAMERA'],['capture','CAPTURE'],['voice','VOICE ON/OFF'],['save','SAVE DRAFT'],['exit','EXIT VR']];
 labels.forEach(([id,label],i)=>{const c=document.createElement('canvas');c.width=320;c.height=100;const g=c.getContext('2d')!;g.fillStyle='#d9fb75';g.fillRect(0,0,320,100);g.fillStyle='#11170a';g.font='bold 24px Arial';g.textAlign='center';g.fillText(label,160,59);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const b=new THREE.Mesh(new THREE.PlaneGeometry(.43,.135),new THREE.MeshBasicMaterial({map:t}));b.position.set((i-2)*.46,-.95,.015);b.userData.action=id;buttons.push(b);group.add(b);});
 const cursor=new THREE.Mesh(new THREE.RingGeometry(.008,.012,24),new THREE.MeshBasicMaterial({color:'#d9fb75',depthTest:false}));cursor.renderOrder=10;scene.add(cursor);
 const ray=new THREE.Raycaster(),matrix=new THREE.Matrix4(),direction=new THREE.Vector3(),origin=new THREE.Vector3();let hovered:Three.Mesh|null=null,dwellStart=0,lastActivated=0,activatedTarget:Three.Mesh|null=null,lastDraw=0,currentImage='';let photo:HTMLImageElement|null=null;let disposed=false;
 const fire=(id:string)=>{if(id==='exit'){void sessionRef.current?.end();return;}if(!latest.current.busy)action.current(id);};
 for(let i=0;i<2;i++){const controller=renderer.xr.getController(i);controller.addEventListener('select',()=>{matrix.extractRotation(controller.matrixWorld);ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);ray.ray.direction.set(0,0,-1).applyMatrix4(matrix);const hit=ray.intersectObjects(buttons,false)[0];if(hit)fire(hit.object.userData.action);});scene.add(controller);}
 const wrap=(text:string,x:number,y:number,width:number,lineHeight:number,max=4)=>{const words=text.split(/\s+/);let line='',row=0;for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,y+row*lineHeight);line=word;if(++row>=max)return;}else line=next;}if(row<max)ctx.fillText(line,x,y+row*lineHeight);};
 const draw=()=>{const s=latest.current;if(s.image!==currentImage){currentImage=s.image||'';photo=null;if(s.image){const img=new Image();img.onload=()=>{if(currentImage===s.image)photo=img;};img.src=s.image;}}
 ctx.fillStyle='#161b12';ctx.fillRect(0,0,1200,850);ctx.fillStyle='#d9fb75';ctx.font='bold 52px Arial';ctx.fillText('vrify ↗',45,70);ctx.font='22px monospace';ctx.fillText('IMMERSIVE WORKSPACE / '+s.state.toUpperCase(),330,65);ctx.fillStyle='#313c25';ctx.fillRect(45,110,1110,2);
 if(photo){const ratio=Math.min(470/photo.width,495/photo.height);ctx.drawImage(photo,45+(470-photo.width*ratio)/2,145,photo.width*ratio,photo.height*ratio);}else{ctx.fillStyle='#a8b198';ctx.font='26px Arial';ctx.fillText('Upload or capture an image',50,250);}
 ctx.fillStyle='#ffffff';ctx.font='bold 42px Arial';wrap(s.product.title||'Your next release',550,185,605,50,3);ctx.fillStyle='#d9fb75';ctx.font='30px monospace';ctx.fillText(s.product.currency+' '+s.product.price.toFixed(2)+' / '+s.product.quantity+' available',550,350);ctx.fillStyle='#cad1bd';ctx.font='27px Arial';wrap(s.product.description||'Say “vrify” followed by a command.',550,410,600,36,5);
 ctx.fillStyle='#8c9d76';ctx.font='22px Arial';wrap('Store: '+s.style.heading,550,630,600,28,2);ctx.fillStyle='#d9fb75';ctx.font='23px monospace';ctx.fillText('VOICE / '+s.voice.toUpperCase(),45,710);ctx.fillStyle='#ffffff';ctx.font='26px Arial';wrap(s.message,45,760,1100,32,2);texture.needsUpdate=true;};
 destroy.current=()=>{if(disposed)return;disposed=true;renderer.setAnimationLoop(null);scene.traverse(obj=>{const mesh=obj as Three.Mesh;if(mesh.geometry)mesh.geometry.dispose();const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const m of materials)if(m){const map=(m as Three.MeshBasicMaterial).map;map?.dispose();m.dispose();}});renderer.dispose();renderer.domElement.remove();sessionRef.current=null;setActive(false);};
 session.addEventListener('end',()=>destroy.current(),{once:true});await renderer.xr.setSession(session);setActive(true);draw();
 renderer.setAnimationLoop(time=>{if(time-lastDraw>250){draw();lastDraw=time;}const head=renderer.xr.getCamera();head.getWorldPosition(origin);head.getWorldDirection(direction);ray.set(origin,direction);const hit=ray.intersectObjects(buttons,false)[0];cursor.visible=!!hit;
 if(hit){cursor.position.copy(hit.point).addScaledVector(direction,-.01);cursor.quaternion.copy(head.quaternion);const target=hit.object as Three.Mesh;if(target!==hovered){hovered=target;activatedTarget=null;dwellStart=time;}const progress=Math.min(1,(time-dwellStart)/1800);cursor.scale.setScalar(1+progress);if(progress===1&&activatedTarget!==target&&time-lastActivated>2200){lastActivated=time;activatedTarget=target;fire(target.userData.action);}}else{hovered=null;activatedTarget=null;cursor.scale.setScalar(1);}
 renderer.render(scene,camera);});
 }catch(e){if(session)await session.end().catch(()=>{});destroy.current();sessionRef.current=null;setError(e instanceof Error?e.message:'Could not enter immersive VR. Use headset browser mode.');}}
 return {supported,active,error,enter,exit:()=>sessionRef.current?.end()};
}
