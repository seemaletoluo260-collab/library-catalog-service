const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    coverImage: {
      type: String,
      required: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isInteger,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      validate: [
        Number.isInteger,
        'Available copies must be a whole number',
      ],
    },
    genre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Genre',
      required: true,
    },
  },
  { timestamps: true },
);

bookSchema.path('availableCopies').validate(function (value) {
  return value <= this.totalCopies;
}, 'Available copies cannot exceed total copies');

module.exports = mongoose.model('Book', bookSchema);
