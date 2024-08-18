const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const multer = require("multer");
const { storage } = require("./cloudConfig");
const upload = multer({ storage });
var session = require("express-session");
const UserModel = require("./models/user");
const PostModel = require("./models/post");
const bodyParser = require("body-parser");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
var flash = require("connect-flash");
app.use(
  session({
    secret: "mysecretstring",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});
app.set("view engine", "ejs"); //set path
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
const { v4: uuidv4 } = require("uuid");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", async (req, res) => {
  let tok = req.cookies.token;
  let posts = await PostModel.find();
  res.render("index.ejs", { tok, posts });
});
// app.get("/home", (req, res) => {
//   res.render("index.ejs", { data,tok });
// });
app.get("/signUp", (req, res) => {
  res.render("signUp.ejs");
});
app.post("/signUp", async (req, res) => {
  try {
    let { username, email, password } = req.body;
    let foundUser = await UserModel.findOne({ username });
    if (foundUser) {
      req.flash("error", "User has already registered");
      return res.redirect("/signUp");
    }

    bcrypt.genSalt(10, function (err, salt) {
      if (err) throw err;

      bcrypt.hash(password, salt, async function (err, hash) {
        if (err) throw err;
        let user = new UserModel({
          username,
          email,
          password: hash,
        });
        await user.save();
        var token = jwt.sign({ email: email, userId: user._id }, "gggghhhhh");
        res.cookie("token", token);
        req.flash("success", "Successfully account created!");
        res.redirect("/");
      });
    });
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    return res.redirect("/signUp");
  }
});

app.get("/signIn", (req, res) => {
  res.render("signIn.ejs");
});
app.post("/signIn", async (req, res) => {
  try {
    let { email, password } = req.body;
    let foundUser = await UserModel.findOne({ email });
    if (!foundUser) {
      req.flash("error", "Email not found");
      return res.redirect("/signIn");
    }
    bcrypt.compare(password, foundUser.password, function (err, result) {
      if (err) {
        console.log(err);
        req.flash("error", "An error occuired on sign in");
        return res.redirect("/signIn");
      }
      if (result) {
        var token = jwt.sign(
          { email: foundUser.email, userId: foundUser._id },
          "gggghhhhh"
        );
        res.cookie("token", token);
        req.flash("success", "Successfully logged in!");
        res.redirect("/");
      } else {
        req.flash("error", "email or password is incorrect!");
        res.redirect("/signIn");
      }
    });
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    return res.redirect("/signIn");
  }
});
app.get("/signOut", (req, res) => {
  res.cookie("token", "");
  req.flash("success", "Successfully signed out!");
  res.redirect("/");
});
app.get("/upload", isLoggedIn, (req, res) => {
  res.render("upload.ejs");
});
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    let { eventName, details, createdDate } = req.body;
    let post = new PostModel({
      eventName,
      details,
      createdDate,
    });
    try {
      let data = jwt.verify(req.cookies.token, "gggghhhhh");
      req.user = data;
      let email = req.user.email;
      let foundUser = await UserModel.findOne({ email });
      post.userId = foundUser._id;
      let path = req.file.path;
      let filename = req.file.filename;
      post.photo = { path, filename };
      await post.save();
      foundUser.posts.push(post._id);
      await foundUser.save();
      req.flash("success", "Post created successfully!");
      res.redirect("/");
    } catch (error) {
      console.log("Invalid token");
      return res.redirect("/signIn");
    }
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    res.redirect("/");
  }
});
function isLoggedIn(req, res, next) {
  if (!req.cookies.token) {
    req.flash("error", "You have to sign in first!");
    return res.redirect("/signIn");
  } else {
    try {
      let data = jwt.verify(req.cookies.token, "gggghhhhh");
      req.user = data;
    } catch (error) {
      console.log("Invalid token");
      return res.redirect("/signIn");
    }
  }
  next();
}
app.post("/home", (req, res) => {
  let { event, image, info, name } = req.body;
  let id = uuidv4();
  data.push({ id, image: [image], event, info });
  // data.image.push(image);
  res.redirect("/home");
});
app.get("/home/:id/upload", (req, res) => {
  let { id } = req.params;
  let post = data.find((p) => id === p.id);
  res.render("idUpload", { post });
});
app.post("/home/:id", (req, res) => {
  let { photo, name } = req.body;
  let { id } = req.params;
  let post = data.find((p) => id === p.id);
  post.image.push(photo);
  res.redirect(`/home/${id}`);
});
app.get("/home/:id", (req, res) => {
  let { id } = req.params;
  let post = data.find((p) => id === p.id);
  res.render("details", { post });
});
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
