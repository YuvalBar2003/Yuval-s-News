const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/', publicController.getHomePage);
router.get('/api/articles', publicController.getArticlesApi);
router.get('/api/analytics/:id', publicController.getArticleAnalyticsApi);
router.get('/article/:id', publicController.getArticlePage);
router.post('/article/:id/comment', publicController.postComment);

module.exports = router;