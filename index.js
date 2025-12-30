 const express = require("express");
 const cors = require("cors");
 require("dotenv").config();
 
 const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

 const app = express();
 const port = process.env.PORT || 5000;

 app.use(cors());
 app.use(express.json());

 //DB User: polling_station_db_user
 //DB Pass: VWBWydTDxADFrwFc
 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_SECRET}@cluster0.ikm2v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

       //      "mongodb+srv://polling_station_db_user:VWBWydTDxADFrwFc@cluster0.ikm2v.mongodb.net/?appName=Cluster0";

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
    const unionCollection = client.db("pollingStation").collection("unions");
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

      // Upazila Route

       app.post("/upazilas", async (req, res) => {
        const upazilas = req.body;
         console.log("Upazila Info: ", upazilas);
        const result = await upazilaCollection.insertOne(upazilas);
        console.log("Upazila Info: ", result);
        res.send(result);
      });

      app.get("/upazilas", async (req, res) => {
        const query = upazilaCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/upazila/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await upazilaCollection.deleteOne(query);
        res.send(result);
      });

    app.get("/loadUpazila/:id", async (req, res) => {
        const id = req.params.id;
        // console.log("UPAZILA DATA FUNCTION CALL");
        const query = { districtID: id };
        const result = await upazilaCollection.find(query).toArray();;
        res.send(result);
      });

      app.get("/loadUnion/:id", async (req, res) => {
        const id = req.params.id;
        //  console.log("UNION DATA FUNCTION CALL");
        const query = { upazilaID: id };
        const result = await unionCollection.find(query).toArray();;
        res.send(result);
      });

      app.get("/upazila/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await upazilaCollection.findOne(query);
        res.send(result);
      });

       app.put("/upazila/:id", async (req, res) => {
        const uId = req.params.id;
        console.log("Update Data Found",uId);
        const upazila = req.body;
        const filter = { _id: new ObjectId(uId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            upazilaName: upazila.districtName,
            districtName: upazila.districtName,
          },
        };

        const result = await upazilaCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

      // Union Route

       app.post("/unions", async (req, res) => {
        const unionData = req.body;
         console.log("Union Info: ", unionData);
        const result = await unionCollection.insertOne(unionData);
        console.log("Union Info: ", result);
        res.send(result);
      });

      app.get("/unions", async (req, res) => {
        const query = unionCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/union/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await unionCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/union/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await unionCollection.findOne(query);
        res.send(result);
      });

       app.put("/union/:id", async (req, res) => {
        const uId = req.params.id;
        console.log("Update Data Found",uId);
        const union = req.body;
        const filter = { _id: new ObjectId(uId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            upazilaName: union.upazilaName,
            unionName: union.unionName,
          },
        };

        const result = await unionCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

       // Polling Station Route

       app.post("/pollingStations", async (req, res) => {
        const pollingStationData = req.body;
        console.log("Polling Station Info: ", pollingStationData);
        const result = await pollingStationCollection.insertOne(pollingStationData);
        console.log("Polling Station: ", result);
        res.send(result);
      });

      app.get("/pollingStations", async (req, res) => {
        const query = pollingStationCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/pollingStation/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await pollingStationCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/pollingStation/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await pollingStationCollection.findOne(query);
        res.send(result);
      });

       app.get("/pollingStations/pollingStation/:id", async (req, res) => {
        const id = req.params.id;
        // if(id === '69499f421d1713986d14156a'){
           const Query = { districtID: id };
           const Result = await pollingStationCollection.find(Query).toArray();
           res.send(Result);
        // }
        // else{
        //    const upaQuery = { upazilaID: id };
        //    const upaResult = await pollingStationCollection.find(upaQuery).toArray();
        //    res.send(upaResult);
        // } 
        // console.log("QUERY DATA: ", query);
        // const result = await pollingStationCollection.find(query).toArray();
        // console.log("RESULT DATA: ", result);
        // res.send(result);
      });

      // filter by selected Upazila
      app.get("/pollingStations/pollingStation/upazila/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await pollingStationCollection.find(Query).toArray();
           res.send(Result);
      });

      // filter by selected union
      app.get("/pollingStations/pollingStation/union/:id", async (req, res) => {
        const id = req.params.id;
           const Query = { unionID: id };
           const Result = await pollingStationCollection.find(Query).toArray();
           res.send(Result);
      });


       app.put("/pollingStation/:id", async (req, res) => {
        const psId = req.params.id;
        console.log("Update Data Found",psId);
        const pollingStation = req.body;
        const filter = { _id: new ObjectId(psId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
         //   upazilaName: pollingStation.upazilaName,
          //  unionName: pollingStation.unionName,
          },
        };

        const result = await pollingStationCollection.updateOne(
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