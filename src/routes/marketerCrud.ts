


import { Hono } from "hono";
import { db } from "../../drizzle/src";
import { dealer, marketer ,warehouse,sale,driver} from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyDealerToken, verifyMarketerToken,} from "../middleware/authmiddleware";
import bcrypt from "bcryptjs";
import{z} from "zod";

 const markerterCrud=new Hono();

markerterCrud.get("/get/:marketerId/drivers", async (c) => {
  const marketerId = Number(c.req.param("marketerId"));

  const drivers = await db
    .select({
      id: driver.id,
      fullName: driver.fullName,
      phoneNumber: driver.phoneNumber,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
      status: driver.status,
    })
    .from(driver)
    .where(eq(driver.marketerId, marketerId));

  return c.json(drivers);
});

 //protected by dealer token
 markerterCrud.use('*',verifyDealerToken)


 //create marketer
const createMarketerSchema=z.object({
   name:z.string().min(2).max(100),
   contact:z.string().regex(/^\d{10}$/, "Contact must be 10 digits"),
   password:z.string().min(6)
})

 markerterCrud.post('/',async(c)=>{
    const dealer=(c.req as any).user;
  try{
    const body=await c.req.json();
    
    const parsed=createMarketerSchema.safeParse(body)

    if(!parsed.success){
      return c.json({error:"Invalid input",details:parsed.error.format()},400)
    }
   
    const { name, contact, password } = parsed.data;

    //check the duplicates
    const [deatils]=await db.select({id:marketer.id})
                    .from(marketer)
                    .where(eq(marketer.contact,contact))
                    .limit(1)
                    
    
    if (deatils) {
    return c.json({ error: "A marketer with this contact already exists" }, 409);
  }
   const hashed=await bcrypt.hash(password,12)


   const [newmarketer]=await db.insert(marketer).values({
                        dealerId:dealer.id,
                        name,
                        contact,
                        passWord:hashed,
                        jwtToken:null,
   }).returning();

  return c.json({message:"Marketer created",marketer:newmarketer},201)
 }catch(error){
   console.log("Error creating marketer",error);
   return c.json({error:"Failed to create marketer"},500)
 }})

//get all marekerts
 markerterCrud.get('/',async(c)=>{
       
       const dealer=(c.req as any).user;
       const markerts=await db.select().from(marketer) 
                            .where(eq(marketer.dealerId,dealer.id))


    return c.json(markerts)
 })


 //get single mareketer
 markerterCrud.get('/:id',async(c)=>{
    const dealer=(c.req as any).user;
    const id=Number(c.req.param("id"))

    const [m]=await db.select().from(marketer).where(eq(marketer.id,id))
    if(!m || m.dealerId !== dealer.id) return c.json({error:"Mareketer not found"},404)

    return c.json(m)
 })


 //update marketer
 markerterCrud.patch('/:id',async(c)=>{
    const dealer=(c.req as any).user
    const id=Number(c.req.param("id"))
    const body=await c.req.json()

    const [existing] = await db.select()
    .from(marketer)
    .where(eq(marketer.id, id));

    if (!existing || existing.dealerId !== dealer.id) {
  return c.json({ error: "Not found or not yours" }, 404);
}

    const [updated]=await db.update(marketer).set({
                     name:body.name,
                     contact:body.contact,
    }).where(eq(marketer.id,id))
    .returning();

    // if(!updated || updated.dealerId !== dealer.id){

    //     return c.json({error:"Mareketer not found or not yours"},404)
    // }
    if (!updated) {
     return c.json({ error: "Update failed" }, 500);
    }

        

        return c.json({message:"Mareketer updated",marketer:updated})        
 })


 //delete marketer
 markerterCrud.delete('/:id',async(c)=>{
    const dealer=(c.req as any).user
    const id=Number(c.req.param("id"));


    const [existing] = await db.select()
    .from(marketer)
   .where(eq(marketer.id, id));
 
if (!existing || existing.dealerId !== dealer.id) {
  return c.json({ error: "Not found or not yours" }, 404);
}

    const [deleted]=await db.delete(marketer)
                    .where(eq(marketer.id,id))
                    .returning();
    
    if(!deleted || deleted.dealerId !== dealer.id){
        return c.json({error:"Mareketer not found or not yours"},404)
    }
    return c.json({message:"Mareketer deleted",id})
 })



 export default markerterCrud;
