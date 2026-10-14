'use client';
import {useEffect,useRef,useState} from 'react';
import {encodeWav,wakeCommand} from '@/lib/voice';
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:{results:{isFinal:boolean;0:{transcript:string}}[];resultIndex:number})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
export function useHandsFree(options:{transcription:boolean;isBusy:()=>boolean;onCommand:(text:string)=>Promise<void>;onMessage:(text:string)=>void}) {
 const [active,setActive]=useState(false),[phase,setPhase]=useState('Off');
 const current=useRef(options);current.current=options;
 const armed=useRef(false),cleanup=useRef<()=>void>(()=>{}),generation=useRef(0),sending=useRef(false),last=useRef({text:'',time:0});
 function stop(){armed.current=false;generation.current++;cleanup.current();cleanup.current=()=>{};setActive(false);setPhase('Off');}
 async function handle(text:string,token:number){if(!armed.current||token!==generation.current||current.current.isBusy())return;const command=wakeCommand(text);if(!command){setPhase('Say “vrify” + command');return;}if(/^(?:stop listening|stop voice|mute)(?:[.!])?$/i.test(command)){stop();current.current.onMessage('Hands-free listening stopped.');return;}const now=Date.now();if(command===last.current.text&&now-last.current.time<4000)return;last.current={text:command,time:now};setPhase('Processing');await current.current.onCommand(command);if(armed.current&&token===generation.current)setPhase('Listening');}
 async function start(){if(armed.current)return;const token=++generation.current;try{
 if(!window.isSecureContext)throw new Error('Hands-free voice needs HTTPS or localhost.');
 const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};const R=w.SpeechRecognition||w.webkitSpeechRecognition;
 if(!R&&!current.current.transcription)throw new Error('This browser needs AI Gateway transcription for voice. Configure AI_GATEWAY_API_KEY, or use headset gaze controls and typed commands.');
 armed.current=true;setActive(true);setPhase('Starting');
 if(R){const r=new R();let timer:ReturnType<typeof setTimeout>|undefined;r.lang='en-US';r.continuous=false;r.interimResults=false;
 const restart=()=>{if(!armed.current||token!==generation.current)return;if(current.current.isBusy()||window.speechSynthesis?.speaking){timer=setTimeout(restart,400);return;}try{r.start();setPhase('Listening');}catch{timer=setTimeout(restart,600);}};
 r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)void handle(e.results[i][0].transcript,token);};
 r.onerror=e=>{if(['not-allowed','service-not-allowed','audio-capture'].includes(e.error)){stop();current.current.onMessage(`Voice permission or service unavailable: ${e.error}.`);}else setPhase('Reconnecting');};r.onend=()=>{if(armed.current)timer=setTimeout(restart,500);};
 cleanup.current=()=>{if(timer)clearTimeout(timer);r.onend=null;r.stop();};restart();return;}
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone access is unavailable.');
 const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(!armed.current||token!==generation.current){media.getTracks().forEach(t=>t.stop());return;}
 const context=new AudioContext();await context.resume();const source=context.createMediaStreamSource(media),processor=context.createScriptProcessor(4096,1,1),silent=context.createGain();silent.gain.value=0;source.connect(processor);processor.connect(silent);silent.connect(context.destination);
 let chunks:Float32Array[]=[],duration=0,quiet=0,voiced=0;
 const flush=async()=>{const audio=encodeWav(chunks,context.sampleRate),wasVoiced=voiced;chunks=[];duration=0;quiet=0;voiced=0;if(wasVoiced<.25||sending.current)return;sending.current=true;setPhase('Transcribing');try{const form=new FormData();form.append('audio',new Blob([audio],{type:'audio/wav'}),'command.wav');const res=await fetch('/api/transcribe',{method:'POST',body:form});const data=await res.json();if(!res.ok)throw new Error(data.error||'Transcription failed.');await handle(data.text,token);}catch(e){if(armed.current){stop();current.current.onMessage(e instanceof Error?e.message:'Voice transcription failed.');}}finally{sending.current=false;if(armed.current)setPhase('Listening');}};
 processor.onaudioprocess=e=>{if(!armed.current||sending.current||current.current.isBusy()||window.speechSynthesis?.speaking)return;const input=e.inputBuffer.getChannelData(0);let energy=0;for(const value of input)energy+=value*value;const talking=Math.sqrt(energy/input.length)>.018,seconds=input.length/context.sampleRate;if(!talking&&!chunks.length)return;chunks.push(new Float32Array(input));duration+=seconds;if(talking){quiet=0;voiced+=seconds;}else quiet+=seconds;if(quiet>1||duration>12)void flush();};
 cleanup.current=()=>{processor.onaudioprocess=null;processor.disconnect();source.disconnect();silent.disconnect();media.getTracks().forEach(t=>t.stop());void context.close();};setPhase('Listening');
 }catch(e){stop();current.current.onMessage(e instanceof Error?e.message:'Could not start hands-free voice.');}}
 useEffect(()=>()=>{armed.current=false;generation.current++;cleanup.current();},[]);
 return {active,phase,start,stop,toggle:()=>active?stop():void start()};
}
