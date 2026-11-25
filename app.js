const AUTH_API = 'https://fakestoreapi.com/auth/login';
const PRODUCTS_API = 'https://fakestoreapi.com/products';

const loginStage = document.querySelector('#login-stage');
const loginHeader = document.querySelector('#login-header');
const storeHeader = document.querySelector('#store-header');
const storeNav = document.querySelector('#store-nav');
const catalogStage = document.querySelector('#catalog-stage');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const loginButton = document.querySelector('#login-button');
const passwordStage = document.querySelector('#password-stage');
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const categoryFilter = document.querySelector('#category-filter');
const searchInput = document.querySelector('#search-input');
const grid = document.querySelector('#product-grid');
let products = [];
let cartCount = 0;
let toastTimer;

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';

  if (passwordStage.classList.contains('is-hidden')) {
    passwordStage.classList.remove('is-hidden');
    passwordInput.required = true;
    document.querySelector('label[for="username"]').textContent = 'E-mail ou nome de usuário';
    loginButton.textContent = 'Entrar';
    passwordInput.focus();
    return;
  }

  setBusy(true);
  try {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput.value.trim(), password: passwordInput.value })
    });
    if (!response.ok) throw new Error('Usuário ou senha inválidos. Confira as credenciais de demonstração.');
    const data = await response.json();
    if (!data.token) throw new Error('A API não retornou uma sessão válida. Tente novamente.');
    sessionStorage.setItem('store-demo-user', usernameInput.value.trim());
    await showCatalog(usernameInput.value.trim());
  } catch (error) {
    loginMessage.textContent = error instanceof TypeError ? 'Não foi possível conectar à API. Confira sua conexão e tente novamente.' : error.message;
  } finally {
    setBusy(false);
  }
});

document.querySelector('#toggle-password').addEventListener('click', () => {
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  document.querySelector('#toggle-password').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
});

document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('store-demo-user');
  catalogStage.classList.add('is-hidden');
  storeHeader.classList.add('is-hidden');
  storeNav.classList.add('is-hidden');
  loginHeader.classList.remove('is-hidden');
  loginStage.classList.remove('is-hidden');
  document.body.classList.remove('is-shopping');
  passwordStage.classList.add('is-hidden');
  passwordInput.required = false;
  passwordInput.value = '';
  loginButton.textContent = 'Continuar';
  loginMessage.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelector('#retry-button').addEventListener('click', loadProducts);
categoryFilter.addEventListener('change', renderProducts);
document.querySelector('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  renderProducts();
  document.querySelector('#catalog-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.querySelector('#cart-button').addEventListener('click', () => {
  showToast(cartCount ? `${cartCount} ${cartCount === 1 ? 'item' : 'itens'} no carrinho.` : 'Seu carrinho está vazio por enquanto.');
});


async function showCatalog(username) {
  document.body.classList.add('is-shopping');
  loginHeader.classList.add('is-hidden');
  loginStage.classList.add('is-hidden');
  storeHeader.classList.remove('is-hidden');
  storeNav.classList.remove('is-hidden');
  catalogStage.classList.remove('is-hidden');
  document.querySelector('#account-label').innerHTML = `<small>Olá, ${escapeHtml(username)}</small><strong>Sua conta</strong>`;
  await loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadProducts() {
  document.querySelector('#catalog-error').classList.add('is-hidden');
  document.querySelector('#results-count').textContent = 'Carregando produtos...';
  grid.innerHTML = Array.from({ length: 8 }, () => '<div class="product-card"><div class="skeleton image-skeleton"></div><div class="skeleton line-skeleton"></div><div class="skeleton line-skeleton"></div></div>').join('');
  try {
    const response = await fetch(PRODUCTS_API);
    if (!response.ok) throw new Error('Falha ao carregar os produtos.');
    products = await response.json();
    const categories = [...new Set(products.map(product => product.category))];
    categoryFilter.innerHTML = '<option value="all">Todas as categorias</option>' + categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
    renderProducts();
  } catch {
    grid.innerHTML = '';
    document.querySelector('#results-count').textContent = '';
    document.querySelector('#catalog-error').classList.remove('is-hidden');
  }
}

function renderProducts() {
  const term = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  const category = categoryFilter.value;
  const filtered = products.filter(product =>
    (category === 'all' || product.category === category) &&
    (!term || `${product.title} ${product.description} ${product.category}`.toLocaleLowerCase('pt-BR').includes(term))
  );
  document.querySelector('#results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
  if (!filtered.length) {
    grid.innerHTML = '<div class="catalog-error"><p>Nenhum produto encontrado. Tente outra busca ou categoria.</p></div>';
    return;
  }
  grid.innerHTML = filtered.map((product, index) => `
    <article class="product-card" style="--card-index:${Math.min(index, 12)}">
      <div class="product-image-wrap"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy"><span class="product-category">${escapeHtml(product.category)}</span></div>
      <div class="product-info"><h3>${escapeHtml(product.title)}</h3><p class="rating"><span>${'★'.repeat(Math.round(product.rating?.rate || 0))}${'☆'.repeat(5 - Math.round(product.rating?.rate || 0))}</span> <small>${product.rating?.count || 0}</small></p><p class="price"><sup>US$</sup>${Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><button class="add-button" data-product="${product.id}">Adicionar ao carrinho</button></div>
    </article>`).join('');
  grid.querySelectorAll('.add-button').forEach(button => button.addEventListener('click', () => {
    cartCount++;
    document.querySelector('#cart-count').textContent = cartCount;
    document.querySelector('#cart-button').setAttribute('aria-label', `Carrinho, ${cartCount} itens`);
    button.classList.add('added');
    button.textContent = 'Adicionado';
    showToast('Produto adicionado ao carrinho.');
  }));
}

function setBusy(busy) {
  loginButton.disabled = busy;
  loginButton.textContent = busy ? 'Verificando...' : 'Entrar';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

const savedUser = sessionStorage.getItem('store-demo-user');
if (savedUser) showCatalog(savedUser);
