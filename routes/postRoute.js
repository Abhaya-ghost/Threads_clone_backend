const express = require('express');
const { createPost, getPosts, deletePost, likeUnlikePost, replyPost, getFeedPosts, getUserPosts } = require('../controllers/postController');
const protectRoute = require('../middleware/protectRoute');
const router = express.Router();

router.get('/feed',protectRoute, getFeedPosts);
router.get('/:id', getPosts);
router.get('/user/:username', getUserPosts);
router.post('/create', protectRoute,createPost); 
router.delete('/:id', protectRoute,deletePost);
router.put('/like/:id', protectRoute, likeUnlikePost);
router.put('/reply/:id', protectRoute, replyPost);

module.exports = router;