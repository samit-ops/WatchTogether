const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', roomController.createRoom);
router.get('/:roomId', roomController.getRoom);
router.post('/leave', roomController.leaveRoom);
router.delete('/:roomId', roomController.deleteRoom);

module.exports = router;
