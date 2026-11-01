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



app.listen(PORT, ()=>{
    console.log(`Servering is runing successfully at ${PORT}`);
})