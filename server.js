require("dotenv").config();
const express = require("express");
const sanitizeHTML = require("sanitize-html");

const jwt = require("jsonwebtoken");
const marked = require("marked");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");


//* ------ Start SQLite database setup -------
const db = require('better-sqlite3')("OurApp.db"); //* db file is called OurApp.db
db.pragma("journal_mode = WAL"); //* Improve performance/speed

const createTables = db.transaction(() => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING NOT NULL UNIQUE,
    password STRING NOT NULL
    )`)
    .run();
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    createdDate TEXT,
    title STRING NOT NULL,
    body TEXT NOT NULL,
    authorid INTEGER,
    FOREIGN KEY (authorid) REFERENCES users (id)
    )
  `
  ).run();
});
createTables();
//* ------- End database setup ------


const app = express();

const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

//* enable parsing of the req.body  
app.use(express.urlencoded({ extended: false }));


//* enable parsing of cookies
app.use(cookieParser());

//* MARK:Middleware Global - Gets used for every route in the application
app.use(function (req, res, next) {

  //* this make our markdown function available to all routes
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(marked.parse(content), {
      allowedTags: ['p', 'br', "ul", "li", "ol", "strong", "bole", "em", "i", "h1", "h2", "h3", "h4", "h5", "h6"],
      allowedAttributes: {}
    });

  };


  //* this makes errors array available globally to all route handlers
  res.locals.errors = [];

  //* Decode incoming cookies.
  try {

    const decoded = jwt.verify(req.cookies.ourSimpleApp, process.env.JWTSECRET);
    req.user = decoded;

  } catch (err) {
    req.user = false;
  }

  res.locals.user = req.user;
  console.log(req.user);

  next();

});


//*Routes
app.get('/', (req, res) => {
  if (req.user) {
    const postsStatement = db.prepare("SELECT * FROM posts WHERE authorid = ? ORDER BY createdDate DESC");
    const posts = postsStatement.all(req.user.userid);
    return res.render("dashboard", { posts }); //* if user is logged in, return prevents further execution
  }
  res.render("homepage");
});



app.get('/login', (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.clearCookie("ourSimpleApp");
  res.redirect('/');
});

//*  middleware function
function mustBeLoggedIn(req, res, next) {
  if (req.user) { return next(); }
  return res.redirect("/");

}


app.get('/create-post', mustBeLoggedIn, (req, res) => {
  // res.send("Hello Post");
  res.render("create-post");

});

function sharedPostValidation(req) {
  const errors = [];

  if (typeof req.body.title !== "string") req.body.title = '';
  if (typeof req.body.body !== "string") req.body.body = '';

  //* trim - sanitize html
  req.body.title = sanitizeHTML(req.body.title.trim(), { allowedTags: [], allowedAttributes: {} });
  req.body.body = sanitizeHTML(req.body.body.trim(), { allowedTags: [], allowedAttributes: {} });

  if (!req.body.title) errors.push("A title must be provided");
  if (!req.body.body) errors.push("Content must be provided");

  return errors;

}

app.get("/edit-post/:id", mustBeLoggedIn, (req, res) => {
  //* try to look up the post
  const statement = db.prepare(" SELECT * FROM posts WHERE id = ?  ");
  const post = statement.get(req.params.id);

  //* Guard clause, if post not exist
  if (!post) return res.redirect("/");

  //* if not the author, redirect to home page
  if (post.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  //* otherwise, render the edit post template
  res.render("edit-post", { post: post });
});

app.post("/edit-post/:id", mustBeLoggedIn, (req, res) => {
  //* try to look up the post
  const statement = db.prepare(" SELECT * FROM posts WHERE id = ?  ");
  const post = statement.get(req.params.id);

  //* Guard clause, if post not exist
  if (!post) return res.redirect("/");

  //* if not the author, redirect to home page
  if (post.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  //* validate and save to db
  const errors = sharedPostValidation(req);
  if (errors.length) {
    return res.render("edit-post", { errors });
  }


  const updateStatement = db.prepare("UPDATE posts SET title = ?, body = ? WHERE id = ?");
  updateStatement.run(req.body.title, req.body.body, req.params.id);

  res.redirect(`/post/${req.params.id}`);

});

app.post("/delete-post/:id", mustBeLoggedIn, (req, res) => {
  //* try to look up the post
  const statement = db.prepare(" SELECT * FROM posts WHERE id = ?  ");
  const post = statement.get(req.params.id);

  //* Guard clause, if post not exist
  if (!post) return res.redirect("/");

  //* if not the author, redirect to home page
  if (post.authorid !== req.user.userid) {
    return res.redirect("/");
  }

  //* otherwise delete post
  const deleteStatement = db.prepare("DELETE FROM posts WHERE id = ?");
  deleteStatement.run(req.params.id);

  res.redirect("/");


});


app.get("/post/:id", (req, res) => {
  const statement = db.prepare("SELECT posts.*, users.username FROM posts INNER JOIN users ON posts.authorid = users.id WHERE posts.id = ?");
  const post = statement.get(req.params.id);
  console.log("ID", req.params.id);

  if (!post) {
    return res.redirect('/');
  }

  const isAuthor = post.authorid === req.user.userid;
  res.render("single-post", { post, isAuthor });

});

app.post("/create-post", mustBeLoggedIn, (req, res) => {
  const errors = sharedPostValidation(req);
  if (errors.length) {
    return res.render("create-post", { errors });
  }

  //* save post to db
  const ourStatement = db.prepare("INSERT INTO posts (title, body, authorid, createdDate) VALUES (?, ?, ?, ?)");
  const result = ourStatement.run(req.body.title, req.body.body, req.user.userid, new Date().toISOString());

  //* NOTE: req.user is the logged in user extracted from the cookie provided in middleware

  //* Determine id of the newly created post.
  const getPostStatement = db.prepare("SELECT * FROM posts WHERE ROWID = ?");
  const realPost = getPostStatement.get(result.lastInsertRowid);

  console.log('Title:', req.body.title, 'Body:', req.body.body);

  // console.log("Post",getPostStatement);
  // console.log("Real POST",realPost);

  res.redirect(`/post/${realPost.id}`);



});


app.post('/login', (req, res) => {

  let errors = [];
  if (typeof req.body.username !== 'string') req.body.username = "";
  if (typeof req.body.password !== 'string') req.body.password = "";

  if (req.body.username.trim() === '' || req.body.password === '') errors.push(" invalid credentials");
  // if (req.body.password === '') errors.push(" invalid credentials")

  if (errors.length) {
    return res.render("login", { errors });
  }

  const userInQuestionStatement = db.prepare("SELECT * FROM users WHERE USERNAME = ? ");
  const userInQuestion = userInQuestionStatement.get(req.body.username);

  if (!userInQuestion) {
    errors = ["invalid credentials"];
    return res.render("login", { errors });
  }

  const matchOrNot = bcrypt.compareSync(req.body.password, userInQuestion.password);

  if (!matchOrNot) {
    errors = ["invalid credentials"];
    return res.render("login", { errors });
  }

  //* If match, give them a cookie and redirect to home page
  const tokenValue = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, skyColor: 'blue', userid: userInQuestion.id, username: userInQuestion.username }, process.env.JWTSECRET);
  //* expire the token in 24hrs.

  res.cookie("ourSimpleApp", tokenValue, {
    httpOnly: true,           //* deny access to client side js
    secure: true,            //* send cookies only if https connection in production env. Does not apply to local dev env.
    sameSite: "strict",      //* prevents CSRF (cross site request forgery). A malicious subdomain is still a threat.
    maxAge: 1000 * 60 * 60 * 24 //* One day in milliseconds
  });

  res.redirect("/");

});

app.post("/register", (req, res) => {
  const errors = [];
  if (typeof req.body.username !== 'string') req.body.username = "";
  if (typeof req.body.password !== 'string') req.body.password = "";

  req.body.username = req.body.username.trim();

  if (!req.body.username) errors.push("Username must provide a username");
  if (req.body.username && req.body.username.length < 3) errors.push("Username must be at least 3 characters");
  if (req.body.username && req.body.username.length > 10) errors.push("Username can not exceed 10 characters");

  if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/)) errors.push("Username can only contain letters and numbers");

  //* Check if user exists in database
  const usernameStatement = db.prepare("SELECT * FROM users WHERE username = ? ");
  const usernameCheck = usernameStatement.get(req.body.username);
  if (usernameCheck) errors.push("That account already exists");


  if (!req.body.password) errors.push("Password must provide a password");
  if (req.body.password && req.body.password.length < 12) errors.push("Password must be at least 12 characters");
  if (req.body.password && req.body.password.length > 70) errors.push("Password can not exceed 70 characters");


  if (errors.length) {
    return res.render("homepage", { errors });
  }
  // No errors


  // 1. Save the new user into a database
  //* Hash the password
  const salt = bcrypt.genSaltSync(10);
  req.body.password = bcrypt.hashSync(req.body.password, salt);

  //* BAD 
  //* db.prepare("INSERT INTO users (username, password) VALUES (req.body.username, req.body.password)")
  //* We don't ever want to manually concatenate a string of text or generate a string of text when using input values.

  //* GOOD
  const secureStatement = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  const result = secureStatement.run(req.body.username, req.body.password);

  const lookupStatement = db.prepare("SELECT * FROM users WHERE ROWID = ?");
  const ourUser = lookupStatement.get(result.lastInsertRowid);

  //* Someone may try to input a malicious value (sql injection)
  //* use the database itself or the driver, its built in tool to prepare SQL statements 
  //* "?" is the driver provide by better-sqlite3. It will prepare a SQL statement for us 

  // Log the user in by issuing a cookie
  //* res.cookie(name/label for cookie, *value*, {configuration object}) - 
  //* Note: the value should secure, not easily compromised.
  //* we will use "json web tokens", rather than 'sessions' to create the value.
  //* the client (web browser) sends all cookies back to the server on every request or refresh.
  //* the cookie value can be verified as legitimate. Originated from the server

  const tokenValue = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, skyColor: 'blue', userid: ourUser.id, username: ourUser.username }, process.env.JWTSECRET);

  //* expire the token in 24hrs.

  res.cookie("ourSimpleApp", tokenValue, {
    httpOnly: true,           //* deny access to client side js
    secure: true,            //* send cookies only if https connection in production env. Does not apply to local dev env.
    sameSite: "strict",      //* prevents CSRF (cross site request forgery). A malicious subdomain is still a threat.
    maxAge: 1000 * 60 * 60 * 24 //* One day in milliseconds
  });

  res.redirect("/");


});

//* Backend Server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});