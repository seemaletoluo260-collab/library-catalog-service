require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');
const Genre = require('./models/Genre');

const genreData = [
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Historical Fiction', slug: 'historical-fiction' },
  { name: 'Contemporary Fiction', slug: 'contemporary-fiction' },
];

const bookData = [
  ['The Cartographer of Europa', 'Mira Solis', 'A survey pilot finds a message beneath the ice of a distant moon.', 0, 6, 4],
  ['Borrowed Suns', 'Elias Venn', 'Two generations of engineers race to keep a failing orbital habitat alive.', 0, 4, 4],
  ['The Last Signal Garden', 'N. K. Vale', 'A botanist deciphers transmissions carried through an experimental forest.', 0, 5, 2],
  ['Quiet Machines', 'Rohan Ives', 'A repair technician discovers that an abandoned city is still listening.', 0, 3, 1],
  ['The Lantern Room', 'Clara Wren', 'A coastal archivist investigates a lighthouse keeper who vanished in 1978.', 1, 5, 3],
  ['A Study in Ash', 'Jonah Mercer', 'A forensic accountant follows a trail of missing paintings through a small town.', 1, 4, 2],
  ['The Orchard Alibi', 'Leonie Hart', 'A family reunion turns into a puzzle after the estate caretaker disappears.', 1, 7, 6],
  ['Midnight at Bellweather', 'S. R. Finch', 'A night train passenger reconstructs a crime from contradictory testimony.', 1, 3, 0],
  ['The Glasswood Atlas', 'Tamsin Reed', 'An apprentice mapmaker enters a forest that rearranges itself at dawn.', 2, 6, 5],
  ['A Crown of Small Storms', 'Darian Holt', 'A reluctant heir must broker peace between weather-bound kingdoms.', 2, 5, 3],
  ['The Foxfire Archive', 'Amaya North', 'A village librarian protects a collection of books that remember their readers.', 2, 4, 2],
  ['River of Brass', 'Theo March', 'A young blacksmith follows a river that flows uphill into an ancient city.', 2, 8, 7],
  ['The Winter Correspondence', 'Edith Rowan', 'Letters found in a station wall connect two lives across a century.', 3, 5, 4],
  ['Map of the Unreturned', 'Caleb Wynn', 'A translator retraces her grandmother’s journey through postwar Europe.', 3, 4, 1],
  ['The Indigo Season', 'Mara Bell', 'A family textile workshop navigates change in a 1920s port city.', 3, 6, 6],
  ['Letters from Alder Street', 'June Avery', 'Neighbors build an unlikely community during a difficult summer.', 4, 5, 2],
  ['The Shape of Sunday', 'Owen Park', 'Three siblings return home to settle an estate and an old disagreement.', 4, 3, 3],
  ['Small Hours, Open Windows', 'Priya Nair', 'A night-shift baker begins a new friendship with a regular customer.', 4, 4, 2],
  ['All the Rooms We Keep', 'Nadia Brooks', 'A couple renovates a house and uncovers the stories of its former residents.', 4, 7, 5],
  ['The Long Way to June', 'Rafael Costa', 'A road trip gives two friends time to reconsider their next chapter.', 4, 2, 1],
];

function makeIsbn13(serial) {
  const body = `9781${String(serial).padStart(8, '0')}`;
  const checksum = [...body].reduce(
    (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return `${body}${(10 - (checksum % 10)) % 10}`;
}

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing. Set it in your .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([Book.deleteMany({}), Genre.deleteMany({})]);

    const genres = await Genre.insertMany(genreData);
    const books = bookData.map(([title, author, description, genreIndex, totalCopies, availableCopies], index) => {
      const isbn = makeIsbn13(index + 1);
      return {
        title,
        author,
        isbn,
        description,
        coverImage: `https://placehold.co/400x600?text=${encodeURIComponent(title)}`,
        totalCopies,
        availableCopies,
        genre: genres[genreIndex]._id,
      };
    });

    await Book.insertMany(books);
    console.log(`Seeded ${genres.length} genres and ${books.length} books.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
});
