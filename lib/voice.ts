export function wakeCommand(text:string):string|null {
 const match=text.trim().match(/^(?:hey\s+)?(?:vrify|verify|veri\s*fy)[,.:!\s]+(.+)$/i);
 return match?.[1].trim()||null;
}
export function encodeWav(chunks:Float32Array[],sampleRate:number):ArrayBuffer {
 const length=chunks.reduce((sum,c)=>sum+c.length,0),buffer=new ArrayBuffer(44+length*2),view=new DataView(buffer);
 const ascii=(offset:number,text:string)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
 ascii(0,'RIFF');view.setUint32(4,36+length*2,true);ascii(8,'WAVE');ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,length*2,true);
 let offset=44;for(const chunk of chunks)for(const sample of chunk){const s=Math.max(-1,Math.min(1,sample));view.setInt16(offset,s<0?s*32768:s*32767,true);offset+=2;}return buffer;
}
