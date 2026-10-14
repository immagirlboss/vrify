import 'server-only';
export function configured() {return !!(process.env.SHOPIFY_STORE_DOMAIN&&process.env.SHOPIFY_ADMIN_ACCESS_TOKEN);}
export async function graphql(query:string,variables:Record<string,unknown>={}) {
 const domain=process.env.SHOPIFY_STORE_DOMAIN||''; if(!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(domain)) throw new Error('Configure a valid myshopify.com store domain.');
 const version=process.env.SHOPIFY_API_VERSION||'2026-07'; if(!/^20\d{2}-(01|04|07|10)$/.test(version)) throw new Error('Invalid Shopify API version.');
 const res=await fetch(`https://${domain}/admin/api/${version}/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':process.env.SHOPIFY_ADMIN_ACCESS_TOKEN||''},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(20000),cache:'no-store'});
 if(!res.ok) throw new Error(`Shopify returned HTTP ${res.status}. Check credentials and scopes.`);
 const json=await res.json(); if(json.errors?.length) throw new Error(json.errors.map((e:{message:string})=>e.message).join('; '));
 for(const value of Object.values(json.data||{}) as {userErrors?:{message:string}[]}[]) if(value?.userErrors?.length) throw new Error(value.userErrors.map(e=>e.message).join('; '));
 return json.data;
}
