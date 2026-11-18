const { promisify } = require('node:util');
const { randomBytes, scrypt } = require('node:crypto');
const mongoose = require('mongoose');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['patron', 'librarian'],
      default: 'patron',
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
});

userSchema.set('toJSON', {
  transform(_document, returned) {
    delete returned.password;
    return returned;
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
