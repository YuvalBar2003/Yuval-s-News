require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Article = require('./models/Article');
const Comment = require('./models/Comment');
const ViewStat = require('./models/ViewStat');

async function seedData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('מחובר למסד הנתונים, מתחיל איפוס והזנת נתונים...');

  await User.deleteMany({});
  await Article.deleteMany({});
  await ViewStat.deleteMany({});
  await Comment.deleteMany({});

  const hashedPassword = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGgTbm4.1VdaeXE.e';

  const [editor, reporter1, reporter2] = await User.insertMany([
    { username: 'editor1', password: hashedPassword, role: 'editor' },
    { username: 'reporter1', password: hashedPassword, role: 'reporter' },
    { username: 'reporter2', password: hashedPassword, role: 'reporter' }
  ]);

  const reporters = [reporter1, reporter2];
  const categories = ['חדשות', 'ספורט', 'כלכלה', 'טכנולוגיה', 'תרבות'];
  const todayStr = new Date().toISOString().split('T')[0];

  const articlesToInsert = [];

  const demoProfiles = [
    {
      idIndex: 1,
      title: 'כתבה 1',
      updates: [12],
      pattern: (h) => (h < 12 ? Math.floor(Math.random() * 8) + 4 : Math.floor(Math.random() * 35) + 60)
    },
    {
      idIndex: 2,
      title: 'כתבה 2)',
      updates: [10, 16],
      pattern: (h) => {
        if (h < 10) return Math.floor(Math.random() * 6) + 3;
        if (h < 16) return Math.floor(Math.random() * 15) + 25;
        return Math.floor(Math.random() * 40) + 75;
      }
    },
    {
      idIndex: 3,
      title: 'כתבה 3',
      updates: [],
      pattern: (h) => Math.floor(Math.random() * 12) + 15
    },
    {
      idIndex: 4,
      title: 'כתבה 4',
      updates: [17],
      pattern: (h) => (h < 17 ? Math.floor(Math.random() * 10) + 8 : Math.floor(Math.random() * 45) + 80)
    },
    {
      idIndex: 5,
      title: 'כתבה 5',
      updates: [9],
      pattern: (h) => {
        if (h < 9) return 5;
        if (h === 9) return 70;
        return Math.max(10, 70 - (h - 9) * 5 + Math.floor(Math.random() * 8));
      }
    },
    {
      idIndex: 6,
      title: 'כתבה 6',
      updates: [13, 15],
      pattern: (h) => {
        if (h < 13) return Math.floor(Math.random() * 7) + 5;
        if (h < 15) return Math.floor(Math.random() * 15) + 35;
        return Math.floor(Math.random() * 30) + 85;
      }
    }
  ];

  for (const prof of demoProfiles) {
    const updateEvents = prof.updates.map(hour => {
      const d = new Date();
      d.setHours(hour, 0, 0, 0);
      return { updatedAt: d, note: `אישור עדכון בשעה ${hour}:00` };
    });

    articlesToInsert.push({
      title: prof.title,
      summary: `כתבה המדגימה התנהגות ייחודית של צפיות ואירועי עדכון עורך.`,
      content: `תוכן מלא עבור ${prof.title}.`,
      category: categories[prof.idIndex % categories.length],
      imageUrl: '/image.png',
      author: reporters[prof.idIndex % reporters.length]._id,
      authorName: reporters[prof.idIndex % reporters.length].username,
      status: 'published',
      updateEvents: updateEvents,
      viewsCount: 0,
      publishedAt: new Date(Date.now() - prof.idIndex * 3600000)
    });
  }

  for (let i = 7; i <= 500; i++) {
    const cat = categories[i % categories.length];
    const authorObj = reporters[i % reporters.length];

    let stat = 'published';
    if (i > 450) stat = 'pending';
    else if (i > 410) stat = 'draft';
    else if (i > 390) stat = 'changes_requested';

    articlesToInsert.push({
      title: `כתבה לדוגמה מספר ${i} בנושא ${cat}`,
      summary: `תקציר כתבה ${i}`,
      content: `תוכן מלא עבור כתבה מספר ${i}.`,
      category: cat,
      imageUrl: '/image.png',
      author: authorObj._id,
      authorName: authorObj.username,
      status: stat,
      editorFeedback: stat === 'changes_requested' ? 'נדרש להרחיב את הכתבה' : '',
      updateEvents: [],
      viewsCount: Math.floor(Math.random() * 50) + 1,
      publishedAt: new Date(Date.now() - i * 3600000)
    });
  }

  const createdArticles = await Article.insertMany(articlesToInsert);
  console.log(` ${createdArticles.length} created successfully`);

  const statsToInsert = [];
  for (let idx = 0; idx < 10; idx++) {
    const art = createdArticles[idx];
    const prof = demoProfiles[idx];
    let totalViews = 0;

    for (let h = 8; h <= 21; h++) {
      let count = 0;
      if (prof) {
        count = prof.pattern(h);
      } else {
        count = Math.floor(Math.random() * 25) + 15;
      }

      totalViews += count;
      statsToInsert.push({
        article: art._id,
        category: art.category,
        date: todayStr,
        hour: h,
        views: count
      });
    }

    await Article.findByIdAndUpdate(art._id, { viewsCount: totalViews });
  }

  await ViewStat.insertMany(statsToInsert);
  console.log('View data has been generated.');

  const commentsToInsert = [];
  for (let idx = 0; idx < 10; idx++) {
    commentsToInsert.push({
      article: createdArticles[idx]._id,
      authorName: 'יובל בר',
      content: 'מעניין!',
      status: 'approved'
    });
  }
  await Comment.insertMany(commentsToInsert);

  console.log('successfully finished entering all demo data!');
  process.exit();
}

seedData().catch(err => {
  console.error(err);
  process.exit(1);
});