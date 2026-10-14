import { NextRequest, NextResponse } from 'next/server';
export function sameOrigin(req:NextRequest) {
 const origin=req.headers.get('origin');
 if(origin) {
  const parsed=new URL(origin);
  const host=req.headers.get('host')||req.nextUrl.host;
  if(parsed.host!==host || !['http:','https:'].includes(parsed.protocol)) throw new Error('Request origin is not allowed.');
 }
}
export function failure(error:unknown,status=400) {return NextResponse.json({error:error instanceof Error?error.message:'Something went wrong.'},{status});}
