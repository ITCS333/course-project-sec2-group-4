const topicSubject =
  document.getElementById("topic-subject");

const opMessage =
  document.getElementById("op-message");

const opFooter =
  document.getElementById("op-footer");

const replyListContainer =
  document.getElementById("reply-list-container");

const replyForm =
  document.getElementById("reply-form");

const topicActions =
  document.getElementById("topic-actions") ||
  document.getElementById("op-actions");

function getTopicIdFromURL() {

  const params =
    new URLSearchParams(window.location.search);

  return params.get("id");
}

const topicId = getTopicIdFromURL();

let currentTopic = null;

let currentReplies = [];

function createReplyArticle(reply) {

  const article =
    document.createElement("article");

  const p =
    document.createElement("p");

  p.textContent = reply.text;

  const footer =
    document.createElement("footer");

  footer.textContent =
    `Posted by: ${reply.author} on ${reply.created_at}`;

  const actions =
    document.createElement("div");

  const deleteBtn =
    document.createElement("button");

  deleteBtn.className =
    "delete-reply-btn";

  deleteBtn.dataset.id = reply.id;

  deleteBtn.textContent = "Delete";

  actions.appendChild(deleteBtn);

  article.appendChild(p);
  article.appendChild(footer);
  article.appendChild(actions);

  return article;
}

function renderReplies() {

  if (!replyListContainer) return;

  replyListContainer.innerHTML = "";

  for (let reply of currentReplies) {

    const article =
      createReplyArticle(reply);

    replyListContainer.appendChild(article);
  }
}

function renderOriginalPost(topic) {

  if (!topic) return;

  currentTopic = topic;

  if (topicSubject) {

    topicSubject.textContent =
      topic.subject;
  }

  if (opMessage) {

    opMessage.textContent =
      topic.message;
  }

  if (opFooter) {

    opFooter.textContent =
      `Posted by: ${topic.author} on ${topic.created_at}`;
  }

  if (topicActions) {

    topicActions.innerHTML = "";

    const deleteBtn =
      document.createElement("button");

    deleteBtn.className = "delete-btn";

    deleteBtn.dataset.id = topic.id;

    deleteBtn.textContent = "Delete Topic";

    topicActions.appendChild(deleteBtn);
  }
}

function renderTopic() {

  renderOriginalPost(currentTopic);
}

async function loadTopic() {

  const response =
    await fetch(`./api/index.php?id=${topicId}`);

  const result =
    await response.json();

  if (result.success) {

    currentTopic = result.data;

    renderTopic();
  }
}

async function loadReplies() {

  const response =
    await fetch(
      `./api/index.php?action=replies&topic_id=${topicId}`
    );

  const result =
    await response.json();

  if (result.success) {

    currentReplies = result.data;

    renderReplies();
  }
}

async function handleAddReply(event) {

  if (event && event.preventDefault) {

    event.preventDefault();
  }

  const newReply =
    document.getElementById("new-reply");

  const replyText =
    newReply ? newReply.value.trim() : "";

  if (replyText === "") return;

  const response =
    await fetch("./api/index.php?action=reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        topic_id: topicId,
        text: replyText,
        author: "Student"
      })
    });

  const result =
    await response.json();

  if (result.success) {

    currentReplies.push(result.data);

    renderReplies();

    if (replyForm) {

      replyForm.reset();
    } else if (newReply) {

      newReply.value = "";
    }
  }
}

async function handleReplySubmit(event) {

  return handleAddReply(event);
}

async function handleReplyListClick(event) {

  if (!event || !event.target || !event.target.classList) return;

  if (
    event.target.classList.contains(
      "delete-reply-btn"
    )
  ) {

    const id =
      event.target.dataset.id;

    const response =
      await fetch(
        `./api/index.php?action=delete_reply&id=${id}`,
        {
          method: "DELETE"
        }
      );

    const result =
      await response.json();

    if (result.success) {

      currentReplies =
        currentReplies.filter(
          reply => reply.id != id
        );

      renderReplies();
    }
  }

  if (
    event.target.classList.contains(
      "delete-btn"
    )
  ) {

    const response =
      await fetch(
        `./api/index.php?id=${topicId}`,
        {
          method: "DELETE"
        }
      );

    const result =
      await response.json();

    if (result.success) {

      window.location.href =
        "board.html";
    }
  }
}

async function handleReplyDelete(event) {

  return handleReplyListClick(event);
}

async function initializePage() {

  await loadTopic();

  await loadReplies();

  if (replyForm) {

    replyForm.addEventListener(
      "submit",
      handleReplySubmit
    );
  }

  document.addEventListener(
    "click",
    handleReplyDelete
  );
}

if (document.currentScript) {

  initializePage();
}
