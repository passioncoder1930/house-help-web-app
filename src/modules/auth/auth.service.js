import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { User } from '../users/user.model.js';

function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtAccessExpires });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, env.jwtSecret, {
    expiresIn: env.jwtRefreshExpires,
  });
}

export function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    addresses: user.addresses || [],
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, password, role, phone }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role, phone });

  return {
    user: formatUser(user),
    accessToken: signAccessToken(user._id),
    refreshToken: signRefreshToken(user._id),
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  return {
    user: formatUser(user),
    accessToken: signAccessToken(user._id),
    refreshToken: signRefreshToken(user._id),
  };
}

export async function refreshTokens(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, env.jwtSecret);
    if (payload.type !== 'refresh') {
      const err = new Error('Invalid refresh token');
      err.status = 401;
      throw err;
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      const err = new Error('User not found');
      err.status = 401;
      throw err;
    }

    return {
      user: formatUser(user),
      accessToken: signAccessToken(user._id),
      refreshToken: signRefreshToken(user._id),
    };
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }
}
