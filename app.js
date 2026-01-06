let produits = [];

async function loadProduits() {
  try {
    const res = await fetch("./data/products.json");
    produits = await res.json();
    loadProduits();
  } catch (err) {
    console.error("Erreur chargement products.json", err);
  }
}