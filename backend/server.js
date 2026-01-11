// server.js

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// const fetch = require("node-fetch"); // Removed: use global fetch (Node 18+)

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the project root
app.use(express.static(path.join(__dirname, "..")));

const JWT_SECRET = "Im_awsome_and_ur_not";
const ADMIN_SECRET = "bakeryAdmin2026";

// ==================== HELPERS (JSON FILES) ====================
const readJSONFile = (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const writeJSONFile = (filename, data) => {
  const filePath = path.join(__dirname, "data", filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Load all data files
let products = readJSONFile("products.json");
let categories = readJSONFile("categories.json");
let orders = readJSONFile("orders.json");
let clients = readJSONFile("clients.json");
let employees = readJSONFile("employees.json");
let payments = readJSONFile("payement.json");
// Reviews are now sourced from public APIs directly

// ==================== AUTH & ROLE MIDDLEWARES ====================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // { id, username, role }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res
      .status(403)
      .json({ error: "Accès réservé aux administrateurs" });
  }
  next();
}

function superAdminOnly(req, res, next) {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Accès réservé au Super Admin" });
  }
  next();
}

// ==================== AUTHENTIFICATION API ====================

// POST /api/auth/check-username (Public for validation)
app.post("/api/auth/check-username", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const exists = clients.some(c => c.username.toLowerCase() === username.toLowerCase());
  res.json({ exists });
});

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  const { username, password, adminSecret } = req.body;
  let { role } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Tous les champs sont obligatoires (username, password)",
    });
  }

  // Default role to client
  if (!role) role = "client";

  if (role !== "admin" && role !== "client" && role !== "superadmin") {
    return res.status(400).json({ error: "Le rôle doit être 'admin', 'superadmin' ou 'client'" });
  }

  if ((role === "admin" || role === "superadmin") && adminSecret !== ADMIN_SECRET) {
    return res
      .status(403)
      .json({ error: "Code secret requis pour créer un administrateur" });
  }

  const existingClient = clients.find((c) => c.username === username);
  if (existingClient) {
    return res
      .status(400)
      .json({ error: "Ce nom d'utilisateur existe déjà" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now(),
    username,
    password: hashedPassword,
    role, // "superadmin", "admin" ou "client"
    name: req.body.name || username,
    email: req.body.email || "",
    phone: req.body.phone || "",
    address: req.body.address || "",
    registrationDate: new Date().toISOString(),
  };

  clients.push(newUser);
  writeJSONFile("clients.json", clients);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    message: "Utilisateur créé avec succès",
    user: userWithoutPassword,
  });
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username et password obligatoires" });
  }

  // Force reload of clients to ensure fresh data (dev convenience)
  clients = readJSONFile("clients.json");

  const user = clients.find((c) => c.username === username);
  if (!user) {
    return res.status(401).json({ error: "Identifiants incorrects" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Identifiants incorrects" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: "Connexion réussie",
    token,
    user: userWithoutPassword,
  });
});

// ==================== REVIEWS API (MOCKED VIA PUBLIC API) ====================

// GET reviews for a product (public - returns mock data)
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const response = await fetch("https://randomuser.me/api/?results=3&nat=fr");
    const data = await response.json();
    const productId = req.params.id;

    const labReviews = [
      "The molar balance between glucose and acidity in the lemon curd is masterful. Rare structural precision.",
      "An algorithmic layering of pastry with a lightness that defies gravity. My prefrontal cortex approves.",
      "The isotropic distribution of chocolate chips ensures a homogeneous sensory experience in every sample."
    ];

    const mockReviews = data.results.map((person, i) => ({
      id: `mock_${i}`,
      productId,
      username: `${person.name.first} ${person.name.last}`,
      avatar: person.picture.medium,
      comment: labReviews[i],
      rating: 5,
      date: new Date().toISOString(),
      status: "Verified Subject"
    }));

    res.json(mockReviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mock reviews" });
  }
});

// GET all reviews (returns top mock reviews)
app.get("/api/reviews", async (req, res) => {
  try {
    const response = await fetch("https://randomuser.me/api/?results=6&nat=fr");
    const data = await response.json();

    const comments = [
      "Exceptional density-to-flavor ratio.",
      "Thermodynamic perfection in the crust.",
      "Symmetry optimized for maximum crunch.",
      "Molecular composition is perfectly stable.",
      "Refined textures, peak engineering.",
      "Elite performance in flavor trials."
    ];

    const mockReviews = data.results.map((person, i) => ({
      id: `global_${i}`,
      username: `${person.name.first} ${person.name.last}`,
      avatar: person.picture.medium,
      comment: comments[i],
      rating: 5,
      status: "Gourmet Specialist"
    }));

    res.json(mockReviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mock reviews" });
  }
});

// ==================== PRODUCTS API ====================

// GET all products (public)
app.get("/api/products", (req, res) => {
  res.json(readJSONFile("products.json"));
});


// GET product by ID (public)
app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: "Produit non trouvé" });
  res.json(product);
});

// CREATE product (admin)
app.post("/api/products", authMiddleware, adminOnly, (req, res) => {
  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    id_categorie: req.body.id_categorie,
    image: req.body.image,
  };
  products.push(newProduct);
  writeJSONFile("products.json", products);
  res.status(201).json(newProduct);
});

// UPDATE product (admin)
app.put("/api/products/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Produit non trouvé" });

  const updatedProduct = { ...products[index], ...req.body, id };
  products[index] = updatedProduct;
  writeJSONFile("products.json", products);
  res.json(updatedProduct);
});

// DELETE product (admin)
app.delete("/api/products/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const initialLength = products.length;
  products = products.filter((p) => p.id !== id);
  if (products.length === initialLength) {
    return res.status(404).json({ error: "Produit non trouvé" });
  }
  writeJSONFile("products.json", products);
  res.json({ message: "Produit supprimé", id });
});

// ==================== CATEGORIES API ====================

// GET all categories (public)
app.get("/api/categories", (req, res) => {
  res.json(readJSONFile("categories.json"));
});


// GET category by ID (public)
app.get("/api/categories/:id", (req, res) => {
  const id = Number(req.params.id);
  const category = categories.find((c) => c.id_categorie === id);
  if (!category) {
    return res.status(404).json({ error: "Catégorie non trouvée" });
  }
  res.json(category);
});

// CREATE category (admin)
app.post("/api/categories", authMiddleware, adminOnly, (req, res) => {
  const newCategory = {
    id_categorie: Date.now(),
    libelle: req.body.libelle,
    description: req.body.description,
  };
  categories.push(newCategory);
  writeJSONFile("categories.json", categories);
  res.status(201).json(newCategory);
});

// UPDATE category (admin)
app.put("/api/categories/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const index = categories.findIndex((c) => c.id_categorie === id);
  if (index === -1) {
    return res.status(404).json({ error: "Catégorie non trouvée" });
  }
  categories[index] = {
    ...categories[index],
    ...req.body,
    id_categorie: id,
  };
  writeJSONFile("categories.json", categories);
  res.json(categories[index]);
});

// DELETE category (admin)
app.delete("/api/categories/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const initialLength = categories.length;
  categories = categories.filter((c) => c.id_categorie !== id);
  if (categories.length === initialLength) {
    return res.status(404).json({ error: "Catégorie non trouvée" });
  }
  writeJSONFile("categories.json", categories);
  res.json({ message: "Catégorie supprimée", id });
});

// ==================== ORDERS API ====================

// GET all orders (admin)
app.get("/api/orders", authMiddleware, adminOnly, (req, res) => {
  res.json(readJSONFile("orders.json"));
});


// GET my orders (logged-in client)
app.get("/api/orders/my", authMiddleware, (req, res) => {
  const myOrders = readJSONFile("orders.json").filter(o => o.clientId == req.user.id);
  res.json(myOrders);
});

// GET order by ID (admin)
app.get("/api/orders/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Commande non trouvée" });
  }
  res.json(order);
});

// CREATE order (client ou admin)
app.post("/api/orders", authMiddleware, (req, res) => {
  const items = req.body.items || [];

  // 1. Verify stock availability
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(404).json({ error: `Produit #${item.productId} introuvable.` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}` });
    }
  }

  // 2. Decrement stock
  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      product.stock -= item.quantity;
    }
  });
  writeJSONFile("products.json", products);

  // 3. Create order
  const newOrder = {
    id: Date.now(),
    clientId: req.body.clientId || req.user.id,
    items: items,
    totalAmount: req.body.totalAmount,
    orderDate: req.body.orderDate || new Date().toISOString(),
    status: req.body.status || "En attente",
  };
  orders.push(newOrder);
  writeJSONFile("orders.json", orders);

  res.status(201).json(newOrder);
});

// UPDATE order (admin)
app.put("/api/orders/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Commande non trouvée" });
  }
  orders[index] = {
    ...orders[index],
    ...req.body,
    id,
  };
  writeJSONFile("orders.json", orders);
  res.json(orders[index]);
});

// DELETE order (admin)
app.delete("/api/orders/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const initialLength = orders.length;
  orders = orders.filter((o) => o.id !== id);
  if (orders.length === initialLength) {
    return res.status(404).json({ error: "Commande non trouvée" });
  }
  writeJSONFile("orders.json", orders);
  res.json({ message: "Commande supprimée", id });
});

// ==================== CLIENTS API (admin only) ====================

app.get("/api/clients", authMiddleware, adminOnly, (req, res) => {
  res.json(readJSONFile("clients.json"));
});


app.get("/api/clients/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const client = clients.find((c) => c.id === id);
  if (!client) {
    return res.status(404).json({ error: "Client non trouvé" });
  }
  res.json(client);
});

// création brute de client via API (admin, ex. back-office)
app.post("/api/clients", authMiddleware, adminOnly, async (req, res) => {
  const { username, password } = req.body;

  // Basic Validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username et password sont obligatoires." });
  }

  // Check uniqueness
  if (clients.some(c => c.username && c.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newClient = {
    id: Date.now(),
    username: username,
    password: hashedPassword,
    role: "client",
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    registrationDate: req.body.registrationDate || new Date().toISOString(),
  };

  clients.push(newClient);
  writeJSONFile("clients.json", clients);

  const { password: _, ...clientWithoutPassword } = newClient;
  res.status(201).json(clientWithoutPassword);
});

app.put("/api/clients/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);

  // Allow if requested ID matches current user ID OR if user is admin or superadmin
  if (req.user.id !== id && req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Vous n'avez pas la permission de modifier ce profil" });
  }

  const index = clients.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Client non trouvé" });
  }

  // Preserve existing password if not provided in update
  const updatedClient = {
    ...clients[index],
    ...req.body,
    id, // Ensure ID remains consistent
  };

  clients[index] = updatedClient;
  writeJSONFile("clients.json", clients);

  const { password: _, ...clientWithoutPassword } = updatedClient;
  res.json(clientWithoutPassword);
});

app.delete("/api/clients/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const initialLength = clients.length;
  clients = clients.filter((c) => c.id !== id);
  if (clients.length === initialLength) {
    return res.status(404).json({ error: "Client non trouvé" });
  }
  writeJSONFile("clients.json", clients);
  res.json({ message: "Client supprimé", id });
});

// ==================== EMPLOYEES API (admin only) ====================

app.get("/api/employees", authMiddleware, adminOnly, (req, res) => {
  res.json(employees);
});

app.get("/api/employees/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const employee = employees.find((e) => e.id === id);
  if (!employee) {
    return res.status(404).json({ error: "Employé non trouvé" });
  }
  res.json(employee);
});

app.post("/api/employees", authMiddleware, adminOnly, (req, res) => {
  const newEmployee = {
    id: Date.now(),
    name: req.body.name,
    position: req.body.position,
    email: req.body.email,
    phone: req.body.phone,
    hireDate: req.body.hireDate || new Date().toISOString(),
    salary: req.body.salary,
  };
  employees.push(newEmployee);
  writeJSONFile("employees.json", employees);
  res.status(201).json(newEmployee);
});

app.put("/api/employees/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Employé non trouvé" });
  }
  employees[index] = {
    ...employees[index],
    ...req.body,
    id,
  };
  writeJSONFile("employees.json", employees);
  res.json(employees[index]);
});

app.delete("/api/employees/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const initialLength = employees.length;
  employees = employees.filter((e) => e.id !== id);
  if (employees.length === initialLength) {
    return res.status(404).json({ error: "Employé non trouvé" });
  }
  writeJSONFile("employees.json", employees);
  res.json({ message: "Employé supprimé", id });
});

// ==================== PAYMENTS API (admin only) ====================

app.get("/api/payments", authMiddleware, adminOnly, (req, res) => {
  res.json(payments);
});

app.get("/api/payments/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const payment = payments.find((p) => p.id === id);
  if (!payment) {
    return res.status(404).json({ error: "Paiement non trouvé" });
  }
  res.json(payment);
});

app.post("/api/payments", authMiddleware, (req, res) => {
  const newPayment = {
    id: Date.now(),
    orderId: req.body.orderId,
    clientId: req.user.id,
    amount: req.body.amount,
    paymentMethod: req.body.paymentMethod,
    paymentStatus: req.body.paymentStatus || "En attente",
    paymentDate: req.body.paymentDate || new Date().toISOString(),
    transactionId: req.body.transactionId || `TXN${Date.now()}`,
  };
  payments.push(newPayment);
  writeJSONFile("payement.json", payments);
  res.status(201).json(newPayment);
});


app.put("/api/payments/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const index = payments.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Paiement non trouvé" });
  }
  payments[index] = {
    ...payments[index],
    ...req.body,
    id,
  };
  writeJSONFile("payement.json", payments);
  res.json(payments[index]);
});

app.delete("/api/payments/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const initialLength = payments.length;
  payments = payments.filter((p) => p.id !== id);
  if (payments.length === initialLength) {
    return res.status(404).json({ error: "Paiement non trouvé" });
  }
  writeJSONFile("payement.json", payments);
  res.json({ message: "Paiement supprimé", id });
});

// ==================== SERVER START ====================

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🍰 Sugar & Stats API Server running on http://localhost:${PORT}`);
});
