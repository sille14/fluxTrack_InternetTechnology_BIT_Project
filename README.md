# fluxTrack Inventory Management System

#### Contents
- [fluxTrack Inventory Management System](#fluxtrack-inventory-management-system)
  - [Submission - Links to Deliverables](#submission---links-to-deliverables)
  - [Analysis](#analysis)
    - [Scenario](#scenario)
    - [User Stories](#user-stories)
    - [Use Case fluxTrack](#use-case-fluxtrack)
  - [Design](#design)
    - [Use Case Diagram](#use-case-diagram)
    - [Wireframe](#wireframe)
    - [Prototype](#prototype)
    - [Domain Design](#domain-design)
    - [Business Logic](#business-logic)
  - [Implementation](#implementation)
    - [Backend Technology](#backend-technology)
    - [Frontend Technology](#frontend-technology)
  - [Execution](#execution)
    - [Deployment to GitHub Codespaces](#deployment-to-github-codespaces)
    - [Deployment to Render](#deployment-to-render)
    - [Known Limitations](#known-limitations)
    - [What We're Most Proud Of](#what-were-most-proud-of)
  - [Project Management](#project-management)
    - [Roles](#roles)
    - [Milestones](#milestones)
      - [Maintainer](#maintainer)
      - [License](#license)

## Submission - Links to Deliverables
> **GitHub repository**: [https://github.com/sille14/fluxTrack_InternetTechnology_BIT_Project](https://github.com/sille14/fluxTrack_InternetTechnology_BIT_Project)
> **Live application:** [fluxtrack-internettechnology-bit-project.onrender.com](https://fluxtrack-internettechnology-bit-project.onrender.com)  
> **API documentation (Swagger UI):** [Render](https://fluxtrack-internettechnology-bit-project.onrender.com/swagger-ui.html)  
> **Presentation video:** [Watch on SWITCHtube](https://tube.switch.ch/videos/i8XRfceaH7)   

## Analysis
The original project idea comes from the need of fluxed GmbH to replace manual stock communication between the company and its partners. In the existing process, partners still communicate inventory changes manually, for example through Excel sheets, e-mail, or chat. This leads to delays, missing transparency, and situations where products may still appear purchasable although they are no longer in stock. The purpose of fluxTrack is therefore to provide a central inventory management system with real-time or near-real-time stock visibility and easier maintenance of product data. 

The assessment also requires that the application demonstrates at least three layers on two tiers, at least four views, at least four entities, and at least one business rule in the service layer. The fluxTrack concept matches this very well, because it already defines a web client, backend logic, database interaction, several product- and account-related use cases, and Shopify-related data exchange.

### Scenario


fluxTrack is a web application for fluxed GmbH and its partners to manage product inventory centrally. The goal of the system is to reduce manual work, improve inventory transparency, and synchronise relevant stock data with the fluxed web shop. Different users of fluxed GmbH and its partners can receive different access rights based on their application role.


### User Stories
(1) As an admin, I want to view all products across all partners, so that I can have a complete overview of the product range.  
(2) As a partner, I want to view all products under my profile, so that I can manage and review my own product listings.  
(3) As an admin or partner, I want to create new product entries, so that I can expand the product range available in the application.  
(4) As an admin or partner, I want to view detailed information about a specific product, so that I can understand its attributes and details.  
(5) As an admin or partner, I want to create, update, and delete products, so that I can keep the product range accurate and up to date.  
(6) As an admin, I want to create new partner profiles, so that new partners can be onboarded into the system.  
(7) As an admin or partner, I want to edit partner profiles, so that partner information remains accurate and up to date.  
(8) As an admin, I want to view all partners, so that I can have an overview of all partner profiles in the system.  
(9) As an admin or partner, I want to see the historical orders relevant to me, so that I can understand demand patterns over time.  
(10) As a partner, I want to raise support tickets and follow the response from fluxed, so that I can resolve technical issues affecting my inventory.  
(11) As an admin or partner, I want to see aggregated sales reports for the relevant scope, so that I can understand performance over time.  
(12) As an admin, I want to create, edit, and delete user accounts and assign them roles and partner links, so that I can control who has access to the system.


### Use Case fluxTrack

- UC-1 [View all Products (Admin)]: Admin can retrieve all the Products on the product range from all Partners.
- UC-2 [View Own Products (Partner)]: Partner can retrieve all the Products listed under the Partner's profile.
- UC-3 [Create Product]: Admin and Partner can create new product entries in the application.
- UC-4 [View Product Details]: Admin and Partner can retrieve the information on a specific product.
- UC-5 [Edit a Product]: Admin and Partner can create, update, and delete products from the product range.
- UC-6 [Create Partner Profile]: Admin can create new Partner Profiles.
- UC-7 [Edit Partner Profile]: Admin can edit Partner Profiles.
- UC-8 [View all Partners]: Admin can see an overview of all Partners.
- UC-9 [View Order History]: Admin and Partner can review historical orders, scoped by role.
- UC-10 [Submit and follow Support Tickets]: Partner can raise tickets; admin responds and progresses each ticket through its documented lifecycle.
- UC-11 [Generate Reports]: Admin and Partner can review aggregated sales data with a date range filter and export CSVs of the visible tables.
- UC-12 [Manage Users]: Admin can create, update, and delete application users incl. logins, assign roles, link them to partners, and manage avatars.

## Design

### Use Case Diagram


<img width="895" height="740" alt="image" src="https://github.com/user-attachments/assets/c56d296d-9336-4046-8e3c-007b15c36983" />




### Wireframe

We start on the login screen, where each user has a different login, which is linked to the profile (Partner or Admin). After login, the user is presented with a Dashboard summarising inventory health (own products if Partner, all products if Admin). From there, the user can navigate via the sidebar to Products, Partners (admin only), Orders, Support Tickets, and Reports.
 
On the Products page, the user can add a new product via a pop-up where they enter Product Name, SKU, Price in CHF, and current stock quantity. Once saved, the product is displayed on the overview. Existing products can be edited or deleted, and stock can be adjusted in place using +/- buttons. Each stock decrease records a sale in the Order History.


### Prototype

Login Screen:
<img width="973" height="689" alt="image" src="https://github.com/user-attachments/assets/7255a249-f960-416f-9f05-152fae2eb4c7" />

Product Overview / Homepage:
<img width="936" height="664" alt="image" src="https://github.com/user-attachments/assets/ee1075c0-bc08-4ab0-8fdd-695cbe6d2c0d" />

Add Product Screen:
<img width="972" height="689" alt="image" src="https://github.com/user-attachments/assets/62d658ac-b925-4c2a-b7d0-4840e4aa0fab" />

### Domain Design

Domain model:

<img width="555" height="525" alt="image" src="https://github.com/user-attachments/assets/0833ec2f-9dc9-4780-b000-e0cd6082a47a" />


Layered Architecture:

<img width="1050" height="485" alt="image" src="https://github.com/user-attachments/assets/1a860290-39e4-4183-b94a-529040bafa1a" />

The `ch.fluxed.fluxtrack.data.domain` package contains the following domain objects / entities including getters and setters:
 
- **Partner** (`@Entity`): a fluxed business partner with name, email, phone, and one or more addresses.
- **Product** (`@Entity`): an item in the inventory with SKU, name, price, quantity, and a foreign key to its owning Partner.
- **Order** (`@Entity`): a recorded sale of a product, with denormalised product name and partner ID for query simplicity and historical readability.
- **SupportTicket** (`@Entity`): a partner-raised support request with subject, urgency, lifecycle state, and a conversation thread of messages.
- **AppUser** (`@Entity`): an application user with username, BCrypt-hashed password, role (ADMIN or PARTNER), optional partner link, display name, and avatar (stored as a BLOB).
- **Address** (`@Embeddable`): a structured address used inside Partner.
- **TicketMessage** (`@Embeddable`): a single message (author, content, timestamp) stored as part of a SupportTicket's conversation thread.


### Business Logic 

The application enforces five business rules in the service layer (`ch.fluxed.fluxtrack.business`), each traceable to a specific use case in the Requirements Engineering paper.
 
**Rule 1 — Role-based product visibility (UC 301)**
 
*Service method:* `ProductService.getProductsForUser(Authentication auth)`
*Endpoint:* `GET /product/`
 
When the authenticated user is `admin`, the service returns all products across the system. When the user is a partner, the service returns only the products whose `productPartnerID` matches the user's partner mapping. This enforces tenant isolation at the read layer regardless of which controller invokes the service.
 
**Rule 2 — Ownership-protected deletion (UC 5)**
 
*Service method:* `ProductService.deleteProductForUser(Long id, Authentication auth)`
*Endpoint:* `DELETE /product/{id}`
 
Admin users can delete any product. Partner users can only delete products they own. Attempts to delete another partner's product return HTTP 403 Forbidden. The same protection prevents a partner from indirectly inferring the existence of another partner's products by id.

**Rule 3 — Ownership-protected update (UC 5)**

*Service method:* `ProductService.updateProductForUser(Long id, Product product, Authentication auth)`
*Endpoint:* `PUT /product/{id}`

Admin users can update any product, including reassigning its `productPartnerID` to a different partner. Partner users can only update products they own. As an additional defence, when a partner submits a request body that contains a different `productPartnerID`, the service overrides the value with the caller's own partnerID before persisting; this prevents a partner from "giving a product away" to another partner via a hand-crafted PUT. Attempts to update another partner's product return HTTP 403 Forbidden, mirroring the delete pattern so neither operation leaks the existence of another partner's products to non-owners.
 
**Rule 4 — Atomic sale recording (UC 304)**
 
*Service method:* `OrderService.createOrderForSale(Long productId, Integer quantity, Authentication auth)`
*Endpoint:* `POST /order/sale`
 
A stock decrement from the inventory UI triggers this method, which atomically validates:
1. Quantity is positive;
2. Sufficient stock exists;
3. The caller owns the product (admin bypasses).
It then creates an `Order` record with a price snapshot (`product price × quantity`) and decrements the product's stock. If any check fails, no state changes are persisted.

**Rule 5 — Support ticket state transition validation (UC 107)**

*Service methods:* `SupportTicketService.adminReply()`, `partnerReply()`, `markResolved()`, `adminReopen()`, `markCompleted()`
*Endpoints:* `POST /ticket/{id}/admin-reply`, `/partner-reply`, `/resolve`, `/reopen`, `/complete`

Tickets follow the state machine documented in Figure 9 of the Requirements Engineering paper: OPEN → ANSWERED → (RESOLVED | OPEN) → (COMPLETED | ANSWERED). Each transition is exposed as a dedicated service method that enforces:
1. The required role of the actor (admin-only or partner-only);
2. Ownership of the ticket for partner actions;
3. The current state being a valid source for the requested transition.

Invalid transitions (e.g. attempting to move a ticket from OPEN directly to RESOLVED) are rejected with HTTP 409 Conflict, ensuring the persisted state can never reach an inconsistent configuration.


## Implementation

### Backend Technology

The backend is implemented as a Spring Boot REST API following a three-layer architecture on the server tier:
 
- **Controller layer** (`ch.fluxed.fluxtrack.controller`): exposes REST endpoints, handles HTTP concerns, delegates to services. Authentication is handled by a dedicated `AuthController` separate from the partner CRUD endpoints, isolating security concerns from business endpoints.
- **Service layer** (`ch.fluxed.fluxtrack.business`): implements business logic and the rules described above.
- **Persistence layer** (`ch.fluxed.fluxtrack.data.repository`): Spring Data JPA repositories backed by an H2 in-memory database.
Security is handled by Spring Security with JWT-based stateless authentication. Tokens are issued by `POST /token` (HTTP Basic on the request, JWT in the response body) and verified on every subsequent request via the `Authorization: Bearer <token>` header. Three users are seeded on first boot via AppUserService.seedUser(): `wylaade` and `drachehoehli` (role `PARTNER`), and `admin` (roles `PARTNER` + `ADMIN`).
 
This Web application relies on [Spring Boot](https://projects.spring.io/spring-boot) and the following dependencies, configured via [Spring Initializr](https://start.spring.io/):
 
- [Spring Boot Starter Web](https://projects.spring.io/spring-boot) — REST controllers
- [Spring Boot Starter Thymeleaf](https://www.thymeleaf.org/) — server-rendered HTML templates
- [Spring Boot Starter Data JPA](https://projects.spring.io/spring-data) — repositories
- [Spring Boot Starter Security](https://spring.io/projects/spring-security) — JWT-based auth
- [Spring Boot Starter Actuator](https://spring.io/guides/gs/actuator-service) — health/info endpoints
- [Spring Boot Starter OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html) — JWT verification
- [PostgreSQL driver](https://jdbc.postgresql.org/) — production profile support
- [H2 Database Engine](https://www.h2database.com) — in-memory database, runtime scope
- [springdoc-openapi-starter-webmvc-ui](https://springdoc.org/) v2.8.8 — generates Swagger UI at `/swagger-ui.html`
Initial test data is seeded on application startup via an `@PostConstruct` method in `fluxTrackApplication`, creating two partners (Wylaade GmbH, Drachehöhli GmbH), 19 products, around 35 historical orders spread over the past two months, and four support tickets in different lifecycle states.


### Frontend Technology

The frontend is a server-rendered application built with Thymeleaf and vanilla JavaScript, intentionally avoiding any external frontend framework. The decision was made because:
 
- The application has a small, fixed set of views, which suits Thymeleaf's strengths (the lecturer's slides specifically call out internal dashboards as a Thymeleaf use case).
- It keeps the entire project in a single Spring Boot deployment, with one auth setup and no separate frontend build pipeline.
- It allows pixel-level fidelity to the Figma prototype, which would have been harder with a low-code platform.

The frontend consists of eight views, each backed by a Thymeleaf template and a vanilla JavaScript module that handles interactivity through the `fetch` API.
 
| View | URL | Backend endpoints used |
|---|---|---|
| Login | `/login` | `POST /token` |
| Dashboard | `/dashboard` | `GET /product/`, `GET /partner/` |
| Products | `/products` | `GET /product/`, `POST /product/add`, `PUT /product/{id}`, `DELETE /product/{id}`, `POST /order/sale` |
| Partners | `/partners` *(admin only)* | `GET /partner/`, `POST /partner/add`, `PUT /partner/{id}`, `DELETE /partner/{id}` |
| Users | `/users` *(admin only)* | `GET /user/`, `POST /user/add`, `PUT /user/{id}`, `DELETE /user/{id}`, `POST /user/{id}/avatar` |
| Order History | `/orders` | `GET /order/page`, `GET /order/summary`, `GET /partner/` |
| Support Tickets | `/tickets` | `GET /ticket/`, `POST /ticket/`, `POST /ticket/{id}/admin-reply`, `/partner-reply`, `/resolve`, `/reopen`, `/complete` |
| Reports | `/reports` | `GET /order/`, `GET /partner/` |
 
Reusable templates are defined as Thymeleaf fragments under `templates/fragments/` (head, sidebar, topbar). The sidebar accepts an `activePage` parameter to highlight the current view. Shared client logic lives in `static/js/auth.js`, which handles login, token storage in `localStorage`, an `authFetch()` wrapper that attaches the JWT to every request and redirects to `/login` on 401/403, admin-only sidebar visibility, per-user company branding in the topbar (admin sees the fluxed mark and the label "Administrator"; partners see their own company logo and display name), and a sidebar collapse toggle whose state is persisted across navigation in `localStorage`.

A dedicated `bell.js` module runs on every authenticated page (loaded via the topbar fragment) and provides a notifications indicator: it fetches the user's tickets, computes "events" the user has not yet seen based on a `localStorage` timestamp of their last visit to `/tickets`, and lights up a small red dot on the bell icon if any unseen events exist. Clicking the bell opens a dropdown of recent events, each linking back to the tickets page.

The Reports view renders an SVG bar chart of daily revenue across the selected date range, computed client-side from the orders data. CSV exports are generated in-browser using a `Blob` and a synthetic anchor download, with a UTF-8 BOM so the resulting files open cleanly in Microsoft Excel including umlauts in product and partner names.

The Products view layers a few UX touches on top of the basic CRUD endpoints: an Edit modal that reuses the New Product form (same fields, swaps POST for PUT), placeholder text in that modal that adapts to the logged-in partner's domain (wine examples for Wylaade, board-game examples for Drachehöhli, generic for admin until a partner is picked from the dropdown), and row checkboxes with a working "select all" plus a bulk-delete action that fires parallel DELETE requests through the existing ownership-protected endpoint.
 
Styling is implemented in `static/css/app.css` using CSS custom properties for the design tokens (gold/brown brand palette, navy login accent, status pill colours), with `static/css/login.css` providing the login page's brand orb. The design follows the Figma prototype created during the Requirements Engineering module.


## Execution

The application runs as a single Spring Boot service.
 
**Prerequisites:** JDK 17+, Maven 3.8+.
 
1. Clone this repository.
2. From the project root containing `pom.xml`, run:
   ```
   ./mvnw spring-boot:run
   ```
   (or `mvnw.cmd spring-boot:run` on Windows)
3. Once the application has started, open [http://localhost:8080/](http://localhost:8080/) in your browser. You will be redirected to the login page.
4. Log in using one of the seeded users:
   | Username | Password | Role |
   |---|---|---|
   | `admin` | `admin` | Admin (sees everything) |
   | `wylaade` | `password` | Partner (sees only Wylaade GmbH) |
   | `drachehoehli` | `password` | Partner (sees only Drachehöhli GmbH) |
5. The API documentation is available at [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html). To call authenticated endpoints from Swagger UI, paste a JWT obtained via `POST /token` into the *Authorize* dialog.
H2 runs in in-memory mode, so all data resets on each application restart and is rebuilt from the seed data in `fluxTrackApplication.initTestData()`.

### Deployment to GitHub Codespaces

This repository includes a `.devcontainer/devcontainer.json` that configures a ready-to-run
development environment. To launch:

1. Open the repository on GitHub.
2. Click **Code → Codespaces → Create codespace on main**.
3. Wait for the container to build (~2-3 minutes on first launch).
4. Run the application via the IDE's Run button or `./mvnw spring-boot:run` in the terminal.
5. The forwarded port 8080 opens automatically in your browser.

### Deployment to Render

The application is deployed on [Render](https://render.com) as a Docker-based web service backed by a managed PostgreSQL database.

**Live URL:** [https://fluxtrack-internettechnology-bit-project.onrender.com](https://fluxtrack-internettechnology-bit-project.onrender.com)

The free-tier instance spins down after inactivity, so the first request after a period of inactivity may take ~30-50 seconds while the container restarts. Subsequent requests are fast.

**API documentation:** [https://fluxtrack-internettechnology-bit-project.onrender.com/swagger-ui.html](https://fluxtrack-internettechnology-bit-project.onrender.com/swagger-ui.html)

**How it works:**

- A multi-stage `Dockerfile` in the `fluxTrack/` directory builds the Maven project and packages the JAR into a lightweight `eclipse-temurin:17-jdk-alpine` image.
- The `SPRING_PROFILES_ACTIVE=prod` environment variable activates `application-prod.properties`, which configures the PostgreSQL driver and dialect.
- Database credentials (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) and a production `JWT_KEY` are set as environment variables on Render — never committed to the repository.
- On first boot, `initTestData()` seeds the demo data (partners, products, orders, tickets, users). Since PostgreSQL persists across restarts, the seed guard (`if (!partnerService.getAllPartners().isEmpty()) return;`) ensures the data is only created once.

**Login credentials are the same as local development:**

| Username | Password | Role |
|---|---|---|
| `admin` | `admin` | Admin |
| `wylaade` | `password` | Partner (Wylaade GmbH) |
| `drachehoehli` | `password` | Partner (Drachehöhli GmbH) |

### Known Limitations

- **H2 in local development.** The default dev profile uses an in-memory H2 database that resets on every restart. The production deployment on Render uses PostgreSQL with persistent data. The PostgreSQL prod profile is activated via environment variables and is not the default to keep local setup frictionless.
- **No Shopify integration.** The Requirements Engineering paper specifies bidirectional stock sync with Shopify (UC 202–205). This was descoped for the IT project because the Shopify API requires a paid developer store and OAuth credentials that would expire before grading. The architecture (service layer, REST endpoints) is designed so that a Shopify sync service could be added without changing existing code.
- **No email notifications.** UC 107 mentions email alerts when a ticket state changes. The current implementation uses an in-app notification bell instead, which fulfils the same user need without requiring an SMTP server or third-party email service.
- **Password recovery is not implemented.** The "Forgot password?" link on the login page shows a notice directing the user to contact their administrator. A real implementation would require email infrastructure.
- **CSV export only, no PDF.** The Reports page supports CSV downloads but not PDF. Adding PDF generation would require an external library (e.g. iText or Apache PDFBox), which was not justified given the assessment scope.
- **Single-currency (CHF).** Prices and revenue figures are hardcoded to Swiss francs. Multi-currency support was out of scope.

### What We're Most Proud Of

- **The support ticket system.** Building a full state machine (OPEN → ANSWERED → RESOLVED → COMPLETED, with reopening) with role-aware actions, a real-time conversation thread, and a notification bell that tracks unseen events via localStorage timestamps was the most complex feature and the one that taught us the most about modelling business workflows in a service layer.
- **Ownership protection as a pattern.** Rather than scattering `if (isAdmin)` checks across controllers, we centralised ownership logic in the service layer: the same pattern (admin bypass, partner ownership check, defensive override) applies consistently to product reads, updates, deletes, order creation, and ticket actions. This made the codebase easier to reason about and extend.
- **The frontend without a framework.** Vanilla JavaScript with `fetch` and DOM manipulation proved surprisingly capable for a dashboard application. Avoiding React or Vue kept the project in a single deployable artifact with zero build tooling, while still delivering features like debounced search, server-side pagination, tri-state select-all checkboxes, and an SVG bar chart — all without a single `npm install`.
- **Profile-based dynamic branding.** The topbar, sidebar visibility, and modal placeholders all adapt to the logged-in user's profile (fetched once at login and cached in localStorage). Adding a new admin or partner user through the UI immediately works everywhere — no code changes, no config file edits.

## Project Management

### Roles

- **Fabian Arnold:** Backend design, domain modelling, and UML documentation (use case diagram, domain model, layered architecture diagram). Contributed to README documentation and supported integration testing across the service layer.
- **Remy Brunner:** Frontend implementation (all eight Thymeleaf/vanilla JS views), Codespaces and Render deployment, service-layer business rules, demo video recording and README documentation.
- **Silvan Meier:** Backend implementation and initial security setup (Spring Boot project structure, entity definitions, repository layer, JWT authentication scaffold). Repository management and GitHub administration.
- **Florian Stiegeler:** Frontend design and application concept. Defined the business requirements and Figma prototype that shaped the use case specifications, and validated the final application against real-world inventory management workflows as the owner of fluxed GmbH.


### Milestones
1. **Analysis:** Scenario ideation, use case analysis and user story writing.
2. **Prototype Design:** Creation of wireframe and Figma prototype.
3. **Domain Design:** Definition of domain model.
4. **Business Logic and API Design:** Definition of business logic and REST API specification (OpenAPI).
5. **Data and API Implementation:** Implementation of persistence, business logic, and REST controllers.
6. **Security and Frontend Implementation:** JWT-based security, Thymeleaf templates, vanilla JavaScript frontend.
7. **Feature completion:** Support ticket lifecycle, sales reports with CSV export, notifications bell.
8. **Deployment:** Deployment of the application to Render with PostgreSQL and GitHub Codespaces for cloud-based development.

#### Maintainer
- Fabian Arnold
- Remy Brunner
- Silvan Meier
- Florian Stiegeler

#### License
This project was developed as part of the Internet Technology module at FHNW and is provided for educational purposes.
- [Apache License, Version 2.0](/LICENSE)
