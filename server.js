const express = require('express');
const dotenv = require('dotenv')
const cookie = require('cookie-parser')
const cors = require('cors')
const {io, server, app} = require('./socket/socket')

const connectDB = require('./db/connectDB')
const userRoute = require('./routes/userRoute')
const postRoute = require('./routes/postRoute')
const messageRoute = require('./routes/messageRoute')


dotenv.config();
connectDB();
const PORT = process.env.PORT || 4000;

app.use(express.json({limit: '50mb'})); //to parse json data in req.body
app.use(express.urlencoded({limit: '50mb', extended: true})) //to parse form data in req.body
app.use(cookie());
app.use(cors());


app.use('/api/users', userRoute)
app.use('/api/posts', postRoute)
app.use('/api/message', messageRoute)

server.listen(PORT, () => {
    console.log(`Server started at ${PORT}`)
})