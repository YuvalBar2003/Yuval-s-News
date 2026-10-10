const User = require('../models/User');

exports.getLoginPage = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(req.session.user.role === 'editor' ? '/editor' : '/reporter');
  }
  res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { error: 'שם משתמש או סיסמה שגויים' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', { error: 'שם משתמש או סיסמה שגויים' });
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      role: user.role
    };

    if (user.role === 'editor') {
      res.redirect('/editor');
    } else {
      res.redirect('/reporter');
    }
  } catch (err) {
    res.render('login', { error: 'שגיאה בהתחברות: ' + (err.message || err) });
  }
};

exports.getRegisterPage = (req, res) => {
  res.render('register', { error: null });
};

exports.postRegister = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { error: 'שם המשתמש כבר קיים במערכת' });
    }

    const newUser = new User({ username, password, role });
    await newUser.save();

    res.redirect('/login');
  } catch (err) {
    res.render('register', { error: 'שגיאה ביצירת משתמש: ' + (err.message || err) });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'אינך מחובר' });
    }

    const { newPassword } = req.body;
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'משתמש לא נמצא' });
    }

    if (newPassword && newPassword.trim() !== '') {
      user.password = newPassword.trim();
      await user.save();
    }

    res.json({ success: true, message: 'הפרופיל עודכן בהצלחה' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'אינך מחובר' });
    }

    await User.findByIdAndDelete(req.session.user._id);

    req.session.destroy(() => {
      res.json({ success: true, message: 'החשבון נמחק בהצלחה' });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};