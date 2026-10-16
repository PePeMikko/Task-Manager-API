import { login, signup } from "./api.js";

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


if (localStorage.getItem("token")) {
  window.location.href = "tasks.html";
}

function showError(form, message) {
  const errorEl = form.querySelector(".error");
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

async function logIn(username, password) {
  const { token } = await login(username, password);
  localStorage.setItem("token", token);
  localStorage.setItem("username", username);
  window.location.href = "tasks.html";
}

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const { username, password } = Object.fromEntries(new FormData(loginForm));
  showError(loginForm, "");

  if (!username.trim() || !password) {
    showError(loginForm, "Enter your username and password.");
    return;
  }

  const button = loginForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    await logIn(username.trim(), password);
  } catch (err) {
    showError(loginForm, err.message);
    button.disabled = false;
  }
});

signUpForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const { username, password, confirm } = Object.fromEntries(new FormData(signUpForm));
  showError(signUpForm, "");

  if (username.trim().length < 3) {
    showError(signUpForm, "Username must be at least 3 characters.");
    return;
  }
  if (password.length < 6) {
    showError(signUpForm, "Password must be at least 6 characters.");
    return;
  }
  if (password !== confirm) {
    showError(signUpForm, "Passwords don't match.");
    return;
  }

  const button = signUpForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    await signup(username.trim(), password);
    await logIn(username.trim(), password);
  } catch (err) {
    showError(signUpForm, err.message);
    button.disabled = false;
  }
});
