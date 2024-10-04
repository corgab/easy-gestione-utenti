const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejsLayouts = require('express-ejs-layouts');
const db = require('./models/db');
const userRouter = require('./routes/userRoutes')(db);
const postsRouter = require('./routes/postRouter')(db);
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Per servire file statici
app.use(cookieParser());
app.use(ejsLayouts);

// Templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.userId = req.cookies.userId || null;
  next();
});

// Rotta principale
app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

// Utilizza il router
app.use('/', userRouter);
app.use('/', postsRouter);

// Avvia il server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
