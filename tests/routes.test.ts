import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {POST as command} from '../app/api/command/route';
import {POST as save} from '../app/api/shopify/route';
import {emptyProduct,initialStyle} from '../lib/schema';
const image='data:image/jpeg;base64,/9j/';
const request=(path:string,body:unknown,origin='http://localhost:3000')=>new NextRequest(`http://localhost:3000${path}`,{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(body)});
test('server integration: demo, malformed commands, origins, Shopify failures and real save response',async()=>{
 delete process.env.AI_GATEWAY_API_KEY;delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;delete process.env.SHOPIFY_STORE_DOMAIN;
 const commandResult=await command(request('/api/command',{command:'Call it Midnight Garden. Price is 45 dollars.',product:emptyProduct,style:initialStyle,image}));const c=await commandResult.json();assert.equal(c.mode,'demo');assert.equal(c.product.price,45);
 assert.equal((await command(request('/api/command',{command:'x'}))).status,400);
 assert.equal((await command(request('/api/command',{},'https://evil.example'))).status,400);
 const body={key:'7c231945-6392-4c82-b024-726b96f44d44',product:{...emptyProduct,title:'Midnight Garden',price:45},image};
 const demo=await (await save(request('/api/shopify',body))).json();assert.equal(demo.demo,true);assert.equal(demo.adminUrl,undefined);
 process.env.SHOPIFY_STORE_DOMAIN='test-store.myshopify.com';process.env.SHOPIFY_ADMIN_ACCESS_TOKEN='test-only';
 const original=globalThis.fetch;try{
 globalThis.fetch=async()=>new Response('{}',{status:401});const rejected=await save(request('/api/shopify',body));assert.equal(rejected.status,400);assert.match((await rejected.json()).error,/HTTP 401/);
 globalThis.fetch=async()=>Response.json({data:{shop:{userErrors:[{message:'Missing write_products'}]}}});const apiError=await save(request('/api/shopify',body));assert.match((await apiError.json()).error,/Missing write_products/);
 const product={id:'gid://shopify/Product/123',status:'DRAFT',variants:{nodes:[{id:'gid://shopify/ProductVariant/456',price:'45.00'}]},media:{nodes:[{status:'READY',mediaErrors:[]}]}};let creates=0;
 globalThis.fetch=async(url,init)=>{if(String(url).includes('upload.example'))return new Response('',{status:201});const payload=JSON.parse(String(init?.body));const q=payload.query;let data;
 if(q.includes('currencyCode'))data={shop:{currencyCode:'USD'}};
 else if(q.includes('products(first'))data={products:{nodes:creates?[product]:[]}};
 else if(q.includes('stagedUploadsCreate'))data={stagedUploadsCreate:{stagedTargets:[{url:'https://upload.example',resourceUrl:'https://cdn.example/shirt.jpg',parameters:[]}],userErrors:[]}};
 else if(q.includes('productCreate')){creates++;assert.equal(payload.variables.product.status,'DRAFT');assert.equal(payload.variables.media[0].originalSource,'https://cdn.example/shirt.jpg');data={productCreate:{product,userErrors:[]}};}
 else if(q.includes('productVariantsBulkUpdate')){assert.equal(payload.variables.variants[0].price,'45.00');data={productVariantsBulkUpdate:{productVariants:[],userErrors:[]}};}
 else data={product};return Response.json({data});};
 const result=await(await save(request('/api/shopify',body))).json();assert.equal(result.demo,false);assert.equal(result.ready,true);assert.match(result.adminUrl,/admin\/products\/123$/);assert.match(result.message,/Inventory was not synced/);
 await save(request('/api/shopify',body));assert.equal(creates,1,'retry reuses existing handle');
 product.media.nodes[0].status='PROCESSING';const pending=await(await save(request('/api/shopify',body))).json();assert.equal(pending.ready,false);
 product.media.nodes[0].status='FAILED';const failed=await save(request('/api/shopify',body));assert.equal(failed.status,400);assert.match((await failed.json()).error,/processing failed/);
 }finally{globalThis.fetch=original;delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;delete process.env.SHOPIFY_STORE_DOMAIN;}
});
