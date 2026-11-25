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

