const Article = require('../models/Article');
const Comment = require('../models/Comment');
const ViewStat = require('../models/ViewStat');

exports.getReporterDashboard = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.session.user._id }).sort({ updatedAt: -1 });
    res.render('reporter/dashboard', { articles, user: req.session.user });
  } catch (err) {
    res.status(500).send('שגיאה בטעינת הכתבות: ' + err.message);
  }
};

exports.createNewArticle = async (req, res) => {
  try {
    const newArticle = new Article({
      title: 'כתבה ללא כותרת',
      content: '',
      summary: '',
      category: 'חדשות',
      author: req.session.user._id,
      authorName: req.session.user.username,
      status: 'draft'
    });
    const saved = await newArticle.save();
    res.redirect(`/reporter/edit/${saved._id}`);
  } catch (err) {
    res.status(500).send('שגיאה ביצירת כתבה: ' + err.message);
  }
};

exports.getEditArticlePage = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).send('הכתבה לא נמצאה');

    if (article.author.toString() !== req.session.user._id) {
      return res.status(403).send('אינך מורשה לערוך כתבה זו');
    }

    res.render('reporter/edit', { article });
  } catch (err) {
    res.status(500).send('שגיאה בטעינת הכתבה: ' + err.message);
  }
};

exports.autoSaveArticle = async (req, res) => {
  const { title, summary, category, imageUrl, content } = req.body;
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: 'הכתבה לא נמצאה' });

    if (article.author.toString() !== req.session.user._id) {
      return res.status(403).json({ success: false, message: 'אין הרשאה' });
    }

    if (article.status === 'published') {
      article.draftVersion = {
        title,
        summary,
        category,
        imageUrl,
        content,
        lastSavedAt: new Date()
      };
    } else {
      article.title = title || article.title;
      article.summary = summary;
      article.category = category;
      article.imageUrl = imageUrl || article.imageUrl;
      article.content = content;
    }

    await article.save();
    res.json({ success: true, lastSaved: new Date().toLocaleTimeString('he-IL') });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.submitForReview = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).send('הכתבה לא נמצאה');

    if (article.author.toString() !== req.session.user._id) {
      return res.status(403).send('אין הרשאה');
    }

    article.status = 'pending';
    await article.save();

    res.redirect('/reporter');
  } catch (err) {
    res.status(500).send('שגיאה בשליחת הכתבה: ' + err.message);
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).send('כתבה לא נמצאה');

    if (article.author.toString() !== req.session.user._id) {
      return res.status(403).send('אין הרשאה');
    }

    await ViewStat.deleteMany({ article: req.params.id });
    await Comment.deleteMany({ article: req.params.id });
    await Article.findByIdAndDelete(req.params.id);

    res.redirect('/reporter');
  } catch (err) {
    res.status(500).send('שגיאה במחיקת הכתבה: ' + err.message);
  }
};

exports.getEditorDashboard = async (req, res) => {
  try {
    const pendingArticles = await Article.find({ status: 'pending' }).sort({ updatedAt: -1 });
    const publishedArticles = await Article.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(10);

    const topArticles = await Article.find({ status: 'published' }).sort({ viewsCount: -1 }).limit(5);

    const categoryStats = await ViewStat.aggregate([
      {
        $group: {
          _id: '$category',
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { totalViews: -1 } }
    ]);

    const totalViewsAgg = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, total: { $sum: '$viewsCount' } } }
    ]);
    const totalViews = totalViewsAgg.length > 0 ? totalViewsAgg[0].total : 0;

    res.render('editor/dashboard', {
      pendingArticles,
      publishedArticles,
      topArticles,
      categoryStats,
      totalViews,
      user: req.session.user
    });
  } catch (err) {
    res.status(500).send('שגיאה בטעינת דשבורד עורך: ' + err.message);
  }
};

exports.approveArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).send('הכתבה לא נמצאה');

    const isAlreadyPublished = Boolean(article.publishedAt);

    if (article.draftVersion && article.draftVersion.title) {
      article.title = article.draftVersion.title;
      article.summary = article.draftVersion.summary;
      article.category = article.draftVersion.category;
      article.imageUrl = article.draftVersion.imageUrl;
      article.content = article.draftVersion.content;
      article.draftVersion = undefined;
    }

    if (isAlreadyPublished) {
      if (!article.updateEvents) {
        article.updateEvents = [];
      }
      article.updateEvents.push({
        updatedAt: new Date(),
        note: 'פרסום עדכון עורך'
      });
    } else {
      article.publishedAt = new Date();
    }

    article.status = 'published';
    article.editorFeedback = '';
    await article.save();

    res.redirect('/editor');
  } catch (err) {
    res.status(500).send('שגיאה באישור הכתבה: ' + err.message);
  }
};

exports.rejectArticle = async (req, res) => {
  const { feedback } = req.body;
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).send('הכתבה לא נמצאה');

    article.status = 'changes_requested';
    article.editorFeedback = feedback || 'נדרשים תיקונים בכתבה זו';
    await article.save();

    res.redirect('/editor');
  } catch (err) {
    res.status(500).send('שגיאה בהחזרת הכתבה: ' + err.message);
  }
};

exports.updateCommentStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'תגובה לא נמצאה' });

    comment.status = status || 'approved';
    await comment.save();

    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'תגובה לא נמצאה' });

    res.json({ success: true, message: 'תגובה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};