import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from 'mongodb';



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

app.get('/manage-event/:email',async(req,res)=>{
  const email = req.params.email;
  const result = await collection.find({userEmail: email}).toArray();
  res.send(result);
});

app.patch('/manage-event/:id', async(req,res)=>{
  const updateData = req.body;
  const id = req.params.id;
  const result = await collection.updateOne({_id: new ObjectId(id)}, {$set:updateData});
  res.send(result);
});

app.delete('/manage-delete/:id', async(req,res)=>{
  const id = req.params.id;
  const result = await collection.deleteOne({_id: new ObjectId(id)});
  console.log(id);
  res.send(result);
})

app.get('/up-comming/:id', async(req,res)=>{
  const id = req.params.id;
  const result = await collection.findOne({_id: new ObjectId(id)});
  res.send(result);
});

app.get('/all', async(req,res)=>{
  const result = await collection.find({}).toArray();
  res.send(result);
});

app.get('/', (req,res)=>{
  res.send({msg: "Successfully running"});
})



app.listen(PORT, ()=>{
    console.log(`Servering is runing successfully at ${PORT}`);
});

export default app;