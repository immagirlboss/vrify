import { z } from 'zod';
export const productSchema = z.object({title:z.string().max(150),description:z.string().max(4000),price:z.number().min(0).max(1000000),currency:z.enum(['USD','EUR','GBP','CAD','AUD']),quantity:z.number().int().min(0).max(100000),tags:z.array(z.string().max(50)).max(20)});
export const styleSchema = z.object({backgroundColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),heading:z.string().max(80),tagline:z.string().max(180),stylePreset:z.enum(['handmade','minimal','bold'])});
export const actionSchema = z.object({action:z.enum(['update_product','update_store_style','capture_photo','save_shopify_draft','clarify']),product:productSchema.partial().nullable(),style:styleSchema.partial().nullable(),message:z.string().max(300)});
export const imageSchema = z.string().max(4500000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/);
export const requestSchema = z.object({command:z.string().min(1).max(2000),product:productSchema,style:styleSchema,image:imageSchema.nullable()});
export type Product = z.infer<typeof productSchema>; export type StoreStyle = z.infer<typeof styleSchema>; export type Action = z.infer<typeof actionSchema>;
export const emptyProduct:Product={title:'',description:'',price:0,currency:'USD',quantity:1,tags:[]};
export const initialStyle:StoreStyle={backgroundColor:'#f2f2ed',accentColor:'#131413',heading:'OFF SCRIPT.',tagline:'Independent pieces. Unfiltered expression.',stylePreset:'minimal'};
export function demoCommand(command:string, product:Product):Action {
 const s=command.toLowerCase(); const result:Action={action:'clarify',product:null,style:null,message:'Demo understands the example commands, title, price, quantity, and playful edits. Try an example below.'};
 if(/save.*shopify/.test(s)) return {...result,action:'save_shopify_draft',message:'Preparing your Shopify draft.'};
 if(/capture|take.*photo/.test(s)) return {...result,action:'capture_photo',message:'Capturing a still photo.'};
 if(/black and white|bold minimal/.test(s)) return {...result,action:'update_store_style',style:{backgroundColor:'#ffffff',accentColor:'#111111',heading:'OFF SCRIPT.',tagline:'Wear your own point of view.',stylePreset:'bold'},message:'Black, white, and bold type. Storefront preview updated.'};
 if(/store|cream|forest green/.test(s)) return {...result,action:'update_store_style',style:{backgroundColor:'#f2ebda',accentColor:'#214d38',heading:'The handmade studio',tagline:'A little art. A lot of heart.',stylePreset:'handmade'},message:'Cream, forest green, and a little handmade warmth. Preview updated.'};
 if(/playful/.test(s)) return {...result,action:'update_product',product:{description:product.description ? `${product.description.replace(/ A little.*$/,'')} A little wearable joy for your everyday adventures.` : 'A little wearable joy for your everyday adventures.'},message:'A playful touch, without adding product facts.'};
 const patch:Partial<Product>={}; const title=command.match(/(?:call it|title(?: is)?|name it)\s+(.+?)(?:[.!]|\s+price\b|$)/i); if(title) patch.title=title[1].trim();
 const price=command.match(/(?:price(?: is| to)?|costs?)\s*\$?(\d+(?:\.\d{1,2})?)/i); if(price) patch.price=Number(price[1]);
 const qty=command.match(/(?:quantity(?: is| to)?|only)\s+(\d+|one)/i); if(qty) patch.quantity=qty[1]==='one'?1:Number(qty[1]);
 if(/hand.paint/.test(s)) {patch.description='A hand-painted shirt, made with an artist’s personal touch.';patch.tags=['hand-painted','shirt'];}
 if(/black graphic shirt/.test(s)) {patch.description='A black graphic shirt with oversized lettering and a red heart graphic.';patch.tags=['graphic','shirt'];}
 if(Object.keys(patch).length) return {...result,action:'update_product',product:patch,message:'Your product draft is updated. The original artwork stays yours.'}; return result;
}
