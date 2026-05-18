const resourceListSection = document.querySelector('#resource-list-section');

function createResourceArticle(resource) {
  const { id, title, description, link } = resource;

  const article = document.createElement('article');

  const h2 = document.createElement('h2');
  h2.textContent = title;

  const p = document.createElement('p');
  p.textContent = description;

  const a = document.createElement('a');
  a.href = `details.html?id=${id}`;
  a.textContent = 'View Resource & Discussion';

  article.appendChild(h2);
  article.appendChild(p);
  article.appendChild(a);

  return article;
}

async function loadResources() {
  const response = await fetch('./api/index.php');
  const json = await response.json();

  resourceListSection.innerHTML = '';

  if (json.success && Array.isArray(json.data)) {
    json.data.forEach(resource => {
      const article = createResourceArticle(resource);
      resourceListSection.appendChild(article);
    });
  }
}

loadResources();
