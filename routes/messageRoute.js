const express = require('express');
const protectRoute = require('../middleware/protectRoute');
const { sendMessage, getMessages, getConvos } = require('../controllers/messageController');
const router = express.Router();

router.get('/conversations', protectRoute, getConvos)
router.get('/:otherUserId', protectRoute, getMessages)
router.post('/', protectRoute, sendMessage)




module.exports = router;