import { Hono } from "hono";
import { verifyMarketerToken } from "../middleware/authmiddleware";
import { uploadToCloudinary } from "../utils/claudinary";
import { db } from "../../drizzle/src";
import { document } from "../db/schema";

const  documentRoute=new Hono();

documentRoute.post("/upload",
    verifyMarketerToken,
    async(c)=>{

    const user=(c.req as any).user;
    const body=await c.req.parseBody();
    const file=body["file"]

    if(!file || !(file instanceof File)){
        return c.json({error:"File is required"},400)
    }

    //upload to cloudinary
    const url=await uploadToCloudinary(file,"documents");

    //store this url on db
    await db.insert(document).values({
        documentName:file.name,
        userId:user.id,
        status:"active",
        link:url
    })

    return c.json({
        message:"Document uploaded successfully",
        url,
    })
})

export default documentRoute;