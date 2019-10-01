function toggleOutput() {
  var jsonDiv = document.getElementById("togglDiv");
  var txtDiv = document.getElementById("txtDiv");

  if (jsonDiv.style.display === "none") {
    jsonDiv.style.display = "block";
    txtDiv.style.display = "none";
  } else {
    jsonDiv.style.display = "none";
    txtDiv.style.display = "block";
  }
}