


import { Hono } from "hono";
import { db } from "../../drizzle/src";
import { warehouse,marketer ,sale} from "../db/schema";
import { and, eq,  } from "drizzle-orm";
import { verifyDealerToken, verifyMarketerToken } from "../middleware/authmiddleware";



const warehouseCrud=new Hono();


//create a warehouse->marketer creates warehouse
warehouseCrud.post('/',verifyMarketerToken,async(c)=>{

    const marketer=(c.req as any).user;
    const body=await c.req.json();

    const {address,geo_point,owner_name,contact,quantity}=body;

    if(!address || !geo_point?.lat|| !geo_point?.lng ||!owner_name || !contact ||!quantity){
        return c.json({error:"All fields required:address,geo_point(lat/lng),owner_name,quantity"},400)
    }

     const [newWarehouse]=await db.insert(warehouse).values({
                                marketerId:marketer.id,
                                address,
                                geoPoint:{lat:Number(geo_point.lat) ,lng:Number(geo_point.lng)},
                                ownerName:owner_name,
                                contact:contact || null,
                                quantity:Number(quantity)

     }).returning();

     return c.json({message:"Warehouse created successfully",warehouse:newWarehouse},201)
})


//get warehouseses->marketer only sees warehouse
warehouseCrud.get('/',verifyMarketerToken,async(c)=>{
    const marketer=(c.req as any).user;

    const warehouses=await db.select().from(warehouse)
                     .where(eq(warehouse.marketerId,marketer.id))
    return c.json(warehouses)

})

//get warehouse by id->(belongs to market)
warehouseCrud.get('/:id',verifyMarketerToken,async(c)=>{
    const marketer=(c.req as any).user;
    const id=Number(c.req.param("id"));

    const [wh]=await db.select().from(warehouse)
               .where(and(eq(warehouse.id,id),eq(warehouse.marketerId,marketer.id)))

    if(!wh )return c.json({error:"Warehouse are not found or not yours"},404)

    return c.json(wh)
})

//update warehouse
warehouseCrud.patch('/:id',verifyMarketerToken,async(c)=>{
    const marketer=(c.req as any).user;
    const id=Number(c.req.param("id"))
    const body=await c.req.json()

    const [updated]=await db.update(warehouse).set({
                    address:body.address,
                    geoPoint:body.geo_point?{lat:body.geo_point.lat,lng:body.geo_point.lng}:undefined,
                    ownerName:body.owner_name,
                    contact:body.contact,
                    quantity:body.quantity ?Number(body.quantity):undefined           
    }).where(and(eq(warehouse.id,id),eq(warehouse.marketerId,marketer.id)))
    .returning();

    if(!updated) return c.json({error:"Warehouse are not found or not yours "})
        return c.json({message:"warehouse updated",warehouse:updated})
    })



    //delete warehouse
    warehouseCrud.delete('/:id',verifyMarketerToken,async(c)=>{
        const marekert=(c.req as any).user
        const id=Number(c.req.param("id"))

        const [deleted]=await db.delete(warehouse)
                        .where(and(eq(warehouse.id,id),eq(warehouse.marketerId,marekert.id)))
                        .returning();
        
        if(!deleted)return c.json({error:"Warehouse not found or not yours"},404)

        return c.json({message:'Warehouse deleted',id})
    })


    //get warehouses under marekets
    //GET /api/marketers/:id/warehouses (Dealer sees marketer's warehouses)
    warehouseCrud.get("/:id/warehouses",verifyDealerToken,async(c)=>{
        const dealer=(c.req as any).user;
        const marekertId=Number(c.req.param("id"))

        //verify market belongs to user
        const [m]=await db.select().from(marketer)
                 .where(and(eq(marketer.id,marekertId),eq(marketer.dealerId,dealer.id)))

        if(!m){
            return c.json({error:"Mareket not found or not yours"},404)
        }

        const warehouses=await db.select()
                         .from(warehouse)
                         .where(eq(warehouse.marketerId, marekertId))

        return c.json(warehouses)
    })
 
    
    //get sales under a warehouse(viewed by marketer)
    warehouseCrud.get('/:id/sales',verifyMarketerToken,async(c)=>{
        const marketer=(c.req as any).user
        const  warehouseId=Number(c.req.param("id"))
    
          const [wh]=await db.select().from(warehouse)
                 .where(and(
                    eq(warehouse.id,warehouseId),
                    eq(warehouse.marketerId,marketer.id)))
    
        if(!wh)return c.json({error:"Warehouse not found"},404)
        const sales=await db.select().from(sale)
                     .where(eq(sale.warehouseId,warehouse.id))
        return c.json(sales)
    })
    





export default warehouseCrud;

