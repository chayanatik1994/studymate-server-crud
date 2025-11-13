// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

 const app = express();
 const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection string
const uri = process.env.MONGODB_URI || "mongodb+srv://<username>:<password>@cluster0.mongodb.net/studymate_db?retryWrites=true&w=majority";

// Create MongoClient
const client = new MongoClient(uri, {
    serverApi: {
    version: ServerApiVersion.v1,
      strict: true,
    deprecationErrors: true,
  },
  tls: true,
    tlsAllowInvalidCertificates: false,
    connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
});

// Collections globally
let partnersCollection, requestsCollection;

//  get collections
function getCollections() {
  if (!partnersCollection ) {
    throw new Error("Database not connected");
  }
  return { partnersCollection, requestsCollection };
}

// Test route
app.get('/', (req, res) => res.send('Study Partner CRUD API is running'));

// Create Profile
app.post('/partners', async (req, res) => {
  try {
    const { partnersCollection } = getCollections();
    const newPartner = req.body;
      const result = await partnersCollection.insertOne(newPartner);
    res.status(201).send({ message: "Partner profile created", result });
  } catch (error) {
      res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

// Read all Partners
app.get('/partners', async (req, res) => {
  try {
      const { partnersCollection } = getCollections();
    const { search, sort } = req.query;
      let query = {};
    if (search) query.subject = { $regex: search, $options: "i" };

      let cursor = partnersCollection.find(query);

    if (sort) {
      const sortField = sort === 'experience' ? { experienceLevel: 1 } : {};
      cursor = cursor.sort(sortField);
    }

    const partners = await cursor.toArray();
    res.send(partners);
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

//Read One
app.get('/partners/:id', async (req, res) => {
  try {
    const { partnersCollection } = getCollections();
      const id = req.params.id;
    if (!id || id === 'undefined') {
       return res.status(400).send({ message: "Invalid partner ID" });
    }
    const partner = await partnersCollection.findOne({ _id: new ObjectId(id) });
    if (!partner) {
        return res.status(404).send({ message: "Partner not found" });
    }
      res.send(partner);
  } catch (error) {
    res.status(500).send({ message: "Error fetching partner", error: error.message });
  }
});

// update partner
app.put('/partners/:id', async (req, res) => {
  try {
    const { partnersCollection } = getCollections();
    const id = req.params.id;
    const updatedData = req.body;
    const result = await partnersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    res.send({ message: "Partner updated", result });
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

// Delete Partners
app.delete('/partners/:id', async (req, res) => {
  try {
    const { partnersCollection } = getCollections();
    const id = req.params.id;
    const result = await partnersCollection.deleteOne({ _id: new ObjectId(id) });
    res.send({ message: "Partner deleted", result });
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

// Increment 
app.post('/partners/:id/request', async (req, res) => {
  try {
    const { partnersCollection, requestsCollection } = getCollections();
    const id = req.params.id;
    const userEmail = req.body.userEmail; 

    // Increment partnerCount
    await partnersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { partnerCount: 1 } }
    );
   //Partner
    const partnerData = await partnersCollection.findOne({ _id: new ObjectId(id) });
    await requestsCollection.insertOne({ partnerId: id, partnerData, userEmail });

    res.send({ message: "Partner request sent successfully" });
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

// my partners profile
app.get('/my-partners/:email', async (req, res) => {
  try {
    const { partnersCollection } = getCollections();
    const email = req.params.email;
    const partners = await partnersCollection.find({ email: email }).toArray();
    res.send(partners);
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

// my connections
app.get('/my-connections/:email', async (req, res) => {
  try {
    const { requestsCollection } = getCollections();
    const email = req.params.email;
    const connections = await requestsCollection.find({ userEmail: email }).toArray();
    res.send(connections);
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

// Delete connections
app.delete('/my-connections/:requestId', async (req, res) => {
  try {
    const { requestsCollection } = getCollections();
    const requestId = req.params.requestId;
    const result = await requestsCollection.deleteOne({ _id: new ObjectId(requestId) });
    res.send({ message: "Connection deleted", result });
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

//Update
app.put('/my-connections/:requestId', async (req, res) => {
  try {
    const { requestsCollection } = getCollections();
    const requestId = req.params.requestId;
    const updatedData = req.body;
    // Update partnerData nested object
    const updateFields = {};
     Object.keys(updatedData).forEach(key => {
      updateFields[`partnerData.${key}`] = updatedData[key];
    });
      const result = await requestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateFields }
    );
      res.send({ message: "Connection updated", result });
  } catch (error) {
    res.status(500).send({ message: "Database not connected", error: error.message });
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    
    const db = client.db('studymate_db');
      partnersCollection = db.collection('partners');
    requestsCollection = db.collection('partnerRequests');
      console.log("Collections initialized");

  } catch (err) {
    console.error("MongoDB connection error:", err.message);
     console.error("Please check:");
     console.error("1. Your MongoDB Atlas connection string in .env file");
    console.error("2. Your IP address is whitelisted in MongoDB Atlas");
      console.error("3. Your MongoDB username and password are correct");
    console.error("4. Your network connection is Stable");
  }
}

run().catch(console.error);

app.listen(port, () => console.log(`Server running on port ${port}`));
