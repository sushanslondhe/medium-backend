import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { createBlogInput, updateBlogInput } from '@sushans-londhe/medium-blog-validation';
import { Hono } from 'hono';
import { verify } from 'hono/jwt';


const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string
    },
    Variables:{
        userId: string
    }
}>()


blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    try {
        const user = await verify(authHeader, c.env.JWT_SECRET);
        if (user) {
            
            c.set("userId",user.id);
            await next();
        } else {
            c.status(403);
            return c.json({
                message: "You are not logged in"
            })
        }
    } catch(e) {
        c.status(403);
        return c.json({
            message: "You are not logged in"
        })
    }
});

blogRouter.get('/',(c)=>{
    return c.text("blogRouter")

})
blogRouter.post('/',async(c)=>{
    const body = await c.req.json()
    const { success } = createBlogInput.safeParse(body)
    if (!success) {
        c.status(411)
        return c.json({
            msg:"Invalid Inputs"
        })
    }
    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL

    }).$extends(withAccelerate())
    const authorId  = c.get('userId')

    const blog = await prisma.blog.create({
        data:{
            title:body.title,
            content:body.content,
            authorId: Number(authorId),
            published:true

        }
    })
    return c.json({
        id:blog.id
    })



    
    
})
blogRouter.put('/',async(c)=>{
    const body = await c.req.json()
    const { success } = updateBlogInput.safeParse(body)
    if (!success) {
        c.status(411)
        return c.json({
            msg:"Inputs are not correct"
        })
    }
    const prisma =  new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL

    }).$extends(withAccelerate())


    const blog = await prisma.blog.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content
        },
        select:{
            title:true,
            content:true,
            

        }
    })
    return c.json({
        blog
        
    })

    
})
blogRouter.get('id/:id',async(c)=>{
    const id  =  await c.req.param("id");
    console.log(id)
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())

    const post = await prisma.blog.findUnique({
        where:{
            id:Number(id)
        },
        select:{
            id:true,
            title:true,
            content:true,
            author:{
                select:{
                    email:true
                }
                
            }
        }
    })
    return c.json(post)
})
blogRouter.get('/bulk',async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())

    const getAll = await prisma.blog.findMany({
        select:{
            id:true,
            title:true,
            content:true,
            author:{
                select:{
                    email:true
                }
            }
        }
    })
    return c.json(
        getAll

    )
})


export default blogRouter