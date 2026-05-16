
const resourceListSection = document.querySelector('#resource-list-section');


function createResourceArticle(resource) {
  const { id, title, description } = resource;
  const article = document.createElement('article');
  article.innerHTML = `
    <h2>${title}</h2>
    <p>${description}</p>
    <a href="details.html?id=${id}">View Resource & Discussion</a>
  `;
  return article;
}


async function loadResources() {
  const response = await fetch('./api/index.php');
  const result   = await response.json();

  resourceListSection.innerHTML = '';

  if (result.success) {
    result.data.forEach(resource => {
      resourceListSection.appendChild(createResourceArticle(resource));
    });
  }
}

loadResources();
