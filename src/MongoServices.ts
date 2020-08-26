import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  name: String,
  channel: String,
  questions: [String],
  logins: [Date],
});

export const TextbookSchema = new mongoose.Schema({
  raw: String,
});

export const SyllabusSchema = new mongoose.Schema({
  raw: String,
  url: String,
});

export const WorkspaceSchema = new mongoose.Schema({
  team: String,
  textbook: String,
  syllabus: SyllabusSchema,
  users: [String],
});

export const ErrorSchema = new mongoose.Schema({
  error: String,
  time: Date,
});
