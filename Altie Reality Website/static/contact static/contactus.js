// **********************************************

//js for validating the form is here
let contactform = document.querySelector(".contactform");
let errorsign1 = document.querySelector(".errorsign1");
let errortext1 = document.querySelector(".errortext1");
let namelabel = contactform.querySelector('label[for="name"]');
let emaillabel = contactform.querySelector('label[for="email"]');
let errorsign2 = document.querySelector(".errorsign2");
let errortext2 = document.querySelector(".errortext2");
let namediv = document.getElementById("namediv");
let emaildiv = document.getElementById("emaildiv");
let messagediv = document.getElementById("messagediv");
let emailinput = document.querySelector("#email");
let nameinput = document.querySelector("#name");
let button = document.querySelector(".button");

function submitcheck() {
  if (emailinput.value === "" || nameinput.value === "") {
    if (emailinput.value === "") {
      errorsign2.style.visibility = "visible";
      emaildiv.classList.add("shake");
      errortext2.style.visibility = "visible";
      emailinput.style.border = "1px solid red";
      emaillabel.style.color = "red";
      setTimeout(() => {
        errorsign2.style.visibility = "hidden";
        emaildiv.classList.remove("shake");
        errortext2.style.visibility = "hidden";
        emailinput.style.border = "1px solid black";
        emaillabel.style.color = "black";
      }, 2500);
    }
    if (nameinput.value === "") {
      errorsign1.style.visibility = "visible";
      namediv.classList.add("shake");
      errortext1.style.visibility = "visible";
      nameinput.style.border = "1px solid red";
      namelabel.style.color = "red";

      setTimeout(() => {
        errorsign1.style.visibility = "hidden";
        namediv.classList.remove("shake");
        errortext1.style.visibility = "hidden";
        nameinput.style.border = "1px solid black";
        namelabel.style.color = "black";
      }, 2500);
      return false;
    }
    return false;
  }
}
//******************************************* */
