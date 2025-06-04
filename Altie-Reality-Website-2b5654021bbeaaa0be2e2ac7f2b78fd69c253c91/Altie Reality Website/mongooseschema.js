require("dotenv").config();
const mongoose = require("mongoose");
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const signUpSchema = new mongoose.Schema({
  name: {
    type: "String",
    required: [true, "name is required"],
    trim: true,
    lowercase: true,
  },
  email: {
    type: "String",
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
  number: {
    type: "Number",
    required: [true, "mobile number is required "],
    unique: true,
    trim: true,
    validate: [
      (value) => {
        if (value.toString().length !== 10) {
          return false;
        }
        return true;
      },
      "invalid number ",
    ],
  },

  password: {
    type: "String",
    required: [true, "password is required"],
    minlength: 8,
    trim: true,
  },
  type: String,
  picture: String,
  resettoken: String,
  tokenexpiry: Date,
  Emailverified: {
    type: Boolean,
    default: false,
  },
  resetpasswordtoken: String,
  tokens: [
    {
      token: {
        type: "String",
      },
    },
  ],
});

//to generate the token and save it to the database
//creating a method or function for schema
signUpSchema.methods.generateToken = async function () {
  try {
    let token = await jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
    console.log(token + "is generated ");
    //now need to add the token generated to database

    this.tokens = this.tokens.concat({ token: token }); //to add the value of token to schema
    // await this.save();//saves the token to database everytime someone signups or sign in ...each session will have different token
    //now i am removing this above part as i don't want multiple token as each token returns same id and authenticates the user....without this only the token of signup will be saved to databse ..there isn't any actual use to save it to database cause all verifcation and generation takes place with the secret keys and cookie and does not involve database...we are saving even 1 if we need it sometime

    return token;
  } catch (error) {
    console.log(error + "  error is in token generation");
  }
};

//For using bcrypt hashing ...we are using here pre function which takes first parameter as the fucntion of mongoose jisse pehle is function k andar ka kaam karna hai
signUpSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    //only do this when password is modified means a new user or when password is changed
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
const signUpModel = new mongoose.model("userdata", signUpSchema);

// For Google Signin
const googlesignUpSchema = new mongoose.Schema({
  name: String,
  email: String,
  type: String,
  picture: String,
});
const googlesignUpModel = new mongoose.model(
  "googleuserdata",
  googlesignUpSchema
);
module.exports.signUpModel = signUpModel;
module.exports.googlesignUpModel = googlesignUpModel;
