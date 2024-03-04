// middleware

import { verify } from 'hono/jwt'

// @ts-ignore
export function intitMiddleware(app) {
    
    // @ts-ignore
    app.use('/api/v1/blog/*',async(c,next)=>{
        const header = await c.req.header("authorization")
        const token  =  header?.split(" ")[1]
    
        const response = await verify(header, c.env.JWT_SECRET)
        if (response.id) {
            await next()
        }else{
            c.status(403)
            return c.json({
                msg:"User signin failed"
            })
    
        }
    
    })
}