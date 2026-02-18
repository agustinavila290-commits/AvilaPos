// Prevenir FOUC (Flash of Unstyled Content)
// Este script se ejecuta ANTES de cargar React para aplicar dark mode inmediatamente
(function() {
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'true' || (!darkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();
