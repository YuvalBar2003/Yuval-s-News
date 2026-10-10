require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const reporterRoutes = require('./routes/reporterRoutes');
const editorRoutes = require('./routes/editorRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// שמירת לוגים
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[LOG - ${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'daily_web_secure_secret_key_12345',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true
  }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[LOG] MongoDB Connected Successfully!');
  })
  .catch((err) => {
    console.error('[ERROR] MongoDB Connection Error:', err.message);
  });

app.use('/', authRoutes);
app.use('/reporter', reporterRoutes);
app.use('/editor', editorRoutes);
app.use('/', publicRoutes);

app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR - ${timestamp}] Unhandled error at ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  res.status(500).send('אירעה שגיאה פנימית בשרת');
});

app.listen(PORT, () => {
  console.log(`[LOG] Server is running on port ${PORT}`);
});