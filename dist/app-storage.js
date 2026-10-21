/*
 * Browser persistence boundary.
 *
 * The app remains local-first, but runtime code uses this adapter instead of
 * calling localStorage directly. A future signed-in data layer can replace or
 * mirror this provider without changing every feature module.
 */
(() => {
  const provider = window.localStorage;

  window.DealLogicStorage = Object.freeze({
    getItem: provider.getItem.bind(provider),
    setItem: provider.setItem.bind(provider),
    removeItem: provider.removeItem.bind(provider)
  });
})();
