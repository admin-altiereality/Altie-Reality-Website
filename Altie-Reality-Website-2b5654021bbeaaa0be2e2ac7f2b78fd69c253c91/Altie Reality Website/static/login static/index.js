let signbtn = document.getElementById("signbtn");
let signinbtn = document.getElementById("signinbtn");
let container = document.querySelector(".container1");
let signup = document.querySelector(".signup");
let signin = document.querySelector(".login");
signbtn.addEventListener("click", () => {
  container.classList.add("change");

  container.classList.remove("nochange");
  signup.style.display = "flex";
  signin.style.display = "none";
});
signinbtn.addEventListener("click", () => {
  container.classList.remove("change");
  container.classList.add("nochange");
  signup.style.display = "none";
  signin.style.display = "flex";
});

//js for validating the form is here
let errorsign1 = document.querySelector(".errorsign1");
let errortext1 = document.querySelector(".errortext1");
let errorsign2 = document.querySelector(".errorsign2");
let errortext2 = document.querySelector(".errortext2");
let errorsign3 = document.querySelector(".errorsign3");
let errortext3 = document.querySelector(".errortext3");
let errorsign4 = document.querySelector(".errorsign4");
let errortext4 = document.querySelector(".errortext4");
let errorsign5 = document.querySelector(".errorsign5");
let errortext5 = document.querySelector(".errortext5");
let errorsign6 = document.querySelector(".errorsign6");
let errortext6 = document.querySelector(".errortext6");
// let namediv = document.getElementById('namediv');
// let emaildiv = document.getElementById('emaildiv');
// let messagediv = document.getElementById('messagediv');

// let namelabel1 = contactform.querySelector('label[for="name"]')
// let emaillabel1 = contactform.querySelector('label[for="email"]')

let nameinput = document.querySelector("#name");
let email1input = document.querySelector("#email1");
let numberinput = document.querySelector("#number");
let password1input = document.querySelector("#password1");
let email2input = document.querySelector("#email2");
let password2input = document.querySelector("#password2");

email1input.value = "";
password1input.value = "";
numberinput.value = "";
nameinput.value = "";

password2input.value = "";
email2input.value = "";

//the change function
function dothechangerequired(
  errorsign,
  errortext,
  inputhere,
  placeholdervalue
) {
  if (inputhere.value === "") {
    errorsign.style.visibility = "visible";
    errortext.style.visibility = "visible";
    inputhere.placeholder = "";
    setTimeout(() => {
      errorsign.style.visibility = "hidden";
      errortext.style.visibility = "hidden";
      inputhere.placeholder = placeholdervalue;
    }, 2000);
  }
}
//function called by the form onsubmit sign in vaala forms
function submitchecklogin() {
  if (email2input.value === "" || password2input.value === "") {
    dothechangerequired(errorsign5, errortext5, email2input, "Enter Email Id");
    dothechangerequired(
      errorsign6,
      errortext6,
      password2input,
      "Enter Password"
    );
    return false;
  }
}
//function to run for the  signup form
function submitchecksignup() {
  if (
    email1input.value === "" ||
    password1input.value === "" ||
    numberinput.value === "" ||
    nameinput.value == ""
  ) {
    dothechangerequired(errorsign2, errortext2, email1input, "Enter Email Id");
    dothechangerequired(
      errorsign4,
      errortext4,
      password1input,
      "Enter Password"
    );
    dothechangerequired(errorsign1, errortext1, nameinput, "Enter Name");
    dothechangerequired(
      errorsign3,
      errortext3,
      numberinput,
      "Enter Mobile Number"
    );
    return false;
  }

  function timesup(invalidinput, errorishere) {
    setTimeout(() => {
      invalidinput.style.display = "none";
      errorishere.style.visibility = "hidden";
    }, 5000);
  }

  let invalidnumber = document.getElementById("invalidnumber");
  let invalidpassword = document.getElementById("invalidpassword");

  const regexnum = /^[0-9]{10}$/;
  let strnum = numberinput.value;
  if (!regexnum.test(strnum)) {
    invalidnumber.style.display = "block";
    errorsign3.style.visibility = "visible";
    timesup(invalidnumber, errorsign3);
    return false;
  }

  let regexpass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/;
  let strpass = password1input.value;
  if (!regexpass.test(strpass)) {
    invalidpassword.style.display = "block";
    errorsign4.style.visibility = "visible";

    timesup(invalidpassword, errorsign4);
    return false;
  }
}

//******************************************* */
if (window.history.replaceState) {
  console.log("function triggered");

  window.history.replaceState(null, null, "/login");
}
