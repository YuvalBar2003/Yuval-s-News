const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { isAuthenticated, isReporter } = require('../middleware/auth');

router.use(isAuthenticated, isReporter);

router.get('/', articleController.getReporterDashboard);

router.post('/new', articleController.createNewArticle);

router.get('/edit/:id', articleController.getEditArticlePage);

router.post('/autosave/:id', articleController.autoSaveArticle);

router.post('/submit/:id', articleController.submitForReview);

router.post('/delete/:id', articleController.deleteArticle);

module.exports = router;