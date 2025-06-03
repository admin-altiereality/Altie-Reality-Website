// common javascript for navbar hamburger menu...

let hamburger = document.getElementById("hamburger");
let navbarlinks = document.getElementById("navbarlinks");
let firstpage = document.querySelector(".content1");
let body = document.getElementsByTagName("body");

let element1 = document.createElement("div");
element1.innerHTML = `  <span ><div class="helloname">"{{user.name}}"</div><button class="homenavbtn" form="signinform" >Sign In</button></span>
<i  class="fa fa-window-close" onclick="closeham()"></i>`;
hamburger.addEventListener("click", () => {
  navbarlinks.insertBefore(element1, navbarlinks.firstChild);
  body[0].classList.add("stop");
  navbarlinks.classList.add("mobileview");
});

firstpage.addEventListener("click", () => {
  body[0].classList.remove("stop");
  navbarlinks.classList.remove("mobileview");
  element1.remove();
});

function closeham() {
  body[0].classList.remove("stop");
  navbarlinks.classList.remove("mobileview");
  element1.remove();
}

// here ends the common javascript
