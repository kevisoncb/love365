import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Defina a variável MONGODB_URI");
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

const PageSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  plan: { type: String, required: true },
  names: { type: String, required: true },
  date: { type: String, required: true },
  youtubeUrl: { type: String },
  message: { type: String },
  photoUrls: [{ type: String }],
  contact: { type: String },
  status: { type: String, default: "PENDING" },
  createdAt: { type: Date, default: Date.now },
});

export const Page =
  mongoose.models.Page || mongoose.model("Page", PageSchema);