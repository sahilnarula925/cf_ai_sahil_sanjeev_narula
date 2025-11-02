let docId = null;

function showError(message) {
  const errorEl = document.getElementById("error-message");
  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 5000);
}

function hideError() {
  document.getElementById("error-message").style.display = "none";
}

document.getElementById("summarize").onclick = async () => {
  const text = document.getElementById("doc").value.trim();
  if (!text) {
    showError("Please paste a document first!");
    return;
  }

  hideError();
  
  try {
    const button = document.getElementById("summarize");
    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");
    
    button.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    docId = data.id;

    const summary = typeof data.summary === "string" 
      ? data.summary 
      : data.summary?.response || data.summary?.description || "";
    
    document.getElementById("summary").textContent = summary;
    document.getElementById("summary-section").style.display = "block";
    document.getElementById("qa-section").style.display = "block";
    
    // Scroll to summary
    document.getElementById("summary-section").scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    console.error("Error:", error);
    showError(`Error: ${error.message}`);
  } finally {
    const button = document.getElementById("summarize");
    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");
    
    button.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
};

document.getElementById("ask").onclick = async () => {
  const question = document.getElementById("question").value.trim();
  if (!question || !docId) {
    if (!docId) {
      showError("Please summarize a document first!");
    } else {
      showError("Please enter a question!");
    }
    return;
  }

  hideError();

  try {
    const button = document.getElementById("ask");
    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");
    
    button.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";

    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: docId, question })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const answer = typeof data.answer === "string" 
      ? data.answer 
      : data.answer?.response || data.answer?.description || "";
    
    const answers = document.getElementById("answers");
    const div = document.createElement("div");
    div.className = "answer-item";
    div.innerHTML = `
      <div class="question">${escapeHtml(question)}</div>
      <div class="answer">${escapeHtml(answer)}</div>
    `;
    answers.appendChild(div);
    document.getElementById("question").value = "";
    
    // Scroll to new answer
    div.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    console.error("Error:", error);
    showError(`Error: ${error.message}`);
  } finally {
    const button = document.getElementById("ask");
    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");
    
    button.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
};

// Allow Enter key to submit question
document.getElementById("question").addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    document.getElementById("ask").click();
  }
});

// Simple HTML escape function
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}