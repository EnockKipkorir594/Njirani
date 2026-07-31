# Todo API 

A simple that creates, fetches, updates and deletes todos using routes and http methods. 
GET, POST, PUT , DELETE.Implements zod validation, filtering and sorting , pagination.

## Prerequisites 

- **Node.js v18 +**
- **postgres running locally**

## Setup 

```bash 
npm install 
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/todo_api" > .env 
npx tsx src/migrations/run.ts 
npx tsx src/index.ts

```

## Endpoints 

|Method  | Endpoint | Descripion | 
| -- | -- | -- |
| GET | /health | Check server status |
| GET | /todos | List todos (filter, sort, paginate) |
| GET | /todos/:id | Get one todo |
| POST | /todos | Create a todo |
| PUT | /todos/:id | Update a todo | 
| DELETE | /todos/:id | Delete a todo |


## Query Parameters (GET /todos) 

| Param | Options | Default | 
| -- | -- | -- | 
| Status | pending , in-progress, done | _ |
| Sort | created_at, updated_at, title | created_at |
| Order | asc, desc | desc |
| Page | number | 1 |
| Limit | number (max 100) | 10 |

## Usage Examples 

- **Create a todo**
```bash 

curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk and eggs"}'

```

- **List with Pagination** 

```bash 
curl "http://localhost:3000/todos?page=1&limit=5&status=pending"

```

- **Update todo**

```bash

curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

```

- **Delete todo**

```bash 
curl -X DELETE http://localhost:3000/todos/1

```

## Errors 

- **400 - Validation failed (Zod error details in response)**
- **404 - Todo or route not found**
- **500 - Internal server error**