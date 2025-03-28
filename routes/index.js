const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, '../public/uploads');

// 🔐 Simple user
const USER = {
  username: 'admin',
  password: '123456'
};

// 🔒 Auth middleware
function requireLogin(req, res, next) {
  if (req.session.user) next();
  else res.redirect('/login');
}

// 🔑 Login routes
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && password === USER.password) {
    req.session.user = username;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// 📥 Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 🏠 View all files
router.get('/', requireLogin, (req, res) => {
  let files = [];
  if (fs.existsSync(uploadPath)) {
    files = fs.readdirSync(uploadPath).map(file => {
      const stats = fs.statSync(path.join(uploadPath, file));
      return {
        name: file,
        ext: path.extname(file).toLowerCase(),
        date: stats.mtime,
        size: stats.size
      };
    });
  }
  res.render('index', { files });
});

// 📤 Upload files
router.post('/upload', requireLogin, upload.array('files', 20), (req, res) => {
  res.redirect('/');
});

// 🗑 Delete file
router.post('/delete', requireLogin, (req, res) => {
  const file = req.body.filename;
  const filePath = path.join(uploadPath, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.redirect('/');
});

// ✏️ Rename file
router.post('/rename', requireLogin, (req, res) => {
  const oldName = req.body.oldName;
  const newName = req.body.newName;
  const oldPath = path.join(uploadPath, oldName);
  const newPath = path.join(uploadPath, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
  res.redirect('/');
});

module.exports = router;
