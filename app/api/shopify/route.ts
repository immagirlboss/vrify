import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { productSchema,imageSchema } from '@/lib/schema';
import { configured,graphql } from '@/lib/shopify';
import { sameOrigin,failure } from '@/lib/http';
export const maxDuration=60;
const locks=new Set<string>();
const schema=z.object({key:z.string().uuid(),product:productSchema,image:imageSchema});
const fields='id status variants(first:1) { nodes { id price } } media(first:10) { nodes { status ... on MediaImage { mediaErrors { message } } } }';
function escape(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export async function POST(req:NextRequest){let key='';let ownsLock=false;try {sameOrigin(req); const input=schema.parse(await req.json());key=input.key;
 if(!configured()) return NextResponse.json({demo:true,message:'Demo only: your draft is stored in this browser. No Shopify product was created.'});
 if(locks.has(key)) return failure(new Error('This draft is already saving. Wait before trying again.'),409);locks.add(key);ownsLock=true;
 if(!input.product.title.trim()) throw new Error('Give your product a title before saving.');
 const shop=await graphql('{ shop { currencyCode } }'); if(shop.shop.currencyCode!==input.product.currency) throw new Error(`This store uses ${shop.shop.currencyCode}. Set the draft currency to match.`);
 const handle=`makervoice-${key}`;
 let existing=(await graphql(`query($query:String!){products(first:1,query:$query){nodes{${fields}}}}`,{query:`handle:${handle}`})).products.nodes[0];
 if(!existing){
 const [,mime,base64]=input.image.match(/^data:(image\/\w+);base64,(.+)$/)!;const bytes=Buffer.from(base64,'base64');
 const staged=await graphql('mutation($input:[StagedUploadInput!]!){stagedUploadsCreate(input:$input){stagedTargets{url resourceUrl parameters{name value}} userErrors{message}}}',{input:[{filename:`shirt.${mime.split('/')[1]}`,mimeType:mime,httpMethod:'POST',resource:'IMAGE',fileSize:String(bytes.length)}]});
 const target=staged.stagedUploadsCreate.stagedTargets[0];if(!target) throw new Error('Shopify did not provide an upload target.');
 const form=new FormData();target.parameters.forEach((p:{name:string,value:string})=>form.append(p.name,p.value));form.append('file',new Blob([bytes],{type:mime}),`shirt.${mime.split('/')[1]}`);
 const upload=await fetch(target.url,{method:'POST',body:form,signal:AbortSignal.timeout(20000)});if(!upload.ok) throw new Error('Shopify image upload failed. No product was created.');
 const created=await graphql(`mutation($product:ProductCreateInput!,$media:[CreateMediaInput!]){productCreate(product:$product,media:$media){product{${fields}} userErrors{message}}}`,{product:{title:input.product.title,descriptionHtml:`<p>${escape(input.product.description)}</p>`,tags:input.product.tags,status:'DRAFT',handle},media:[{originalSource:target.resourceUrl,mediaContentType:'IMAGE',alt:input.product.title}]});existing=created.productCreate.product;
 }
 if(!existing) throw new Error('Shopify did not return a product. Retry with this draft to check its saved handle.');
 if(existing.status!=='DRAFT') throw new Error('The existing product is no longer a draft; edit it in Shopify.');
 await graphql('mutation($id:ID!,$variants:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$id,variants:$variants){productVariants{id price} userErrors{message}}}',{id:existing.id,variants:[{id:existing.variants.nodes[0].id,price:input.product.price.toFixed(2)}]});
 const adminUrl=`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/products/${existing.id.split('/').pop()}`;
 const current=(await graphql(`query($id:ID!){product(id:$id){${fields}}}`,{id:existing.id})).product;
 const media=current.media.nodes; const failed=media.find((m:{status:string})=>m.status==='FAILED');if(failed) throw new Error(`Draft created, but image processing failed. Inspect ${adminUrl}. ${failed.mediaErrors?.map((e:{message:string})=>e.message).join('; ')||''}`);
 const ready=media.length>0&&media.every((m:{status:string})=>m.status==='READY');
 return NextResponse.json({demo:false,id:existing.id,adminUrl,ready,message:ready?'Shopify draft saved with the original image and price. Inventory was not synced.':'Draft and price created. Image is still processing; check again to verify. Inventory was not synced.'});
 }catch(e){return failure(e);}finally{if(ownsLock)locks.delete(key);}}
