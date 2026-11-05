import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());


// ---------- MongoDB (serverless-safe) ----------
const uri = process.env.MONGO_CLIENT_URI;

let cached = globalThis._mongo;
if (!cached) cached = globalThis._mongo = { client: null, promise: null };

async function getDb() {
  if (!cached.promise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cached.promise = client.connect().then((c) => {
      cached.client = c;
      return c;
    }).catch((err) => {
      cached.promise = null; // allow retry on next request
      throw err;
    });
  }
  const client = await cached.promise;
  return client.db("socialEvenets");
}

// Attach collections to each request
app.use(async (req, res, next) => {
  try {
    const db = await getDb();
    req.events = db.collection("events");
    req.joinedUsers = db.collection("joinedUsers");
    next();
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(503).send({ msg: "Database unavailable" });
  }
});

// ---------- Auth ----------
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send({ msg: "Unauthorized" });

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).send({ msg: "Invalid token" });
  }
};

// Small helper so you don't repeat try/catch everywhere
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(500).send({ msg: "Server Error" });
  });

// ---------- Routes ----------
app.post("/create-event", verifyToken, wrap(async (req, res) => {
  res.send(await req.events.insertOne(req.body));
}));

app.get("/manage-event/:email", verifyToken, wrap(async (req, res) => {
  res.send(await req.events.find({ userEmail: req.params.email }).toArray());
}));

app.patch("/manage-event/:id", verifyToken, wrap(async (req, res) => {
  res.send(await req.events.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  ));
}));

app.delete("/manage-delete/:id", verifyToken, wrap(async (req, res) => {
  const id = req.params.id;
  const result = await req.events.deleteOne({ _id: new ObjectId(id) });
  await req.joinedUsers.deleteMany({ eventID: id }); // deleteMany: all joiners
  res.send(result);
}));

app.post("/joined-users", verifyToken, wrap(async (req, res) => {
  res.send(await req.joinedUsers.insertOne(req.body));
}));

app.get("/joined-events/:id", verifyToken, wrap(async (req, res) => {
  res.send(await req.joinedUsers.find({ eventID: req.params.id }).toArray());
}));

app.get("/joined-users/:email", verifyToken, wrap(async (req, res) => {
  res.send(await req.joinedUsers.find({ userEmail: req.params.email }).toArray());
}));

app.delete("/joined-users/:id", verifyToken, wrap(async (req, res) => {
  res.send(await req.joinedUsers.deleteOne({ _id: new ObjectId(req.params.id) }));
}));

app.get("/up-comming/:id", wrap(async (req, res) => {
  res.send(await req.events.findOne({ _id: new ObjectId(req.params.id) }));
}));

app.get("/all", wrap(async (req, res) => {
  res.send(await req.events.find({}).toArray());
}));

app.get("/", (req, res) => res.send({ msg: "Successfully running" }));

// Only listen locally; Vercel handles this itself
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

export default app;