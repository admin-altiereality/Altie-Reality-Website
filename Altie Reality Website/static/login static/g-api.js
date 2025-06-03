// function signOut() {
//   var auth2 = gapi.auth2.getAuthInstance();
//   auth2.signOut().then(function () {
//     console.log("User signed out.");
//   });
// }

function onSignIn(googleUser) {
  // var profile = googleUser.getBasicProfile();
  // console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  // console.log('Name: ' + profile.getName());
  // console.log('Image URL: ' + profile.getImageUrl());
  // console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
	// 

  var id_token = googleUser.getAuthResponse().id_token;
	

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/glogin");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    if (xhr.responseText == "success") {
      // {{!-- signOut(); --}}
	    // 

      location.assign("/demo");
    }
  };
  xhr.send(JSON.stringify({ token: id_token }));
}
