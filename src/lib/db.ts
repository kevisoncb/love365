import mongoose from "mongoose";

import type { PageDocument } from "@/types/page";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalCache = globalThis as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

function getCache() {
  if (!globalCache.mongooseCache) {
    globalCache.mongooseCache = {
      conn: null,
      promise: null,
    };
  }
  return globalCache.mongooseCache;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("Defina a variável MONGODB_URI");
  }

  const cached = getCache();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

/** Modelo sem generics no Schema — reduz inferência pesada do tsc */
function getModel(name: string, schema: mongoose.Schema) {
  return (
    mongoose.models[name] ??
    mongoose.model(name, schema)
  );
}

const PageSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    plan: { type: String, required: true },
    names: { type: String, required: true },
    date: { type: String, required: true },
    youtubeUrl: { type: String },
    message: { type: String },
    photoUrls: [{ type: String }],
    contact: { type: String },
    status: { type: String, default: "PENDING" },
    abacateBillingId: { type: String },
    paidAt: { type: Date },
    emailSentAt: { type: Date },
    lastPaymentSyncAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "pages" }
);

export const Page = getModel("Page", PageSchema);

const ProcessedWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    token: { type: String },
    processedAt: { type: Date, default: Date.now },
  },
  { collection: "processed_webhook_events" }
);

export type ProcessedWebhookEventDoc = {
  eventId: string;
  token?: string;
  processedAt?: Date;
};

export const ProcessedWebhookEvent = getModel(
  "ProcessedWebhookEvent",
  ProcessedWebhookEventSchema
);

const RateLimitBucketSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    windowStart: { type: Date, default: Date.now },
  },
  { collection: "rate_limit_buckets" }
);

RateLimitBucketSchema.index(
  { windowStart: 1 },
  { expireAfterSeconds: 86400 }
);

export type RateLimitBucketDoc = {
  key: string;
  count: number;
  windowStart: Date;
};

export const RateLimitBucket = getModel(
  "RateLimitBucket",
  RateLimitBucketSchema
);

export type OpsErrorLogDoc = {
  scope: string;
  route?: string;
  token?: string;
  name?: string;
  message: string;
  stack?: string;
  meta?: Record<string, unknown>;
  createdAt?: Date;
};

const OpsErrorLogSchema = new mongoose.Schema(
  {
    scope: { type: String, required: true, index: true },
    route: { type: String },
    token: { type: String },
    name: { type: String },
    message: { type: String, required: true },
    stack: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "ops_error_logs" }
);

OpsErrorLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
);

export const OpsErrorLog = getModel(
  "OpsErrorLog",
  OpsErrorLogSchema
);

export type { PageDocument };
