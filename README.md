# STYLE — E-Commerce Frontend

A luxury fashion storefront built with **React 19 + TypeScript + Vite**, backed by a Spring Boot REST API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3 + custom CSS variables |
| Icons | Lucide React |
| API | Spring Boot (proxied via Vite in dev, served from `dist/` in prod) |

---

## Project Structure

```
src/
├── components/
│   ├── Header.tsx        # Sticky nav, search, user menu, admin button
│   ├── Hero.tsx          # Full-viewport editorial hero section
│   ├── ProductGrid.tsx   # Responsive product card grid
│   ├── ProductCard.tsx   # Individual product card with add-to-cart
│   ├── CartDrawer.tsx    # Left-side cart drawer
│   ├── AuthModal.tsx     # Login / register modal
│   ├── Checkout.tsx      # Checkout form with card validation
│   ├── Footer.tsx        # Newsletter, links, social icons
│   └── Adminpanel.tsx    # Full admin dashboard (products, orders, users, system)
├── utility/
│   └── api.ts            # All fetch calls to the Spring Boot API
├── types.ts              # Shared TypeScript types
├── App.tsx               # Root component, state, routing logic
├── main.tsx              # React entry point
└── index.css             # Design system (CSS variables, animations, global styles)
```

---

## Getting Started

### Prerequisites

- Node.js 18 or newer
- Spring Boot backend running on `http://localhost:8080`

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Vite starts on `http://localhost:5173`. All `/api/*` requests are automatically proxied to `http://localhost:8080` — no CORS configuration needed in dev.

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve this folder from your Spring Boot app (place `dist/` contents in `src/main/resources/static/`) or from a web server like Nginx.

### Preview production build locally

```bash
npm run preview
```

---

## Environment & Proxy

In development, `vite.config.ts` proxies API calls:

```ts
server: {
  proxy: {
    "/api": "http://localhost:8080"
  }
}
```

In production (`dist/`), requests to `/api/*` must reach the Spring Boot server. If you serve the frontend separately (e.g. Nginx), add a proxy rule:

```nginx
location /api/ {
    proxy_pass http://localhost:8080;
}
```

If you serve `dist/` from Spring Boot's `static/` folder, no extra configuration is needed.

---

## Key Features

### Storefront
- Product grid with category filter pills and live search
- Header nav links: **New Arrivals**, **Men**, **Women**, **Sale**
  - *New Arrivals* — products with tag `new`
  - *Sale* — products with tag `sale`
  - *Men* — products with gender `men` or `unisex`, or tag `men`/`male`, or category `men`
  - *Women* — products with gender `women` or `unisex`, or tag `women`/`female`, or category `women`

### Authentication
- Login / Register modal
- JWT stored in `localStorage`
- Role-based UI — admin sees an **Admin** button in the header

### Cart
- Left-side drawer, quantity controls, remove items
- Backend cart sync when logged in (`POST /api/user/cart/add`, etc.)

### Checkout
- Shipping form + card entry with inline validation
  - Card number: 16 digits
  - Expiry: MM/YY, must not be expired
  - CVV: 3 digits
- Valid payment → `POST /api/user/orders/place` then `PUT /api/user/orders/{id}/pay` → order marked **PAID**
- Invalid payment → order placed but stays **PENDING** (admin can review)
- Saved cards: select from wallet or save a new card after checkout

### Admin Dashboard (`/admin` via header button, ADMIN role required)
| Tab | What it does |
|---|---|
| Dashboard | Revenue, order count, recent orders table |
| Products | Add / edit / delete products (name, price, stock, image, gender, tags) |
| Orders | View all orders, filter by status, cancel PENDING orders |
| Users | Add / delete users, promote to ADMIN or demote to USER |
| System | Token blacklist cleanup |

---

## API Reference (consumed endpoints)

### Public
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Fetch all products |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/register` | Register new user |

### User (requires JWT)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/cards` | List saved wallet cards |
| `POST` | `/api/user/cards` | Add card to wallet |
| `DELETE` | `/api/user/cards/{id}` | Remove card from wallet |
| `POST` | `/api/user/cart/add` | Add item to backend cart |
| `DELETE` | `/api/user/cart/remove` | Remove item from backend cart |
| `PUT` | `/api/user/cart/items/{id}` | Update cart item quantity |
| `DELETE` | `/api/user/cart/clear` | Clear backend cart |
| `POST` | `/api/user/orders/place` | Place order from cart |
| `PUT` | `/api/user/orders/{id}/pay` | Pay for an order |

### Admin (requires ADMIN role)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/items` | List all products |
| `POST` | `/api/admin/items` | Create product |
| `PUT` | `/api/admin/items/{id}` | Update product |
| `DELETE` | `/api/admin/items/{id}` | Delete product |
| `GET` | `/api/admin/orders` | List all orders (paginated) |
| `PUT` | `/api/admin/orders/{id}/cancel` | Cancel an order |
| `GET` | `/api/admin/users` | List all users |
| `POST` | `/api/auth/register` | Create user (admin flow) |
| `DELETE` | `/api/admin/users/{id}` | Delete user |
| `PUT` | `/api/admin/users/{id}/role` | Promote / demote user |
| `DELETE` | `/api/admin/blacklist/cleanup` | Remove expired tokens |
| `DELETE` | `/api/admin/blacklist/force-cleanup` | Purge all blacklisted tokens |

---

## Design System

CSS variables are defined in `index.css`:

```css
--font-display:   'Cormorant Garamond'   /* editorial serif — headings */
--font-body:      'DM Sans'              /* clean sans-serif — body text */
--color-bg:       #FAFAF8
--color-text:     #1A1A1A
--color-accent:   #C9A96E               /* gold — CTAs, highlights */
--color-border:   #E5E5E0
```

Animations available: `fadeIn`, `slideUp`, `slideInLeft`, `scaleIn`, `spin`.

---

## Linting

```bash
npm run lint
```

---

## License

MIT License – feel free to use and adapt.
