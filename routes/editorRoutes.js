const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { isAuthenticated, isEditor } = require('../middleware/auth');

router.use(isAuthenticated, isEditor);

router.get('/', articleController.getEditorDashboard);
router.post('/approve/:id', articleController.approveArticle);
router.post('/reject/:id', articleController.rejectArticle);

router.post('/comment/update/:id', articleController.updateCommentStatus);
router.post('/comment/delete/:id', articleController.deleteComment);

module.exports = router;