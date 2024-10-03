const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejsLayouts = require('express-ejs-layouts');
const db = require('./models/db'); 
const userRouter = require('./routes/userRoutes')(db);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Per servire file statici

app.use(ejsLayouts);

// Templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
console.log(__dirname)

// Rotta principale
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// Utilizza il router
app.use('/', userRouter);

// Avvia il server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
