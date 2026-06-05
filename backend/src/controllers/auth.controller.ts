import { User } from '../models/User';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { signAuthToken } from '../utils/jwt';
import { sendResponse } from '../utils/sendResponse';

const createAuthPayload = (user: InstanceType<typeof User>) => {
  const authUser = {
    id: user.id,
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    teamLeadId: user.teamLeadId
  };

  return {
    token: signAuthToken(authUser),
    user: user.toJSON()
  };
};

export const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    throw new HttpError(409, 'Email is already registered.');
  }

  const user = await User.create(payload);
  sendResponse(res, 201, createAuthPayload(user), 'Registration successful.');
});

export const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await User.findOne({ email: payload.email }).select('+password');

  if (!user || !(await user.comparePassword(payload.password))) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  sendResponse(res, 200, createAuthPayload(user), 'Login successful.');
});

export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication is required.');
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  sendResponse(res, 200, user);
});

