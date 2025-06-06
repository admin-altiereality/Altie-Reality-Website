require("dotenv").config();
const signUpModel = require("../mongooseschema").signUpModel;
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//Note::when generating the token or when login each time new token is generated but when the tokens are verified using verify function then they returns an object with id with which it was created and an iat number and since all the generated using same id for a user so all will return same id or same user ...
let auth = async (req, res, next) => {
  try {
    // if user signed up using email and not google
    if (req.cookies.jwt) {
      let tokenwithuser = req.cookies.jwt;
      const objectwithuserid = await jwt.verify(
        tokenwithuser,
        process.env.SECRET_KEY
      ); //returns an object containing_id that was used to create this one or in simple word can say that the id given to user and iat
      await signUpModel.findOne({ _id: objectwithuserid._id }).then((user) => {
        if (!user || user === null) {
          return res.rediret("login");
        }
        let fname = user["name"].split(" ")[0];

        // Only set user.picture if it exists
        let userObj = { fullname: user.name, email: user.email, fname };
        if (user.picture) {
          userObj.picture = user.picture;
        }
        req.user = userObj;
        next();
      }); //got the user using its id and now the data can be used on the pages or somethign
    }
    //  for google auth( if user signed using google )
    else if (req.cookies["google-token"]) {
      let token = req.cookies["google-token"];

      let user = {};
      async function verify() {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        let firstname = payload["given_name"].split(" ")[0];
        user.fullname = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
        user.fname = firstname;
      }
      verify()
        .then(() => {
          req.user = user;
          next();
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    } else {
      console.log("in else part mai hai");
      if (
        req.url === "/" ||
        req.url === "/contactus" ||
        req.url === "/aboutus" ||
        req.url === "/ourteam"||
	      req.url==="/login"
      )
        next();
      else {
        console.log("redirected to login");
        res.redirect("/login");
      }
    }
  } catch (error) {
    console.log(error);
    res.render("login");
  }
};

module.exports = auth;
