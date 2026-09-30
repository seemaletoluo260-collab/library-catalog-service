# Book Catalog

A small MongoDB/Mongoose data layer for a library catalog. It defines `Genre` and `Book` models and provides a repeatable seed script.

## Setup

1. Install Node.js 18 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and replace the placeholder URI with your MongoDB connection string. Do not commit `.env` or share its credentials.
4. Run `npm run seed` to replace the existing book and genre documents with the sample catalog.

The seed script inserts five genres and twenty books. Each book has a valid ISBN-13, an image URL, sensible copy counts, and a reference to one of the inserted genres. It prints a summary and disconnects from MongoDB after success or failure.

## Schema Design

### Genre

| Field | Storage | Reason and trade-off |
| --- | --- | --- |
| `name` | Plain string in the Genre document | The display label belongs to the genre entity and is stored once, so edits remain consistent. A unique index prevents duplicate labels; querying a genre with its books requires a separate lookup. |
| `slug` | Plain string in the Genre document | A URL-safe key is small and useful for routes and links. Keeping it alongside the name avoids recomputing it for each request; uniqueness protects stable URLs. |

### Book

| Field | Storage | Reason and trade-off |
| --- | --- | --- |
| `title` | Embedded string | A title is intrinsic to one book record, so it is simplest to read and update with the book. It is not duplicated into a separate collection. |
| `author` | Embedded string | This catalog treats author as display text, which keeps common book reads fast and simple. A separate Author collection would reduce duplication and support author metadata, but would add joins and is unnecessary for this assignment. |
| `isbn` | Embedded string | ISBN identifies the edition represented by this record and is indexed as unique. Storing it directly avoids a lookup for a basic book query. |
| `description` | Embedded string | Descriptive copy is generally read with the book and does not need independent lifecycle management. Embedding avoids an extra read, at the cost of carrying the text in list results unless projections are used. |
| `coverImage` | Embedded URL string | The URL is a small piece of book-specific display metadata. It is convenient to return with the book; a separate media collection would add complexity without meaningful reuse here. |
| `totalCopies`, `availableCopies` | Embedded numbers | Inventory values are specific to the catalog's book record and are commonly read together. Updating both in one document is straightforward; a production checkout system may instead model individual copies or use atomic update rules to prevent concurrent over-checkouts. |
| `genre` | Reference to `Genre` via ObjectId | Many books can share one genre, and genre names/slugs should have one authoritative copy. Referencing avoids repeating those values and lets a genre change apply consistently, with the trade-off of a populate/join when genre details are needed. |

## Collections and screenshots

Mongoose creates the `books` and `genres` collections from the model names. After running the seed command against your Atlas database, open each collection in Atlas and capture a screenshot showing the document list and count. Save the screenshots in this repository (for example, `screenshots/books.png` and `screenshots/genres.png`) before submission. Screenshots must come from the populated Atlas database; this project does not include fabricated database images.
