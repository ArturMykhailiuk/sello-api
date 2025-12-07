# Налаштування генерації системних промптів

## Огляд

Система автоматично генерує системні промпти для AI асистентів через n8n workflow при виборі типу асистента у модальному вікні.

## Backend налаштування

### 1. Змінні середовища

Додайте у ваш `.env` файл:

```env
N8N_PROMPT_GENERATION_WEBHOOK=https://sell-o.shop/n8n/webhook/generate-prompt
```

Це має бути URL webhook вашого n8n workflow для генерації промптів.

### 2. Створення n8n Workflow

Створіть новий workflow у n8n з такими характеристиками:

**Вхідні дані (POST request):**
```json
{
  "assistantType": "AI Chat",
  "serviceId": 123
}
```

**Вихідні дані (response):**
```json
{
  "systemPrompt": "Згенерований системний промпт..."
}
```

Або просто повертайте текст промпта безпосередньо.

### 3. Структура workflow

1. **Webhook node** - отримує POST запити
2. **AI/LLM node** - генерує промпт на основі типу асистента
3. **Response node** - повертає згенерований промпт

## Frontend

### Флоу користувача:

1. Користувач відкриває модальне вікно "Додати AI Асистента"
2. Вибирає тип асистента з dropdown (наприклад, "AI Chat")
3. **Автоматично** відправляється запит на генерацію промпта
4. Поки генерується - показується loader біля поля типу
5. Після генерації - поле "Системний промпт" автоматично заповнюється
6. Користувач може відредагувати промпт перед збереженням
7. При помилці - показується toast notification, користувач може ввести промпт вручну

### Тестування

Для тестування без реального n8n workflow:

1. Закоментуйте перевірку `N8N_PROMPT_GENERATION_WEBHOOK` у `aiWorkflowsControllers.js`
2. Замініть виклик `n8nService.generateSystemPrompt()` на mock:

```javascript
const systemPrompt = `You are a helpful ${assistantType} assistant for service #${serviceId}. Help users with their inquiries professionally and courteously.`;
```

## API Endpoint

**POST** `/api/ai-workflows/generate-prompt`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "assistantType": "AI Chat",
  "serviceId": 123
}
```

**Response (200):**
```json
{
  "systemPrompt": "You are a helpful AI Chat assistant..."
}
```

**Response (404):**
```json
{
  "message": "Service not found"
}
```

**Response (500):**
```json
{
  "message": "Prompt generation workflow is not configured. Please set N8N_PROMPT_GENERATION_WEBHOOK environment variable."
}
```

## Налаштування різних промптів для різних типів асистентів

У вашому n8n workflow ви можете використовувати `assistantType` для генерації різних промптів:

```javascript
// Приклад логіки у n8n (Function node)
const { assistantType, serviceId } = $input.item.json;

let systemPrompt = "";

switch(assistantType) {
  case "AI Chat":
    systemPrompt = `You are a customer support chatbot for service ${serviceId}...`;
    break;
  case "Sales Assistant":
    systemPrompt = `You are a sales assistant for service ${serviceId}...`;
    break;
  case "Technical Support":
    systemPrompt = `You are a technical support assistant for service ${serviceId}...`;
    break;
  default:
    systemPrompt = `You are a helpful assistant for service ${serviceId}...`;
}

return { systemPrompt };
```

## Troubleshooting

### Помилка "Prompt generation workflow is not configured"
- Перевірте наявність `N8N_PROMPT_GENERATION_WEBHOOK` у `.env`
- Переконайтесь, що webhook URL правильний

### Timeout під час генерації
- У `n8nService.js` налаштований timeout 60 секунд
- Якщо потрібно більше - збільште `timeout` у axios конфігурації

### Генерація не спрацьовує
- Перевірте browser console для помилок
- Перевірте network tab - чи відправляється запит
- Перевірте backend logs - чи отримується запит
- Перевірте n8n logs - чи виконується workflow

## Розширення

Для додавання додаткових параметрів у генерацію:

1. Додайте поля у `generatePromptSchema` (backend)
2. Передайте їх у `generateSystemPrompt` action (frontend)
3. Оновіть n8n workflow для обробки нових параметрів
