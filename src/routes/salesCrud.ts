import { Hono } from "hono";
import { db } from "../../drizzle/src";
import { marketer,sale, warehouse } from "../db/schema";
import { verifyDealerToken, verifyMarketerToken } from "../middleware/authmiddleware";
import {eq,and} from "drizzle-orm"



const salesCrud=new Hono();

//create a sales post
salesCrud.post("/",verifyMarketerToken,async(c)=>{
    const marketer=(c.req as any).user

    const body=await c.req.json();
    const{warehouse_id,quantity,price,soldAt,approval}=body;
    
    if(!warehouse_id || !quantity || !price){
       return c.json({error:"All fields are required"},400)
    }

    //verify the warehouse belongs to markert 
    const [wh] = await db
    .select()
    .from(warehouse)
    .where(and(eq(warehouse.id, Number(warehouse_id)), eq(warehouse.marketerId, marketer.id)));
      
   if(!wh) return c.json({error:"Warehouse not found or not yours"},403)
    
   const [newSale]=await db.insert(sale).values({
                    warehouseId:Number(warehouse_id),
                    quantity:Number(quantity),
                    price:String(price),
                    soldAt:new Date(),
                    approval:false
   }).returning()
   return c.json({message:"Sales recorded (pending approval",sale:newSale},201)
                                                                                                                
})



//get sales by id
//view a single sale
//Marketer->only own sales
//Dealer->only sales under own marketers
salesCrud.get(
    '/:id',
    async(c,next)=>{
        try{
            await verifyDealerToken(c,next);
        }catch{
            await verifyMarketerToken(c,next)
        }
    },
    async(c)=>{
    const user=(c.req as any).user;
    const saleId=Number(c.req.param("id"))
    if(isNaN(saleId)) return c.json({error:"Invalid sale id"},400)

    const [result]=await db.select({sale,warehouse,marketer})
                   .from(sale)
                   .innerJoin(warehouse,eq(sale.warehouseId,warehouse.id))
                   .innerJoin(marketer,eq(warehouse.marketerId,marketer.id))
                   .where(eq(sale.id,saleId))
    //sales doesnot exist
    if(!result) return c.json({error:"Sales are nit found"},404)

    const { sale: s, marketer: m } = result;

    //RBAC
    //Markerter access
    if(user.role === "marketer" && m.id !== user.id){
        return c.json({error:"Forbidden:You do not own this sale"},403)
    }

    //Dealer access
    if(user.role === "dealer" && m.dealerId !== user.id){
        return c.json({error:"Forbidden:sales doesnot belongs to your marketers"},403)
    }

    return c.json(s)
})

//PATCH /api/sales/:id ->markerts updates only if not approved
salesCrud.patch('/:id',verifyMarketerToken,async(c)=>{
    const marketer=(c.req as any).user
    const saleId=Number(c.req.param("id"))
     if(isNaN(saleId)) return c.json({error:"Invalid sale id"},400)
    const body=await c.req.json();

    const [s]=await db.select({sale,warehouse}).from(sale)
             .innerJoin(warehouse,eq(sale.warehouseId,warehouse.id))
             .where(and(eq(sale.id,saleId),eq(warehouse.marketerId,marketer.id)))

    if(!s) return c.json({error:"Sales not found or not yours"},404)
    if(s.sale.approval)return c.json({error:"Cannot update approved sales"},403)

    const [updated]=await db.update(sale)
                    .set({
                        quantity:body.quantity?Number(body.quantity):undefined,
                        price:body.price?String(body.price):undefined,
                        soldAt:body.soldAt?new Date(body.soldAt):undefined
                    })
                    .where(eq(sale.id,saleId))
                    .returning()

    return c.json({message:"Sale updated",sale:updated})
            
})


//delete a sale ->marketers deletes sales(if not approves)
salesCrud.delete('/:id',verifyMarketerToken,async(c)=>{
    const marketer=(c.req as any).user
    const saleId=Number(c.req.param("id"))
     if(isNaN(saleId)) return c.json({error:"Invalid sale id"},400)
    
    const [s]=await db.select().from(sale)
             .innerJoin(warehouse,eq(sale.warehouseId,warehouse.id))
             .where(and(eq(sale.id,saleId),eq(warehouse.marketerId,marketer.id)))

    if(!s)return c.json({error:"Sale not found or not yours"},404)
    if(s.sale.approval)return c.json({error:"Cannot delete approves sales"},403)

    await db.delete(sale).where(eq(sale.id,saleId))
    return c.json({message:"Sale deleted"})
})


//PATCH /api/sales/:id/approve → Dealer approves sale
salesCrud.patch('/:id/approve',verifyDealerToken,async(c)=>{
    const dealer=(c.req as any).user;
    const saleId=Number(c.req.param("id"));
    if(isNaN(saleId)) return c.json({error:"Invalid sale id"},400)

     const [s]=await db.select().from(sale)
             .innerJoin(warehouse,eq(sale.warehouseId,warehouse.id))
             .innerJoin(marketer,eq(warehouse.marketerId,marketer.id))
             .where(and(eq(sale.id,saleId),eq(marketer.dealerId,dealer.id)))

    if(!s) return c.json({error:"Sales not found or not unser hierarchy"},404)
    if(s.sale.approval)return c.json({message:"Already updated "})

        const [approved]=await db.update(sale)
                         .set({approval:true})
                         .where(eq(sale.id,saleId))
                         .returning();
    return c.json({message:"Sale approved",sale:approved})
});


export default salesCrud
