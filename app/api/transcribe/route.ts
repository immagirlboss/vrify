import {NextRequest,NextResponse} from 'next/server';
import {experimental_transcribe as transcribe} from 'ai';
import {createGateway} from '@ai-sdk/gateway';
import {sameOrigin,failure} from '@/lib/http';
export const maxDuration=60;
export async function POST(req:NextRequest){try{sameOrigin(req);if(!process.env.AI_GATEWAY_API_KEY)return failure(new Error('Live transcription requires AI_GATEWAY_API_KEY. No demo transcript was generated.'),503);
 const form=await req.formData(),file=form.get('audio');if(!(file instanceof File)||file.type!=='audio/wav'||file.size<44||file.size>2500000)throw new Error('Send a WAV recording under 2.5 MB.');
 const audio=Buffer.from(await file.arrayBuffer());if(audio.toString('ascii',0,4)!=='RIFF'||audio.toString('ascii',8,12)!=='WAVE')throw new Error('Invalid WAV recording.');
 const gateway=createGateway({apiKey:process.env.AI_GATEWAY_API_KEY});const result=await transcribe({model:gateway.transcriptionModel(process.env.AI_TRANSCRIPTION_MODEL||'openai/whisper-1'),audio,abortSignal:AbortSignal.timeout(45000)});
 return NextResponse.json({text:result.text.slice(0,2000),mode:'live'});
 }catch(e){return failure(e);}}
