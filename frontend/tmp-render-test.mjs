global.localStorage = {
  store: new Map(),
  getItem(key){ return this.store.has(key) ? this.store.get(key) : null; },
  setItem(key, value){ this.store.set(key, String(value)); },
  removeItem(key){ this.store.delete(key); },
  key(index){ return Array.from(this.store.keys())[index] ?? null; },
  get length(){ return this.store.size; }
};
Object.defineProperty(globalThis, 'window', { value: { location: { hostname: '127.0.0.1', search: '' }, localStorage: global.localStorage, addEventListener(){}, removeEventListener(){} }, configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node-test', onLine: true }, configurable: true });
Object.defineProperty(globalThis, 'document', { value: {
  documentElement: { lang: 'en' },
  body: { classList: { toggle(){}, remove(){} } },
  querySelector(){ return null; },
  getElementById(){ return null; },
  addEventListener(){},
  removeEventListener(){}
}, configurable: true });
Object.defineProperty(globalThis, 'CustomEvent', { value: class CustomEvent { constructor(name, init){ this.type = name; this.detail = init?.detail; } }, configurable: true });
Object.defineProperty(globalThis, 'HTMLElement', { value: class HTMLElement {}, configurable: true });
Object.defineProperty(globalThis, 'HTMLInputElement', { value: class HTMLInputElement extends HTMLElement {}, configurable: true });
Object.defineProperty(globalThis, 'HTMLTextAreaElement', { value: class HTMLTextAreaElement extends HTMLElement {}, configurable: true });
Object.defineProperty(globalThis, 'HTMLSelectElement', { value: class HTMLSelectElement extends HTMLElement {}, configurable: true });

(async () => {
  try {
    const React = (await import('react')).default;
    const { renderToString } = await import('react-dom/server');
    const { MemoryRouter } = await import('react-router-dom');
    const { LanguageProvider } = await import('./src/context/LanguageContext.jsx');
    const { AccessibilityProvider } = await import('./src/context/AccessibilityContext.jsx');
    const { AuthProvider } = await import('./src/context/AuthContext.jsx');
    const AccessibilityFrame = (await import('./src/components/AccessibilityFrame.jsx')).default;
    const LoginPage = (await import('./src/pages/LoginPage.jsx')).default;

    const html = renderToString(
      React.createElement(MemoryRouter, { initialEntries: ['/login'] },
        React.createElement(LanguageProvider, null,
          React.createElement(AccessibilityProvider, null,
            React.createElement(AuthProvider, null,
              React.createElement(AccessibilityFrame, null,
                React.createElement(LoginPage)
              )
            )
          )
        )
      )
    );

    console.log('RENDER_OK');
    console.log(html.slice(0, 300));
  } catch (error) {
    console.error('RENDER_ERROR');
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
})();
