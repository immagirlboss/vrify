import { NextResponse } from 'next/server';
import { configured,graphql } from '@/lib/shopify';
export async function GET(){let shopify='demo',currency=null,error=null; if(configured()) {try {const data=await graphql('{ shop { name currencyCode } }');shopify='connected';currency=data.shop.currencyCode;}catch(e){shopify='error';error=e instanceof Error?e.message:'Shopify connection failed.';}} return NextResponse.json({ai:process.env.AI_GATEWAY_API_KEY?'live':'demo',shopify,currency,error,transcription:!!process.env.AI_GATEWAY_API_KEY});}
