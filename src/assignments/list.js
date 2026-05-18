const assignmentListSection = document.getElementById("assignment-list-section");
const API_URL = "./api/index.php";

function getDescriptionPreview(description) {
  const text = String(description || "").trim();

  if (text.length <= 140) {
    return text;
  }

  return text.slice(0, 137) + "...";
}

function createAssignmentArticle(assignment) {
  const article = document.createElement("article");
  article.className = "bg-white rounded-xl border border-slate-100 p-6 border-t-2 border-indigo-500 flex flex-col justify-between h-full transition-all";

  const contentWrapper = document.createElement("div");

  const title = document.createElement("h2");
  title.className = "text-xl text-slate-900 font-medium mb-2";
  title.textContent = assignment.title || "Untitled Assignment";

  const dueDate = document.createElement("p");
  dueDate.className = "text-xs uppercase tracking-widest text-slate-400 mb-4";
  dueDate.textContent = "Due: " + (assignment.due_date || "Not set");

  const description = document.createElement("p");
  description.className = "text-sm text-slate-600 mb-6 line-clamp-3";
  description.textContent = getDescriptionPreview(assignment.description);

  contentWrapper.append(title, dueDate, description);

  const detailsLink = document.createElement("a");
  detailsLink.href = "details.html?id=" + encodeURIComponent(assignment.id);
  detailsLink.className = "bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors inline-block w-max mt-auto text-center";
  detailsLink.textContent = "View Details & Discussion";

  article.append(contentWrapper, detailsLink);
  return article;
}

async function loadAssignments() {
  if (!assignmentListSection) {
    return;
  }

  assignmentListSection.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 animate-pulse font-medium">Loading assignments...</div>';

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load assignments.");
    }

    assignmentListSection.innerHTML = "";

    if (!Array.isArray(result.data) || result.data.length === 0) {
      assignmentListSection.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 font-medium">No assignments have been posted yet.</div>';
      return;
    }

    result.data.forEach(function (assignment) {
      assignmentListSection.appendChild(createAssignmentArticle(assignment));
    });
  } catch (error) {
    assignmentListSection.innerHTML = "";

    const message = document.createElement("p");
    message.className = "col-span-full text-center text-red-500 py-12 text-sm font-medium";
    message.textContent = error.message || "Unable to load assignments.";
    assignmentListSection.appendChild(message);
  }
}

loadAssignments();
