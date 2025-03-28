const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, '../public/uploads');

// Simple hardcoded user
const USER = {
  username: 'admin',
  password: '123456'
};

// Middleware to protect routes
function requireLogin(req, res, next) {
  if (req.session.user) next();
  else res.redirect('/login');
}

// --- AUTH ROUTES ---

// Login form
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && password === USER.password) {
    req.session.user = username;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// --- FILE UPLOAD ---

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- MAIN ROUTES ---

// Home - show all files
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
      }).sort((a, b) => b.date - a.date); // 👈 Sort newest first
  }
  res.render('index', { files });
});

// Upload files
router.post('/upload', requireLogin, upload.array('files', 20), (req, res) => {
  res.redirect('/');
});

// Rename file
router.post('/rename', requireLogin, (req, res) => {
    const { oldName, newName } = req.body;
    const oldPath = path.join(uploadPath, oldName);
    const newPath = path.join(uploadPath, newName);
  
    // Prevent deleting if newName is empty or same
    if (!newName || !oldName || oldName === newName || !fs.existsSync(oldPath)) {
      return res.redirect('/');
    }
  
    fs.renameSync(oldPath, newPath);
    res.redirect('/');
  });

// Delete multiple files
router.post('/delete-multiple', requireLogin, (req, res) => {
    const files = Array.isArray(req.body.files) ? req.body.files : [req.body.files];
  
    files.forEach(filename => {
      const filePath = path.join(uploadPath, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  
    res.redirect('/');
  });
  
module.exports = router;
