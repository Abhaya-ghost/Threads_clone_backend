const { Server } = require('socket.io')
const http = require('http')
const express = require('express')
const Message = require('../models/messageModel')
const Convo = require('../models/conversationModel')

const app = express()
const server =  http.createServer(app)
const io = new Server(server, {
    cors : {
        origin: '*',
        methods: ['GET','POST']
    }
})

const getRecipientSocketId = (recipientId) => userSocketMap[recipientId]

const userSocketMap = {} //userId : socketId

io.on('connection', (socket) => {
    console.log('User connected ', socket.id)
    const userId = socket.handshake.query.userId

    if(userId != 'undefined'){
        userSocketMap[userId] = socket.id
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap))

    socket.on('markMessageAsSeen', async({conversationId, userId}) => {
        try {
            await Message.updateMany({
                conversationId: conversationId,
                seen : false
            }, {$set: {seen : true}})
            await Convo.updateOne({
                _id: conversationId,
            }, {$set: {"lastMessage.seen" : true}})
            io.to(userSocketMap[userId]).emit('messagesSeen', {conversationId})
        } catch (err) {
            console.log(err)
        }
    })

    socket.on('disconnect', () => {
        console.log('User disconneected ')
        delete userSocketMap[userId]
        io.emit('getOnlineUsers', Object.keys(userSocketMap))
    })
})

module.exports = {io, server, app, getRecipientSocketId}
