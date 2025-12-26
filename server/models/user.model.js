const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const ROLE = Object.freeze({
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
});

const UserSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /.+@.+\..+/, // basic sanity check
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLE),
      required: true,
      default: ROLE.VIEWER,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

/**
 * Hash password if it was modified.
 */
UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

/**
 * Compare plaintext password with stored hash.
 * @param {string} candidate - Plaintext password.
 * @returns {Promise<boolean>} Whether the password matches.
 */
UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.statics.ROLES = ROLE;

module.exports = mongoose.model('User', UserSchema);
