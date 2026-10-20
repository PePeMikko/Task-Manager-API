import { login, signup } from "./api.js";

const signUpButton = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signUpForm = document.getElementById("signup-form");
const loginButton = document.getElementById("tab-login");



signUpButton.addEventListener("click", function () {
    signUpForm.hidden = false;
    loginForm.hidden = true;
    signUpButton.classList.add("active");
    loginButton.classList.remove("active");
})



loginButton.addEventListener("click", function () {
    signUpForm.hidden = true;
    loginForm.hidden = false;
    loginButton.classList.add("active");
    signUpButton.classList.remove("active");
})


signUpForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = signUpForm.querySelector(`input[name="username"]`).value;
    const password = signUpForm.querySelector(`input[name="password"]`).value;
    const confirmPassword = signUpForm.querySelector(`input[name="confirmPassword"]`).value;

    try {
        const response = await fetch("/signup", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password,
                confirmPassword: confirmPassword
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.error);
            return;
        }
        alert("Account created successfully! Please log in.");
        loginButton.click();
        signUpForm.reset();

     } catch (error) {
            alert("Could not connect to the server.");
            console.error(error);
        }
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = loginForm.querySelector(`input[name="username"]`).value;
    const password = loginForm.querySelector(`input[name="password"]`).value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.error);
            return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        window.location.href = "tasks.html";
    }
    catch (error) {
        alert("Could not connect to the server.");
        console.error(error);
    }
});
