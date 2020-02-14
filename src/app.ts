import Koa from 'koa'
import route from 'koa-route'
const app= new Koa()
const login= (ctx:Koa.BaseContext,next: () => Promise<any>)=>{
    console.log("context:",ctx)
    ctx.body='hello1234567'
    
}
app.use(route.get('/',login))
app.listen(3000)