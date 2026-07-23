import {prisma} from "../config/db.js";
import {type AuthenticatedRequest} from "../middleware/auth.js";
import {type Response} from 'express';

export const getItem = async(req : AuthenticatedRequest,res : Response) => {
    try {
        const {categorySlug,search,status} = req.query;

        const whereClause : any = {};

        if(categorySlug){
            whereClause.category = {slug : String(categorySlug)};
        }
        if(status){
            whereClause.status = String(status);
        }else{
            whereClause.status = "AVAILABLE";
        }

        if(search){
            whereClause.OR = [
                {title : {contains : String(search),mode : 'insensitive'}},
                {description : {contains : String(search),mode : 'insensitive'}},
            ];
        }

        const items = await prisma.item.findMany({
            where: whereClause,
            include:{
                category : true,
                seller:{
                    select : {id : true,name : true,avatarUrl : true},
                },
            },
            orderBy:{createdAt: "desc"},
        });

        return res.json(items);
    } catch (error) {
        console.error("getItems Error:", error);
        return res.status(500).json({ error: "Failed to fetch items" });
    }
};

export const getItemById = async(req: AuthenticatedRequest,res : Response) => {
    try {
        const {id} = req.params;
        const itemId = Array.isArray(id) ? id[0] : id;
        if (!itemId) {
          return res.status(400).json({ error: "Item ID is required" });
        }

        const item = await prisma.item.findUnique({
            where : {id : itemId},
            include : {
                category : true,
                seller : {
                    select : {id : true,name : true,avatarUrl : true,email : true}
                },
            },
        });

        if(!item){
            return res.status(404).json({ error: "Item not found" });
        }

        return res.json(item);
    } catch (error) {
        console.error("getItemById Error:", error);
        return res.status(500).json({ error: "Failed to fetch item details" });
    }
}

export const createItem = async(req : AuthenticatedRequest,res : Response) => {
    try {
        const {title,description,price,categoryId} = req.body;
        const files = req.files as Express.Multer.File[];
        if (!title || !price || !categoryId) {
          return res
            .status(400)
            .json({ error: "Title, price, and category are required" });
        }
        const images = files ? files.map((file: any) => file.path) : [];

        const newItem = await prisma.item.create({
            data : {
                title,
                description,
                price : parseFloat(price),
                images,
                categoryId,
                sellerId : req.user.id,
                status: "AVAILABLE",
            },
            include:{
                category: true,
                seller : {select : {id : true,name : true,avatarUrl: true}},
            },
        });
        return res.status(201).json(newItem); 
    } catch (error) {
        console.error("createItem Error:", error);
        return res.status(500).json({ error: "Failed to create item listing" });
    }
}
export const getCategories = async(req : AuthenticatedRequest,res : Response) => {
    try {
        const categories =  await prisma.category.findMany({
            orderBy: {
                name : "asc",
            },
        });

        return res.json(categories);
    } catch (error) {
        console.error("getCategories Error:", error);
        return res.status(500).json({ error: "Failed to fetch categories" });
    }
}