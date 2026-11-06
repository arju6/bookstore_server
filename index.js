require('dotenv').config()
const express=require('express')
const cors=require('cors')
const path=require('path')
const router=require('./Routes/routes')
require('./config/db')

//creates server using express package
const server=express()
//enables cors in server
server.use(cors())

//parse json into json content
server.use(express.json())

//use routes in server
server.use(router)

server.use('/uploads',express.static(path.join(__dirname,'uploads')))


//setup port number to run server in internet
const PORT=process.env.PORT

//start server to listen client request to that port
server.listen(PORT,()=>{
    console.log("server running and waiting for client request")
})

///handle global errors in server using application middleware
server.use((err,req,res,next)=>{
    res.status(500).json(err.message)
})


//resolves api(get request to http://localhost:3000) using express
server.get('/',(req,res)=>{
    res.status(200).send(`<h1>server running and waiting for client request</h1>`)
}) 

server.post('/',(req,res)=>{
    res.status(200).send("POST REQUEST")
})