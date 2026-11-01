import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient } from 'mongodb';



const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_CLIENT_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("socialEvenets");
const collection = db.collection("events");

app.post('/create-event', async(req,res)=>{
  const createEventData = req.body;
  const result = await collection.insertOne(createEventData);
  res.send(result);
});



app.listen(PORT, ()=>{
    console.log(`Servering is runing successfully at ${PORT}`);
});

export default app;