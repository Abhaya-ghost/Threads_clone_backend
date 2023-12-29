const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const generateTokenAndSetCookie = require("../utils/helpers/generateTokenAndCookie");
const cloudinary = require('../config');
const { default: mongoose } = require("mongoose");
const Post = require("../models/postModel");

const getUserProfile = async(req,res) => {
    const {query} = req.params;
    //query is either username or userid
    try {
        let user;
        if(mongoose.Types.ObjectId.isValid(query)){
            user = await User.findOne({_id:query}).select('-password').select('-updatedAt')
        }else{
            user = await User.findOne({username:query}).select('-password').select('-updatedAt')
        }

        if(!user){
            return res.status(400).json({error: 'User not found'});
        }

        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in getUserProfile: ", err.message)
    }
}

const signupUser = async(req,res) => {
    try {
        const {name,email,username,password} = req.body;

        if(!username || !email || !password || !name){
            res.status(400)
            throw new Error('Please add all fields')
        }

        const user = await User.findOne({$or:[{email},{username}]});

        if(user){
            return res.status(400).json({error:'User already exists'})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password,salt);

        const newUser = new User({
            name: req.body.name,
            email: req.body.email, 
            username: req.body.username,
            password: hashedPassword,
        })

        await newUser.save();

        if(newUser){
            generateTokenAndSetCookie(newUser._id,res);

            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                bio: newUser.bio,
                profilePic: newUser.profilePic
            })
        }else{
            res.status(400).json({error : 'Invalid user data'})
        }
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in signup user: ", err.message)
    }
}

const loginUser = async(req,res) =>{
    try {
        const {username, password} = req.body;

        const user = await User.findOne({username});
        const passwordMatch = await bcrypt.compare(password,user?.password || "");

        if(!user || !passwordMatch){
            return res.status(400).json({error:'Invalid username or password'})
        }

        generateTokenAndSetCookie(user._id,res);
        res.status(200).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            username:user.username,
            bio: user.bio,
            profilePic: user.profilePic
        })
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in login user: ", err.message)
    }
}

const logoutUser = async(req,res) => {
    try {
        res.cookie('jwt', '', {
            maxAge:1,
        })
        res.status(200).json({message: 'User logged out successfully'})
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in logout user: ", err.message)
    }
}

const followUnfollowUser = async(req,res) => {
    try {
        const {id} = req.params;
        const userToModify = await User.findById(id)
        const currentUser = await User.findById(req.user._id)

        if(id === req.user._id.toString()){
            return res.status(400).json({error: 'You cannnot follow/unfollow yourself'});
        }
        if(!userToModify || !currentUser){
            return res.status(400).json({error: 'User not found'});
        }

        const isFollowing = currentUser.following.includes(id)

        if(isFollowing){
            await User.findByIdAndUpdate(req.user._id, {$pull : {following : id}})
            await User.findByIdAndUpdate(id, {$pull : {followers : req.user._id}})
            res.status(200).json({message : 'User unfollowed successfully'})
        }else{
            await User.findByIdAndUpdate(req.user._id, {$push : {following : id}})
            await User.findByIdAndUpdate(id, {$push : {followers : req.user._id}})
            res.status(200).json({message : 'User followed successfully'})
        }
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in followUnfollow: ", err.message)
    }
}

const updateUser = async(req,res) => {
    const {name, email, username, password, bio} = req.body;
    let { profilePic }= req.body
    const userId = req.user._id;
    
    try {
        let user = await User.findById(userId);
        if(!user){
            return res.status(400).json({error: 'User not found'});
        }

        if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

        if(password){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password,salt);
            user.password = hashedPassword
        }

        
        if (profilePic) {
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

        
        user.name = name  || user.name
        user.email = email  || user.email
        user.username = username  || user.username
        user.bio = bio  || user.bio
        user.profilePic = profilePic  || user.profilePic;

        user = await user.save();

        await Post.updateMany(
            {"replies.userId" : userId},
            {
                $set:{
                    "replies.$[reply].username": user.username,
                    "replies.$[reply].userProfilePic": user.profilePic,
                }
            },
            {arrayFilters : [{"reply.userId": userId}]}
        )

        user.password = null

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({error: err.message})
        console.log("Error in updateProfile: ", err.message)
    }
}



module.exports = {signupUser, loginUser, logoutUser, followUnfollowUser, updateUser, getUserProfile}