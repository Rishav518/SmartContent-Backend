const express = require('express');
const blogController = require('../controllers/blog.controller');

const router = express.Router();

router.get('/posts/categories', blogController.getCategories);
router.get('/posts/stats', blogController.getStats);
router.get('/posts/slugs', blogController.getAllSlugs);
router.get('/posts/slug/:slug', blogController.getPostBySlug);
router.get('/posts', blogController.getPosts);
router.get('/posts/:id', blogController.getPostById);

router.post('/generate', blogController.generatePost);
router.post('/generate-batch', blogController.generateBatch);
router.post('/run-scheduler', blogController.runSchedulerNow);

router.patch('/posts/:id/status', blogController.updatePostStatus);
router.patch('/generate-slug', blogController.generateSlug);
router.patch('/posts/publish-all', blogController.publishAllPosts);

module.exports = router;