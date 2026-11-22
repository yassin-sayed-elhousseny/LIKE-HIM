
const btn = document.getElementById("theme-toggle");

btn.addEventListener("click", function() {

  if (document.documentElement.dataset.theme === "dark") {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("stuck_theme_v1", "light");
    btn.textContent = "Dark Mode";
  } else {
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("stuck_theme_v1", "dark");
    btn.textContent = "Light Mode";
  }

});


if (document.documentElement.dataset.theme === "dark") {
  btn.textContent = "Light Mode";
} else {
  btn.textContent = "Dark Mode";
}



const form = document.getElementById("problem-form");
const input = document.getElementById("problem-input");
const list = document.getElementById("problem-list");

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const problem = document.createElement("li");
  problem.className = "problem-card";

  const text = document.createElement("p");
  text.className = "problem-text";
  text.textContent = input.value;

  problem.appendChild(text);
  list.appendChild(problem);

  input.value = "";
});


const attachBtn = document.getElementById("attach-btn");
const imageInput = document.getElementById("image-input");

attachBtn.addEventListener("click", function() {
  imageInput.click();
});

imageInput.addEventListener("change", function() {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(imageInput.files[0]);
  img.className = "problem-image";

  document.getElementById("problem-list").appendChild(img);
});


const exportBtn = document.getElementById("export-btn");

exportBtn.addEventListener("click", function() {
  const text = document.getElementById("problem-input").value;

  const file = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(file);
  link.download = "My Problem.txt";
  link.click();
});
