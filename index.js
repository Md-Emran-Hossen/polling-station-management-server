 const express = require("express");
 const cors = require("cors");
 const { MongoClient, ServerApiVersion } = require('mongodb');

 const app = express();

 const port = process.env.PORT || 5000;

 app.use(cors());
 app.use(express.json());

 //DB User: polling_station_db_user
 //DB Pass: vT1b7agAK2ZylwM3
 
const uri = "mongodb+srv://polling_station_db_user:VWBWydTDxADFrwFc@cluster0.ikm2v.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const districtCollection = client.db("pollingStation").collection("districts");
    const upazilaCollection = client.db("pollingStation").collection("upazilas");
    const pollingStationCollection = client.db("pollingStation").collection("pollingStations");
    
      // district route
      app.post("/districts", async (req, res) => {
        const districts = req.body;
         console.log("District Info: ", districts);
        const result = await districtCollection.insertOne(districts);
     //   console.log("District Info: ", result);
        res.send(result);
      });

      app.get("/districts", async (req, res) => {
        const query = districtCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/district/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await districtCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/district/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await districtCollection.findOne(query);
        res.send(result);
      });

       app.put("/district/:id", async (req, res) => {
        const dId = req.params.id;
        console.log("Update Data Found",dId);
        const district = req.body;
        const filter = { _id: new ObjectId(dId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            districtName: district.districtName,
            description: district.description,
          },
        };

        const result = await districtCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  //  await client.close();
  }
}
run().catch((error)=>{
    console.log(error);
});


 app.get('/',(req, res)=>{
    res.send("Polling Station Management Server is Running!");
 });

 app.listen(port, ()=>{
    console.log(`Polling Station Management Server is Running on ${port}`);
 })