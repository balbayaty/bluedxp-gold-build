// Server-side only - Express/RabbitMQ event bus (optional)
// Start this explicitly in a standalone Node process if you want external pub/sub.
// In-app (Next.js), use `@/lib/services/event-bus` which re-exports the in-process event bus.

let express: any = null;
let cors: any = null;

try {
  express = require("express");
  cors = require("cors");
} catch (e) {
  // Express not available - this is a server-only service
  console.warn(
    "Express not available - event-bus server requires Node + express",
  );
}

// Optional dependencies
let amqp: any = null;
let dotenv: any = null;
let winston: any = null;

try {
  amqp = require("amqplib");
} catch (e) {
  // amqplib not installed
}

try {
  dotenv = require("dotenv");
  dotenv.config();
} catch (e) {
  // dotenv not installed
}

try {
  winston = require("winston");
} catch (e) {
  // winston not installed
}

const logger = winston
  ? winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: "event-bus" },
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({ filename: "logs/combined.log" }),
      ],
    })
  : {
      info: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
    };

const EXCHANGE_NAME = "chemcollab_events";

export async function startEventBusServer(options?: { port?: number }) {
  if (!express) {
    throw new Error("Cannot start event-bus server: express is not available");
  }

  const app = express();
  app.use(cors ? cors() : (_req: any, _res: any, next: any) => next());
  app.use(express.json());

  const PORT = options?.port ?? Number(process.env.PORT || 3010);

  // RabbitMQ connection (optional)
  let channel: any = null;

  async function connectRabbitMQ() {
    if (!amqp) return;
    try {
      const connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://localhost",
      );
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE_NAME, "fanout", { durable: true });
      logger.info("Connected to RabbitMQ");

      connection.on("close", () => {
        logger.error("RabbitMQ connection closed, attempting to reconnect...");
        setTimeout(connectRabbitMQ, 5000);
      });
    } catch (error) {
      logger.error("Failed to connect to RabbitMQ:", error);
      setTimeout(connectRabbitMQ, 5000);
    }
  }

  app.post("/events", async (req: any, res: any) => {
    try {
      const event = req.body;
      if (!event?.type || !event?.data) {
        return res
          .status(400)
          .json({ error: "Event must include type and data fields" });
      }

      if (!channel) {
        return res
          .status(503)
          .json({ error: "RabbitMQ channel not established" });
      }

      channel.publish(EXCHANGE_NAME, "", Buffer.from(JSON.stringify(event)), {
        persistent: true,
      });
      logger.info(`Event published: ${event.type}`);
      return res
        .status(201)
        .json({ success: true, message: "Event published" });
    } catch (error) {
      logger.error("Error publishing event:", error);
      return res.status(500).json({ error: "Failed to publish event" });
    }
  });

  app.get("/health", (_req: any, res: any) =>
    res.status(200).json({ status: "ok" }),
  );

  return new Promise<void>((resolve) => {
    app.listen(PORT, async () => {
      logger.info(`Event bus server running on port ${PORT}`);
      await connectRabbitMQ();
      resolve();
    });
  });
}
