/** Handlers Node-only — importado dinamicamente por instrumentation.ts */
export async function registerNodeInstrumentation(): Promise<void> {
  const { createLogger } = await import("@/lib/logger");
  const { captureServerErrorAsync } = await import(
    "@/lib/error-tracking"
  );
  const log = createLogger("ERROR");

  process.on("unhandledRejection", (reason) => {
    log.error("unhandledRejection", { error: reason });
    captureServerErrorAsync(reason, {
      scope: "ERROR",
      route: "unhandledRejection",
    });
  });

  process.on("uncaughtException", (err) => {
    log.error("uncaughtException", { error: err });
    captureServerErrorAsync(err, {
      scope: "ERROR",
      route: "uncaughtException",
    });
  });
}
