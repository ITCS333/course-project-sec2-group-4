// --- Global Data Store ---
let topics = [];

// --- Element Selections ---
const newTopicForm = document.getElementById("new-topic-form");
const topicListContainer = document.getElementById("topic-list-container");

// --- Functions ---

function createTopicArticle(topic) {

  const article = document.createElement("article");

  const h3 = document.createElement("h3");

  const link = document.createElement("a");
  link.href = `topic.html?id=${topic.id}`;
  link.textContent = topic.subject;

  h3.appendChild(link);

  const footer = document.createElement("footer");
  footer.textContent =
    `Posted by: ${topic.author} on ${topic.created_at}`;

  const actions = document.createElement("div");

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.dataset.id = topic.id;
  editBtn.textContent = "Edit";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.dataset.id = topic.id;
  deleteBtn.textContent = "Delete";

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  article.appendChild(h3);
  article.appendChild(footer);
  article.appendChild(actions);

  return article;
}

function renderTopics() {

  topicListContainer.innerHTML = "";

  for (let topic of topics) {
    const article = createTopicArticle(topic);
    topicListContainer.appendChild(article);
  }
}

async function handleCreateTopic(event) {

  event.preventDefault();

  const subject =
    document.getElementById("topic-subject").value;

  const message =
    document.getElementById("topic-message").value;

  const createBtn =
    document.getElementById("create-topic");

  const editId = createBtn.dataset.editId;

  // UPDATE
  if (editId) {

    await handleUpdateTopic(editId, {
      subject,
      message
    });

    createBtn.textContent = "Create Topic";
    delete createBtn.dataset.editId;

    newTopicForm.reset();

    return;
  }

  // CREATE
  const response = await fetch("./api/index.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject,
      message,
      author: "Student"
    })
  });

  const result = await response.json();

  if (result.success) {

    topics.push({
      id: result.id,
      subject,
      message,
      author: "Student",
      created_at: new Date().toISOString()
    });

    renderTopics();

    newTopicForm.reset();
  }
}

async function handleUpdateTopic(id, fields) {

  const response = await fetch("./api/index.php", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id,
      subject: fields.subject,
      message: fields.message
    })
  });

  const result = await response.json();

  if (result.success) {

    const topic = topics.find(t => t.id == id);

    if (topic) {
      topic.subject = fields.subject;
      topic.message = fields.message;
    }

    renderTopics();
  }
}

async function handleTopicListClick(event) {

  // DELETE
  if (event.target.classList.contains("delete-btn")) {

    const id = event.target.dataset.id;

    const response =
      await fetch(`./api/index.php?id=${id}`, {
        method: "DELETE"
      });

    const result = await response.json();

    if (result.success) {

      topics =
        topics.filter(topic => topic.id != id);

      renderTopics();
    }
  }

  // EDIT
  if (event.target.classList.contains("edit-btn")) {

    const id = event.target.dataset.id;

    const topic =
      topics.find(topic => topic.id == id);

    if (topic) {

      document.getElementById("topic-subject").value =
        topic.subject;

      document.getElementById("topic-message").value =
        topic.message;

      const createBtn =
        document.getElementById("create-topic");

      createBtn.textContent = "Update Topic";

      createBtn.dataset.editId = id;
    }
  }
}

async function loadAndInitialize() {

  const response =
    await fetch("./api/index.php");

  const result = await response.json();

  if (result.success) {
    topics = result.data;
    renderTopics();
  }

  newTopicForm.addEventListener(
    "submit",
    handleCreateTopic
  );

  topicListContainer.addEventListener(
    "click",
    handleTopicListClick
  );
}

// --- Initial Page Load ---
loadAndInitialize();
