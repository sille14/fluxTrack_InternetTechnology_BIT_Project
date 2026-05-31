# fluxTrack Inventory Management System

#### Contents:
- [fluxTrack Inventory Management System](#fluxtrack-inventory-management-system)
      - [Contents:](#contents)
  - [Analysis](#analysis)
    - [Scenario](#scenario)
    - [User Stories](#user-stories)
    - [Use Case fluxTrack](#use-case-fluxtrack)
  - [Design](#design)
    - [Wireframe](#wireframe)
    - [Prototype](#prototype)
    - [Domain Design](#domain-design)
    - [Business Logic](#business-logic)
  - [Implementation](#implementation)
    - [Backend Technology](#backend-technology)
    - [Frontend Technology](#frontend-technology)
  - [Execution](#execution)
    - [Deployment to a PaaS](#deployment-to-a-paas)
  - [Project Management](#project-management)
    - [Roles](#roles)
    - [Milestones](#milestones)
      - [License](#license)
  - [List of Aids](#list-of-aids)

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


### Use Case fluxTrack

![](images/use-case.png)
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

## Design
> 🚧: Keep in mind the Corporate Identity (CI); you shall decide appropriately the color schema, graphics, typography, layout, User Experience (UX), and so on.

### Use Case Diagram


<img width="887" height="745" alt="image" src="https://github.com/user-attachments/assets/600af391-a386-4cb9-99da-f143601953f7" />



### Wireframe
> 🚧: It is suggested to start with a wireframe. The wireframe focuses on the website structure (Sitemap planning), sketching the pages using Wireframe components (e.g., header, menu, footer) and UX. You can create a wireframe already with draw.io or similar tools. 

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
> 🚧: Provide a picture and describe your domain model; you may use Entity-Relationship Model or UML class diagram. Both can be created in Visual Paradigm - we have an academic license for it.

Domain model:

<img width="567" height="467" alt="image" src="https://github.com/user-attachments/assets/967db2f1-79fc-4889-a5c5-01021e537e84" />


Layered Architecture:

<img width="1047" height="480" alt="image" src="https://github.com/user-attachments/assets/96328a78-b5cf-4f3d-aab1-f39d2b81416b" />

The `ch.fluxed.fluxtrack.data.domain` package contains the following domain objects / entities including getters and setters:
 
- **Partner** (`@Entity`): a fluxed business partner with name, email, phone, and one or more addresses.
- **Product** (`@Entity`): an item in the inventory with SKU, name, price, quantity, and a foreign key to its owning Partner.
- **Order** (`@Entity`): a recorded sale of a product, with denormalised product name and partner ID for query simplicity and historical readability.
- **SupportTicket** (`@Entity`): a partner-raised support request with subject, urgency, lifecycle state, and a conversation thread of messages.
- **Address** (`@Embeddable`): a structured address used inside Partner.
- **TicketMessage** (`@Embeddable`): a single message (author, content, timestamp) stored as part of a SupportTicket's conversation thread.

### Business Logic 
> 🚧 : Describe the business logic for **at least one business service** in detail. If available, show the expected path and HTPP method. The remaining documentation of APIs shall be made available in the swagger endpoint. The default Swagger UI page is available at /swagger-ui.html.

<!-- Based on the Use case description, there will be two user profiles, which have different roles and privileges.

- The Admin is able to see all products of all partners
- The Partner is only able to see the products listed under his profile

**Path**: [`/api/menu/?location="Basel"`] 

**Param**: `value="location"` Admitted value: "Basel","Brugg".

**Method:** `GET` -->

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
> 🚧: Briefly describe your technology stack, which apps were used and for what.

### Backend Technology
> 🚧: It is suggested to clone this repository, but you are free to start from fresh with a Spring Initializr. If so, describe if there are any changes to the PizzaRP e.g., different dependencies, versions & etc... Please, also describe how your database is set up. If you want a persistent or in-memory H2 database check [link](https://github.com/FHNW-INT/Pizzeria_Reference_Project/blob/main/pizza/src/main/resources/application.properties). If you have placeholder data to initialize at the app, you may use a variation of the method **initPlaceholderData()** available at [link](https://github.com/FHNW-INT/Pizzeria_Reference_Project/blob/main/pizza/src/main/java/ch/fhnw/pizza/PizzaApplication.java).

The backend is implemented as a Spring Boot REST API following a three-layer architecture on the server tier:
 
- **Controller layer** (`ch.fluxed.fluxtrack.controller`): exposes REST endpoints, handles HTTP concerns, delegates to services. Authentication is handled by a dedicated `AuthController` separate from the partner CRUD endpoints, isolating security concerns from business endpoints.
- **Service layer** (`ch.fluxed.fluxtrack.business`): implements business logic and the rules described above.
- **Persistence layer** (`ch.fluxed.fluxtrack.data.repository`): Spring Data JPA repositories backed by an H2 in-memory database.
Security is handled by Spring Security with JWT-based stateless authentication. Tokens are issued by `POST /token` (HTTP Basic on the request, JWT in the response body) and verified on every subsequent request via the `Authorization: Bearer <token>` header. Three users are configured in-memory: `wylaade` and `drachehoehli` (role `PARTNER`), and `admin` (roles `PARTNER` + `ADMIN`).
 
This Web application relies on [Spring Boot](https://projects.spring.io/spring-boot) and the following dependencies, configured via [Spring Initializr](https://start.spring.io/):
 
- [Spring Boot Starter Web](https://projects.spring.io/spring-boot) — REST controllers
- [Spring Boot Starter Thymeleaf](https://www.thymeleaf.org/) — server-rendered HTML templates
- [Spring Boot Starter Data JPA](https://projects.spring.io/spring-data) — repositories
- [Spring Boot Starter Security](https://spring.io/projects/spring-security) — JWT-based auth
- [H2 Database Engine](https://www.h2database.com) — in-memory database, runtime scope
- [springdoc-openapi-starter-webmvc-ui](https://springdoc.org/) v2.3.0 — generates Swagger UI at `/swagger-ui.html`
Initial test data is seeded on application startup via an `@PostConstruct` method in `fluxTrackApplication`, creating two partners (Wylaade GmbH, Drachehöhli GmbH), nine products, fifteen historical orders spread over the past 30 days, and four support tickets in different lifecycle states.


### Frontend Technology
> 🚧: Describe your views and what APIs is used on which view. If you don't have access to the Internet Technology class Budibase environment(https://inttech.budibase.app/), please write to Devid on MS teams.

The frontend is a server-rendered application built with Thymeleaf and vanilla JavaScript, intentionally avoiding any external frontend framework. The decision was made because:
 
- The application has a small, fixed set of views, which suits Thymeleaf's strengths (the lecturer's slides specifically call out internal dashboards as a Thymeleaf use case).
- It keeps the entire project in a single Spring Boot deployment, with one auth setup and no separate frontend build pipeline.
- It allows pixel-level fidelity to the Figma prototype, which would have been harder with a low-code platform.

The frontend consists of seven views, each backed by a Thymeleaf template and a vanilla JavaScript module that handles interactivity through the `fetch` API.
 
| View | URL | Backend endpoints used |
|---|---|---|
| Login | `/login` | `POST /token` |
| Dashboard | `/dashboard` | `GET /product/`, `GET /partner/` |
| Products | `/products` | `GET /product/`, `POST /product/add`, `PUT /product/{id}`, `DELETE /product/{id}`, `POST /order/sale` |
| Partners | `/partners` *(admin only)* | `GET /partner/`, `POST /partner/add`, `PUT /partner/{id}`, `DELETE /partner/{id}` |
| Order History | `/orders` | `GET /order/`, `GET /partner/` |
| Support Tickets | `/tickets` | `GET /ticket/`, `POST /ticket/`, `POST /ticket/{id}/admin-reply`, `/partner-reply`, `/resolve`, `/reopen`, `/complete` |
| Reports | `/reports` | `GET /order/`, `GET /partner/` |
 
Reusable templates are defined as Thymeleaf fragments under `templates/fragments/` (head, sidebar, topbar). The sidebar accepts an `activePage` parameter to highlight the current view. Shared client logic lives in `static/js/auth.js`, which handles login, token storage in `localStorage`, an `authFetch()` wrapper that attaches the JWT to every request and redirects to `/login` on 401/403, admin-only sidebar visibility, per-user company branding in the topbar (admin sees the fluxed mark and the label "Administrator"; partners see their own company logo and display name), and a sidebar collapse toggle whose state is persisted across navigation in `localStorage`.

A dedicated `bell.js` module runs on every authenticated page (loaded via the topbar fragment) and provides a notifications indicator: it fetches the user's tickets, computes "events" the user has not yet seen based on a `localStorage` timestamp of their last visit to `/tickets`, and lights up a small red dot on the bell icon if any unseen events exist. Clicking the bell opens a dropdown of recent events, each linking back to the tickets page.

The Reports view renders an SVG bar chart of daily revenue across the selected date range, computed client-side from the orders data. CSV exports are generated in-browser using a `Blob` and a synthetic anchor download, with a UTF-8 BOM so the resulting files open cleanly in Microsoft Excel including umlauts in product and partner names.

The Products view layers a few UX touches on top of the basic CRUD endpoints: an Edit modal that reuses the New Product form (same fields, swaps POST for PUT), placeholder text in that modal that adapts to the logged-in partner's domain (wine examples for Wylaade, board-game examples for Drachehöhli, generic for admin until a partner is picked from the dropdown), and row checkboxes with a working "select all" plus a bulk-delete action that fires parallel DELETE requests through the existing ownership-protected endpoint.
 
Styling is implemented in `static/css/app.css` using CSS custom properties for the design tokens (gold/brown brand palette, navy login accent, status pill colours), with `static/css/login.css` providing the login page's brand orb. The design follows the Figma prototype created during the Requirements Engineering module.


## Execution
> 🚧: Please describe how to execute your app and what configurations must be changed to run it. 

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


### Deployment to a PaaS
> 🚧: Deployment to PaaS is optional but recommended as it will make your application (backend) accessible without server restart and through a unique, constantly available link.  

Alternatively, you can deploy your application to a free PaaS like [Render](https://dashboard.render.com/register).
1. Refer to the Dockerfile inside the application root (FHNW-INT/Pizzeria_Reference_Project/pizza).
2. Adapt line 13 to the name of your jar file. The jar name should be derived from the details in the pom.xml as follows:<br>
`{artifactId}-{version}.jar` 
2. Login to Render using your GitHub credentials.
3. Create a new Web Service and choose Build and deploy from a Git repository.
4. Enter the link to your (public) GitHub repository and click Continue.
5. Enter the Root Directory (name of the folder where pom.xml resides).
6. Choose the Instance Type as Free/Hobby. All other details are default.
7. Click on Create Web Service. Your app will undergo automatic build and deployment. Monitor the logs to view the progress or error messages. The entire process of Build+Deploy might take several minutes.
8. After successful deployment, you can access your backend using the generated unique URL (visible on top left under the name of your web service).
9. This unique URL will remain unchanged as long as your web service is deployed on Render. You can now integrate it in Budibase to make API calls to your custom endpoints.

## Project Management
> 🚧: Include all the participants and briefly describe each of their **individual** contribution and/or roles. Screenshots/descriptions of your Kanban board or similar project management tools are welcome.

### Roles

*(To be completed: short bullets describing each team member's primary contribution.)*
 
- **Fabian Arnold:** *(area of focus)*
- **Remy Brunner:** *(area of focus)*
- **Silvan Meier:** *(area of focus)*
- **Florian Stiegeler:** *(area of focus)*


### Milestones
1. **Analysis:** Scenario ideation, use case analysis and user story writing.
2. **Prototype Design:** Creation of wireframe and Figma prototype.
3. **Domain Design:** Definition of domain model.
4. **Business Logic and API Design:** Definition of business logic and REST API specification (OpenAPI).
5. **Data and API Implementation:** Implementation of persistence, business logic, and REST controllers.
6. **Security and Frontend Implementation:** JWT-based security, Thymeleaf templates, vanilla JavaScript frontend.
7. **Feature completion:** Support ticket lifecycle, sales reports with CSV export, notifications bell.
8. **(optional) Deployment:** Deployment of the application to Render.

## List of Aids
 
In line with the declaration of authenticity in our Requirements Engineering paper, this section documents tools used during the implementation phase of the Internet Technology project.
 
| Aid | Usage | Affected areas |
|---|---|---|
| Claude (Anthropic) | Pair-programming assistant used to plan the frontend architecture, scaffold Thymeleaf templates, write the vanilla JavaScript modules, design the business rules in the service layer (including the ownership-protected update and delete patterns), draft this README, and debug integration issues. The decisions about scope, design, and architecture were taken by the project team; Claude was used to accelerate implementation. | Frontend templates and JavaScript (`templates/`, `static/`), service-layer business rules, README documentation |
| Grammarly | Grammatical review and phrasing improvements | README and inline documentation comments |


#### Maintainer
- Fabian Arnold
- Remy Brunner
- Silvan Meier
- Florian Stiegeler

#### License
- [Apache License, Version 2.0](blob/master/LICENSE)
