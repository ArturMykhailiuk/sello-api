# SELL-O API - AI Agent Instructions

## Project Overview

This is a **Node.js/Express REST API** for SELL-O (formerly "SELL-O"), a service and service-sharing platform with integrated AI workflow automation via n8n. The API serves both a React frontend and manages n8n workflow orchestration for AI-powered assistants.

## Architecture & Data Flow

### Core Layers (MVC Pattern)

- **Routes** (`routes/`) → **Middlewares** → **Controllers** (`controllers/`) → **Services** (`services/`) → **Models** (`db/models/`)
- All controllers wrapped with `ctrlWrapper` for automatic error handling
- All async controllers must `throw HttpError(status, message)` for errors (never use `res.status().json()` for errors)

### Key Architectural Components

**Database**: PostgreSQL via Sequelize ORM with SSL (required)

- Models use static `initModel(sequelize)` and `associate(sequelize)` methods
- Associations defined in `associate()`: `belongsTo`, `hasMany`, `belongsToMany` through junction tables
- Junction tables: `serviceIngredient`, `ServiceItem`, `UserFavoriteservice`, `UserFavoriteService`, `UserFollower`, `WorkflowAITemplate`

**Authentication**: JWT-based with token stored in `users.token` column

- `authenticate` middleware: requires valid Bearer token, sets `req.user`
- `identifyUser` middleware: optional authentication (sets `req.user` or null)
- Token expires in 9 hours (configured in `authServices.js`)

**File Upload**: Multer → Sharp → `/public/{avatars,services}`

- `imageUpload` middleware handles multipart/form-data
- Images processed via `filesServices.processAvatar()` or `processserviceThumb()`
- Returns relative path like `/avatars/123_uuid.jpg`
- Served statically via `/api/static/{avatars,services}`

**n8n Integration** (Critical):

- Users have `n8nUserId` and encrypted `n8nApiKey` (via AES-256-CBC encryption helpers)
- `n8nService` manages user creation, workflow CRUD, and execution
- `AITemplate` stores n8n workflow JSON templates
- `WorkflowAITemplate` represents instantiated workflows with custom `systemPrompt`
- Workflows activated/deactivated via n8n API, webhooks exposed at `/webhook/{path}`

## Developer Workflows

### Setup & Running

```bash
npm install
# Create .env from .env.example with DB credentials, TOKEN_SECRET, N8N_BASE_URL, N8N_ADMIN_KEY, ENCRYPTION_KEY
npm run dev    # Uses nodemon for hot-reload
npm start      # Production mode
```

### Database Management

```bash
node ./db/sync.js   # Syncs schema (creates/alters tables)
node ./db/seed.js   # Seeds initial data (areas, categories, ingredients, testimonials)
node ./db/seed-ai-templates.js  # Seeds AI workflow templates
```

### API Documentation

- Swagger UI available at `/api/docs`
- Schemas in `schemas/` converted to Swagger via `joi-to-swagger`
- All request/response schemas must be exported as `{swagger: ...}` for documentation

## Project-Specific Patterns

### Error Handling

```javascript
// ✅ CORRECT - Throw HttpError in services/controllers
if (!service) throw HttpError(404, "service not found");
if (service.ownerId !== user.id) throw HttpError(403);

// ❌ WRONG - Never manually send error responses
res.status(404).json({ message: "Not found" });
```

### Controller Pattern

```javascript
// All controllers must follow this exact pattern:
const myController = async (req, res) => {
  const result = await myService.doSomething(req.params, req.user);
  res.status(200).json({ data: result });
};

export const myControllers = {
  myController: ctrlWrapper(myController),
};
```

### Validation Middleware Chain

```javascript
// Routes stack middlewares in this order:
router.post(
  "/",
  authenticate, // Auth (optional: identifyUser for public+auth routes)
  validateBody(schema), // Joi schema validation
  imageUpload.single("img"), // File upload (if needed)
  controller.create
);
```

### Sequelize Query Patterns

```javascript
// Include related models with `as` aliases matching associate() definitions
const service = await service.findByPk(id, {
  include: [
    { model: User, as: "owner", attributes: ["id", "name", "avatarURL"] },
    {
      model: Ingredient,
      as: "ingredients",
      through: { as: "serviceIngredient" },
    },
  ],
});

// Conditional includes for authenticated users
if (user) {
  include.push({
    model: UserFavoriteservice,
    as: "userFavoriteservices",
    where: { userId: user.id },
    required: false, // LEFT JOIN
  });
}
```

### Pagination & Filtering

- Use `getOffset(page, limit)` helper for offset calculation
- Default: `page=1, limit=10`
- Return `{ total, <resourcePlural> }` in response
- Filtering via query params: `categoryId`, `areaId`, `ingredientId`, `ownerId`

### N8N Workflow Management

```javascript
// 1. Clone template from AITemplate.aiTemplate (JSON)
// 2. Substitute placeholders (webhookId, systemPrompt)
// 3. Create via n8nService.createWorkflow(apiKey, cleanWorkflowData)
// 4. Store n8nWorkflowId and webhookUrl in WorkflowAITemplate
// 5. Activate via n8nService.activateWorkflow(apiKey, workflowId, true)
```

### Encryption (for n8n API keys)

```javascript
import { encrypt, decrypt } from "../helpers/encryption.js";
// User model automatically encrypts/decrypts n8nApiKey via getters/setters
// ENCRYPTION_KEY must be in .env (32-byte hex string)
```

## Critical Files

- `app.js` - Express app setup, route registration, global error handler
- `settings.js` - Environment validation (throws if required .env vars missing)
- `db/sequelize.js` - Sequelize initialization, model registration, associations
- `swagger.js` - OpenAPI 3.0 spec for all endpoints
- `helpers/HttpError.js` - Standard error factory (use this, not custom Errors)
- `services/n8nService.js` - n8n API client (user management, workflow CRUD)

## Common Gotchas

1. **Always use ES modules** (`import/export`, not `require`) - `"type": "module"` in package.json
2. **Sequelize model associations**: `as` aliases must match exactly in queries and `associate()` definitions
3. **File uploads**: Don't forget `imageUpload.single('fieldName')` middleware before controllers that process files
4. **Authentication**: Use `identifyUser` for routes that work for both authenticated and anonymous users (adds `isFavorite` flags conditionally)
5. **n8n workflows**: Always check `n8nEnabled` flag on users before n8n operations
6. **Transactions**: Use `sequelize.transaction()` for multi-step DB operations (see `servicesServices.deleteserviceById`)
7. **Swagger schemas**: Export both Joi schema and `{ swagger: ... }` from schema files using `j2s(schema)`

## Testing Endpoints

- Health check: `GET /api/ok` → `{ message: "ok" }`
- Swagger docs: `GET /api/docs`
- All routes prefixed with `/api/`

## Related Frontend

React app in `../sello` directory using Redux Toolkit, React Router v7, Formik/Yup. API base URL configured via `VITE_API_BASE_URL`.
