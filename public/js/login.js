const forgotform = document.getElementById("forgot-form");
const loginform = document.getElementById("loginform");
const form = document.getElementById("sign-up-form");

form.onsubmit = Signup;
loginform.onsubmit = Login;

function forgotpwd() {
  form.style.display = 'none';
  forgotform.style.display = 'inline-block';
}

function Login(e) {
  e.preventDefault();
  let formData = new FormData(loginform);
  let data = {};
  for (let entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }
  fetch('/login', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

function Signup(e) {
  e.preventDefault();
  let formData = new FormData(form);
  let data = {};
  for (let entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }
  fetch('/create', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}