const signUpButton = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signUpForm = document.getElementById("signup-form");
const loginButton = document.getElementById("tab-login");



signUpButton.addEventListener("click", function(){
signUpForm.hidden = false;
loginForm.hidden = true;
signUpButton.classList.add("active");
loginButton.classList.remove("active");
})



loginButton.addEventListener("click", function(){
signUpForm.hidden = true;
loginForm.hidden = false;
loginButton.classList.add("active");
signUpButton.classList.remove("active");
})