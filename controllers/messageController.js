const Convo = require("../models/conversationModel")
const Message = require("../models/messageModel")
const { getRecipientSocketId, io } = require("../socket/socket")
const cloudinary = require('../config');

const sendMessage = async(req,res) => {
    try {
        const {recipientId, message} = req.body
        let {img} = req.body
        const senderId = req.user._id

        let convo = await Convo.findOne({
            participants : {$all : [senderId, recipientId]}
        })

        if(!convo){
            convo = new Convo({
                participants : [senderId, recipientId],
                lastMessage : {
                    text: message,
                    sender: senderId
                }
            })
            await convo.save()
        }

        if(img){
            const uploadedResponse = await cloudinary.uploader.upload(img)
            img = uploadedResponse.secure_url
        }

        const newMessage = new Message({
            conversationId: convo._id,
            sender: senderId,
            text: message,
            img: img || ''
        })

        await Promise.all([
            newMessage.save(),
            convo.updateOne({
                lastMessage: {
                    text : message,
                    sender : senderId,
                }
            })
        ])

        const recipientSocketId = getRecipientSocketId(recipientId)
        if(recipientSocketId){
            io.to(recipientSocketId).emit('newMessage', newMessage)
        }

        res.status(201).json(newMessage)
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in sendMessage: ", err.message)
    }
}

const getMessages = async(req,res) => {
    const { otherUserId } = req.params
    const userId = req.user._id
    try {
        const convo = await Convo.findOne({
            participants : {$all : [userId, otherUserId]}
        })        

        if(!convo){
            return res.status(404).json({error : 'Conversation not found'})
        }

        const messages = await Message.find({
            conversationId: convo._id
        }).sort({createdAt : 1})

        res.status(200).json(messages)
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in getMessages: ", err.message)
    }
}


const getConvos = async(req,res) => {
    const userId = req.user._id
    try {
        const convo = await Convo.find({
            participants : userId, 
        }).populate({
            path: 'participants',
            select: 'username profilePic'
        })       

        convo.forEach((convo) => {
            convo.participants = convo.participants.filter(
                participants => participants._id.toString() !== userId.toString()
            )
        })
        res.status(200).json(convo)
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in getConvos: ", err.message)
    }
}

module.exports = {sendMessage, getMessages, getConvos}