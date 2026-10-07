# Library Catalog API

Express 5 and TypeScript API for managing books and genres. Set `Database_URL` in `.env` to a MongoDB connection string before starting the server.

## Setup

```sh
npm install
npm run dev
```

The API is served under `/api/v1`. Book payloads require `title`, `author`, `isbn`, and an existing `genre` ObjectId. Genre payloads require `name`; `description` is optional. Invalid values return HTTP 400 JSON with a `message` and field-keyed `errors` object. Missing records return 404. Create returns 201, reads and updates return 200, and successful deletes return 204.

## Endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/v1/genres` | List genres |
| GET | `/api/v1/genres/:id` | Get one genre |
| POST | `/api/v1/genres` | Create a genre |
| PUT | `/api/v1/genres/:id` | Replace a genre's editable fields |
| DELETE | `/api/v1/genres/:id` | Delete a genre if no books reference it |
| GET | `/api/v1/books` | List, filter, search, and paginate books |
| GET | `/api/v1/books/:id` | Get one book |
| POST | `/api/v1/books` | Create a book |
| PUT | `/api/v1/books/:id` | Replace a book's editable fields |
| DELETE | `/api/v1/books/:id` | Delete a book |

`GET /api/v1/books` accepts combinable `genre`, `search`, `page`, and `limit` query parameters. Search is case-insensitive across title and author. Pagination defaults to page 1 and 10 records per page; limit is capped at 100. The response is `{ "data": [], "total": 0, "page": 1, "limit": 10, "totalPages": 0 }`.

Example: `GET /api/v1/books?genre=64a1b2c3d4e5f67890123456&search=dune&page=2&limit=5`

Deleting a genre referenced by a book returns 409 with a field-specific message. Delete or reassign those books first; the API does not cascade-delete books.

An importable Postman collection covering these endpoints and a saved validation-error example is at [`postman/library-catalog.postman_collection.json`](postman/library-catalog.postman_collection.json).

## Checks

```sh
npm run typecheck
npm test
npm run build
```
