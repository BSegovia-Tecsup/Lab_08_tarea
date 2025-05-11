require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'secreto',
  resave: false,
  saveUninitialized: true
}));

const leerUsuarios = () => {
  const data = fs.readFileSync('./usuarios.json');
  return JSON.parse(data);
};

const guardarUsuarios = (usuarios) => {
  fs.writeFileSync('./usuarios.json', JSON.stringify(usuarios, null, 2));
};

app.get('/', (req, res) => {
  if (req.session.usuario) {
    return res.redirect('/bienvenida');
  }
  res.redirect('/login');
});

app.get('/registro', (req, res) => {
  res.render('registro');
});

app.post('/registro', async (req, res) => {
  const { usuario, email, password, rol } = req.body;
  const usuarios = leerUsuarios();
  const existe = usuarios.find(u => u.usuario === usuario);
  if (existe) return res.send('El usuario ya existe');
  const hash = await bcrypt.hash(password, 10);
  usuarios.push({ usuario, email, password: hash, rol });
  guardarUsuarios(usuarios);
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  const usuarios = leerUsuarios();
  const user = usuarios.find(u => u.usuario === usuario);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send('Usuario o contraseña incorrectos');
  }
  req.session.usuario = { nombre: user.usuario, rol: user.rol };
  res.redirect('/bienvenida');
});

app.get('/bienvenida', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');
  res.render('bienvenida', { usuario: req.session.usuario });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
