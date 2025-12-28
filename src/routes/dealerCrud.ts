

import { Hono } from "hono";
import { db } from "../../drizzle/src";
import { dealer, marketer, sale, warehouse } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyDealerToken } from "../middleware/authmiddleware";
import bcrypt from "bcryptjs";
import {z} from "zod";



const dealerCrud=new Hono();

//protected by dealer token
dealerCrud.use('*',verifyDealerToken);

//create delaer
const createDealerSchema=z.object({
    name:z.string().min(2).max(100),
    contact:z.string().regex(/^\d{10}$/, "Contact must be 10 digits"),
    password:z.string().min(6,"Password must be at leat 6 characters")
});

dealerCrud.post('/',async(c)=>{
    const body=await c.req.json();
  
     //validate input
     const parseResult=createDealerSchema.safeParse(body)
    if(!parseResult.success){
        return c.json({
            error:"Validation failed",details:parseResult.error.format()
        },400)
    }
 
    const {name,contact,password}=parseResult.data

    // check for existing dealer by contact
    const [existing]=await db
                    .select({id:dealer.id})
                    .from(dealer)
                    .where(eq(dealer.contact,contact))
                    .limit(1)
    if(existing)return c.json({error:"Dealer with contact already exists"},409)
 

  //hash password
    const hashed=await bcrypt.hash(password,12)

    try{
    const [newDealer]=await db
                        .insert(dealer)
                        .values({
                         name,
                         contact,
                         passWord:hashed,
                         jwttoken:null,
                      }).returning({
                        id:dealer.id,
                        name:dealer.name,
                        contact:dealer.contact,
                        //createdAt:dealer.createdAt,
                      });
    return c.json({message:"Dealer created",dealer:newDealer},201)
  }catch(error:any){
    console.log("registrartion error:",error)
    return c.json({error:"Registration failed.Please try again"},500)
  }
});


//get all dealers
dealerCrud.get("/",async(c)=>{
    const dealers=await db.select().from(dealer)
    return c.json(dealers);
})

//get single dealer
dealerCrud.get("/:id",async(c)=>{
    const id=Number(c.req.param("id"));

    const [Id]=await db.select().from(dealer).where(eq(dealer.id,id))
    if(!Id) return c.json({error:"Dealer not found"},404)
    
    return c.json(Id)

})

//update dealer
dealerCrud.patch("/:id",async(c)=>{
    const id=Number(c.req.param("id"))
    const body=await c.req.json()

    const [updated]=await db.update(dealer)
                    .set({
                        name:body.name,
                        contact:body.contact,
                    }).where(eq(dealer.id,id))
                    .returning();
    if(!updated)return c.json({error:"Dealer not found"},404)

    return c.json({message:"Dealer updated",dealer:updated})

})


//delete dealer
dealerCrud.delete("/:id",async(c)=>{
    const idParam=Number(c.req.param("id"));
    const id=Number(idParam)

    //validate id id a no or not
    if(isNaN(id) || id<=0){
       return c.json({error:"Invalid dealer ID"},400)
    }
try{
    const [deleted]=await db
                    .delete(dealer)
                    .where(eq(dealer.id,id))
                    .returning({id:dealer.id,name:dealer.name});
    if(!deleted) return c.json({error:"Dealer not found"},404)
    return c.json({message:"Dealer account  deleted successfully",id})
}
catch(error){
    console.log("Error deleting dealer:",error)
    return c.json({error:"Failed to delete dealer"},500)
}
})


//get marketers under dealers
dealerCrud.get("/:dealerId/marketers",async(c)=>{
    const dealerUser=(c.req as any).user  //logged-in user
    const dealerId=Number(c.req .param("dealerId"));

    //dealer only can fetch markerters under them
    if(dealerUser.id !== dealerId){
        return c.json({error:"Unauthorized:Cannot access another dealer's marketers "},403)
    }

    const markerters=await db.select()
                     .from(marketer)
                     .where(eq(marketer.dealerId,dealerId));


    return c.json(markerters)

})



//all sales under a dealer
dealerCrud.get(':id/sales',verifyDealerToken,async(c)=>{
    const currentDealer=(c.req as any).user
    const targetDealerId=Number(c.req.param("id"))

    if(currentDealer.id !== targetDealerId){
        return c.json({error:"Forbidden"},403)

    }
    const sales=await db.select({sale,marketer,warehouse})
                .from(sale)
                .innerJoin(warehouse,eq(sale.warehouseId,warehouse.id))
                .innerJoin(marketer,eq(warehouse.marketerId,marketer.id))
                .where(eq(marketer.dealerId,targetDealerId))

   return c.json(sales)
})



export default dealerCrud
