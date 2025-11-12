const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();

const port = process.env.PORT || 3000;
//Middle Ware
app.use(cors());
app.use(express.json());

//hLqot5hrEZeurGfb
//simpleDBUser
const uri = "mongodb+srv://simpleDBUser:hLqot5hrEZeurGfb@cluster0.sc712cw.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Simple CRUD is running');
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}

run().catch(console.error); 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
