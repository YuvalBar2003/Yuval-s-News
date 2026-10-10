const Article = require('../models/Article');
const Comment = require('../models/Comment');
const ViewStat = require('../models/ViewStat');

const commentRateLimits = new Map();

let weatherCache = { data: null, lastFetch: 0 };

async function fetchWeatherData() {
  const now = Date.now();
  if (weatherCache.data && (now - weatherCache.lastFetch < 15 * 60 * 1000)) {
    return weatherCache.data;
  }
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=32.0853&longitude=34.7818&current_weather=true');
    const data = await response.json();
    if (data && data.current_weather) {
      weatherCache = {
        data: {
          city: 'תל אביב',
          temp: Math.round(data.current_weather.temperature),
          windspeed: data.current_weather.windspeed
        },
        lastFetch: now
      };
      return weatherCache.data;
    }
  } catch (err) {
    console.error('Weather fetch error:', err.message);
  }
  return weatherCache.data || { city: 'תל אביב', temp: 24, windspeed: 10 };
}

exports.getHomePage = async (req, res) => {
  try {
    const weather = await fetchWeatherData();
    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(20);

    const currentUser = req.session ? req.session.user : null;

    res.render('public/home', { articles, weather, currentUser });
  } catch (err) {
    res.status(500).send('שגיאה בטעינת עמוד הבית: ' + err.message);
  }
};

exports.getArticlesApi = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const { category, search, sort } = req.query;
    const query = { status: 'published' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    let sortOptions = { publishedAt: -1 };
    if (sort === 'popular') {
      sortOptions = { viewsCount: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { publishedAt: 1 };
    }

    const articles = await Article.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.json({ success: true, articles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getArticlePage = async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, status: 'published' });
    if (!article) return res.status(404).send('הכתבה לא נמצאה או שאינה מפורסמת');

    article.viewsCount = (article.viewsCount || 0) + 1;
    await article.save();

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hour = now.getHours();

    await ViewStat.findOneAndUpdate(
      { article: article._id, date: dateStr, hour: hour },
      { $inc: { views: 1 }, $setOnInsert: { category: article.category } },
      { upsert: true }
    );

    const comments = await Comment.find({ article: article._id, status: 'approved' }).sort({ createdAt: -1 });

    res.render('public/article', {
      article,
      comments,
      user: req.session ? req.session.user : null
    });
  } catch (err) {
    res.status(500).send('שגיאה בטעינת הכתבה: ' + err.message);
  }
};

exports.postComment = async (req, res) => {
  const { authorName, content } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress || 'guest';
  const now = Date.now();

  const userHistory = commentRateLimits.get(clientIp) || [];
  const recentComments = userHistory.filter(timestamp => now - timestamp < 60 * 1000);

  if (recentComments.length >= 3) {
    return res.status(429).json({ success: false, message: 'הגעת למגבלת התגובות (מקסימום 3 תגובות בדקה).' });
  }

  recentComments.push(now);
  commentRateLimits.set(clientIp, recentComments);

  try {
    const newComment = new Comment({
      article: req.params.id,
      authorName: authorName.trim() || 'אורח',
      content: content.trim(),
      status: 'approved'
    });
    await newComment.save();

    res.json({
      success: true,
      comment: {
        _id: newComment._id,
        authorName: newComment.authorName,
        content: newComment.content,
        createdAt: newComment.createdAt.toLocaleString('he-IL')
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'שגיאה בשמירת התגובה' });
  }
};

exports.getArticleAnalyticsApi = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false });

    const stats = await ViewStat.find({ article: article._id }).sort({ date: 1, hour: 1 });
    res.json({
      success: true,
      stats,
      updateEvents: article.updateEvents || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};