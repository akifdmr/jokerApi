import { Schema, model, Types } from 'mongoose'
import { UserRole } from './enums.js'

const UserSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    },

    parentUser: {
      type: Types.ObjectId,
      ref: 'User',
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    },

    auth: {
      lastLoginAt: Date,
      tokenVersion: {
        type: Number,
        default: 1
      }
    }
  },
  {
    timestamps: true
  }
)

export const UserModel = model('User', UserSchema)
