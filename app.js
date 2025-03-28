const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const uploadDir = path.join(__dirname, 'public/uploads');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'my_file_manager_secret',
  resave: false,
  saveUninitialized: false
}));

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
