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
  document.getElementById("topic-actions");

const params =
  new URLSearchParams(window.location.search);

const topicId = params.get("id");

let currentTopic = null;

let replies = [];

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

  replyListContainer.innerHTML = "";

  for (let reply of replies) {

    const article =
      createReplyArticle(reply);

    replyListContainer.appendChild(article);
  }
}

function renderTopic() {

  if (!currentTopic) return;

  topicSubject.textContent =
    currentTopic.subject;

  opMessage.textContent =
    currentTopic.message;

  opFooter.textContent =
    `Posted by: ${currentTopic.author} on ${currentTopic.created_at}`;

  topicActions.innerHTML = "";

  const deleteBtn =
    document.createElement("button");

  deleteBtn.className = "delete-btn";

  deleteBtn.dataset.id = currentTopic.id;

  deleteBtn.textContent = "Delete Topic";

  topicActions.appendChild(deleteBtn);
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

    replies = result.data;

    renderReplies();
  }
}

async function handleReplySubmit(event) {

  event.preventDefault();

  const replyText =
    document.getElementById("new-reply").value;

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

    replies.push(result.data);

    renderReplies();

    replyForm.reset();
  }
}

async function handleReplyDelete(event) {

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

      replies =
        replies.filter(
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

async function initializePage() {

  await loadTopic();

  await loadReplies();

  replyForm.addEventListener(
    "submit",
    handleReplySubmit
  );

  document.addEventListener(
    "click",
    handleReplyDelete
  );
}

initializePage();
