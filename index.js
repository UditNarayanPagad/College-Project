const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const multer = require("multer");
const { storage, cloudinary } = require("./cloudConfig");
const upload = multer({ storage });
var session = require("express-session");
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const UserModel = require("./models/user");
const PostModel = require("./models/post");
const bodyParser = require("body-parser");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
var flash = require("connect-flash");
const mongoUrl = process.env.MONGO_URL
const mongoConnect = mongoose.connect(mongoUrl);
module.exports = mongoConnect
const store = MongoStore.create({
  mongoUrl: mongoUrl,
  crypto:{
    secret: process.env.SECRET
  },
  touchAfter: 24 * 3600,
})
store.on('error',(err)=>{
  console.log("ERROR on MONGOSESSION STORE",err)
})
app.use(
  session({
    store,
    secret: process.env.SECRET,
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
    let { eventName, details } = req.body;
    let post = new PostModel({
      eventName,
      details,
    });
    try {
      let data = jwt.verify(req.cookies.token, "gggghhhhh");
      req.user = data;
      let email = req.user.email;
      let foundUser = await UserModel.findOne({ email });
      post.photos.push({
        userId: foundUser._id,
        path: req.file.path,
        filename: req.file.filename,
      });
      await post.save();
      foundUser.createdEvent.push(post._id);
      let newPostId = post.photos[post.photos.length - 1]._id;
      console.log(newPostId);
      foundUser.posts.push(newPostId);
      await foundUser.save();
      req.flash("success", "Post created successfully!");
      res.redirect("/");
    } catch (error) {
      console.log("Invalid token", error);
      return res.redirect("/");
    }
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    res.redirect("/");
  }
});
app.get("/details/:id", async (req, res) => {
  let { id } = req.params;
  let post = await PostModel.findOne({ _id: id }).populate("photos.userId");
  if (req.cookies.token) {
    let data = jwt.verify(req.cookies.token, "gggghhhhh");
    req.user = data;
    let email = req.user.email;
    let foundUser = await UserModel.findOne({ email });
    return res.render("details", { post, foundUser });
  } else {
    let foundUser = [];
    res.render("details", { post, foundUser });
  }
});

app.get("/event/:id", isLoggedIn, async (req, res) => {
  let { id } = req.params;
  let post = await PostModel.findOne({ _id: id }).populate("photos.userId");
  res.render("eventUpload", { post });
});

app.post("/event/:id", upload.single("photo"), async (req, res) => {
  try {
    try {
      let { id } = req.params;
      let data = jwt.verify(req.cookies.token, "gggghhhhh");
      req.user = data;
      let email = req.user.email;
      let foundUser = await UserModel.findOne({ email });

      let post = await PostModel.findOne({ _id: id });
      post.photos.push({
        userId: foundUser._id,
        path: req.file.path,
        filename: req.file.filename,
      });
      await post.save();
      let newPostId = post.photos[post.photos.length - 1]._id;
      foundUser.posts.push(newPostId);
      await foundUser.save();
      req.flash("success", "Post created successfully!");
      res.redirect("/");
    } catch (error) {
      console.log("Invalid token", error);
      return res.redirect("/");
    }
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    res.redirect("/");
  }
});
app.post(
  "/delete/:postId/:photoId/:folder/:file",
  isLoggedIn,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { photoId } = req.params;
      const { folder, file } = req.params;
      let filename = folder + "/" + file;
      console.log(filename);

      await PostModel.updateOne(
        { _id: postId },
        { $pull: { photos: { _id: photoId } } }
      )
        .then((result) => {
          console.log("Photo deleted:", result);
        })
        .catch((error) => {
          console.error("Error deleting photo:", error);
        });
      let data = jwt.verify(req.cookies.token, "gggghhhhh");
      req.user = data;
      let email = req.user.email;
      let foundUser = await UserModel.findOne({ email });
      await UserModel.findOneAndUpdate(
        { _id: foundUser._id },
        { $pull: { posts: photoId } }
      );
      try {
        await cloudinary.uploader.destroy(filename);
        console.log("Image deleted from Cloudinary:", filename);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
      req.flash("success", "Photo deleted successfully!");
      res.redirect(`/details/${postId}`);
    } catch (error) {
      console.log(error);
      req.flash("error", "An error occuired while deleting");
    }
  }
);
app.get("/edit/:postId/:postEvent/:postDetails", isLoggedIn, (req, res) => {
  let { postId, postEvent, postDetails } = req.params;
  res.render("edit", { postId, postEvent, postDetails });
});
app.post(
  "/edit/:postId/:postEvent/:postDetails",
  isLoggedIn,
  async (req, res) => {
    try {
      let { postId } = req.params;
      let { eventName, details } = req.body;
      let post = await PostModel.findOne({ _id: postId });
      if (post.eventName !== eventName || post.details !== details) {
        await PostModel.findOneAndUpdate(
          { _id: postId },
          {
            eventName,
            details,
          },
          {
            new: true,
          }
        );
        req.flash("success", "Post updated successfully!");
      } else {
        req.flash("success", "No changes detected, post not updated.");
      }
      res.redirect(`/details/${postId}`);
    } catch (error) {
      console.error(error);
      req.flash("error", "An error occurred while updating the post.");
      res.redirect(`/details/${postId}`);
    }
  }
);
app.get('/aboutUs',(req,res)=>{
  res.render('aboutUs')
})
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

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
