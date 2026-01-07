function error(text) {
  document.querySelector(".form").style.display = "none";
  document.querySelector(".error").style.display = "inherit";
  document.querySelector("#errortext").innerText = `Cyber Link Lock Error: ${text}`;
}

// Run when the <body> loads
function main() {
  if (window.location.hash) {
    document.querySelector(".form").style.display = "inherit";
    document.querySelector("#password").value = "";
    document.querySelector("#password").focus();
    document.querySelector(".error").style.display = "none";
    document.querySelector("#errortext").innerText = "";

    // Fail if required libraries are missing
    if (!("b64" in window)) {
      error("Base64 library not loaded.");
      return;
    }
    if (!("apiVersions" in window)) {
      error("API library not loaded.");
      return;
    }

    // Decode URL hash
    const hash = window.location.hash.slice(1);
    let params;
    try {
      params = JSON.parse(b64.decode(hash));
    } catch {
      error("The encrypted link appears to be corrupted.");
      return;
    }

    // Validate parameters
    if (!("v" in params && "e" in params)) {
      error("Invalid encrypted link format.");
      return;
    }

    // Check API version
    if (!(params["v"] in apiVersions)) {
      error("Unsupported encryption version.");
      return;
    }

    const api = apiVersions[params["v"]];

    // Extract encryption values
    const encrypted = b64.base64ToBinary(params["e"]);
    const salt = "s" in params ? b64.base64ToBinary(params["s"]) : null;
    const iv = "i" in params ? b64.base64ToBinary(params["i"]) : null;

    // Show hint if available
    if ("h" in params) {
      document.querySelector("#hint").innerText = "Hint: " + params["h"];
    }

    const unlockButton = document.querySelector("#unlockbutton");
    const passwordPrompt = document.querySelector("#password");

    passwordPrompt.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        unlockButton.click();
      }
    });

    unlockButton.addEventListener("click", async () => {
      const password = passwordPrompt.value;
      let url;

      try {
        url = await api.decrypt(encrypted, password, salt, iv);
      } catch {
        error("Incorrect password.");

        // Local paths (NO external GitHub links)
        document.querySelector("#no-redirect").href =
          `./decrypt/#${hash}`;
        document.querySelector("#hidden").href =
          `./hidden/#${hash}`;
        return;
      }

      try {
        const urlObj = new URL(url);

        // Allow only safe protocols
        if (
          urlObj.protocol !== "http:" &&
          urlObj.protocol !== "https:" &&
          urlObj.protocol !== "magnet:"
        ) {
          error("Blocked unsafe or unsupported URL protocol.");
          return;
        }

        // Redirect safely
        window.location.href = url;
      } catch {
        error("Decryption succeeded but URL is invalid.");
        console.log(url);
      }
    });
  } else {
    // Redirect to creator page
    window.location.replace("./create");
  }
}
