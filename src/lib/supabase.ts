import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Algumas extensoes de navegador (anti-fingerprint, ad-blockers) sobrescrevem
// window.fetch globalmente e isso quebra o cliente Supabase. Congelamos o fetch
// original cedo e o usamos em vez do global. O supabase-js aceita um fetch
// customizado via opcao `fetch` ou via `globalThis.fetch` quando ele difere
// de window.fetch - entao tambem forcamos o globalThis.
const nativeFetch: typeof fetch = (() => {
  // Tenta capturar o fetch via iframe (escape de overrides feitos no top frame)
  if (typeof window !== "undefined" && window.fetch) {
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const iframeFetch = (iframe.contentWindow as Window | null)?.fetch;
      document.body.removeChild(iframe);
      if (typeof iframeFetch === "function") return iframeFetch.bind(window) as typeof fetch;
    } catch {
      // ignore
    }
  }
  return (...args: Parameters<typeof fetch>) => fetch(...args);
})();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: nativeFetch,
  },
});
