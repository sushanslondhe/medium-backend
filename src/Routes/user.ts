import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { signinInput, signupInput } from '@sushans-londhe/medium-blog-validation';


export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string
    }
}
>()

userRouter.get('/',(c)=>{
    return c.text("userRouter")
})

userRouter.post('/signup',async(c)=>{
    const body = await c.req.json()
    const { success } = await signupInput.safeParse(body)
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
        
    }
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())

    try {
        const user = await prisma.user.create({
            // @ts-ignore
			data: {
                email:body.username,
                name:body.name,
                password:body.password
            }
		});

		const jwt = await sign({ id:user.id },c.env.JWT_SECRET);
		return c.json({ msg:`user created successfully`,
    token:jwt });
        
    } catch (error) {
        console.log(error)
        c.status(411)
        return c.json({
            message:"Invalid Inputs"
        })
        
    }
	
    }    
)
userRouter.post('/signin',async(c)=>{

    const body = await c.req.json()
    const { success } = await signinInput.safeParse(body)
    if (!success) {
        c.status(411)
        return c.json({
            msg:"Inputs are not correct"
        })
    }

    const prisma  = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())


    try{
        const FindUser = await prisma.user.findUnique({
            where:{
                email:body.username,
                password:body.password
            }
        
           })
           if (!FindUser) {
            c.status(403)
            return c.json({error:"User not found"})
           }
           
           const jwt = await sign({id: FindUser.id}, c.env.JWT_SECRET)
           return c.json({jwt})
    } catch(e) {
        console.log(e);
        c.status(411);
        return c.text('Invalid')
      }

   
    
})



