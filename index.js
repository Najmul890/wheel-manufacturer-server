const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pukwa.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
         await client.connect();
         const wheelCollection = client.db('wheelManufacture').collection('wheels');
         const orderCollection= client.db('wheelManufacture').collection('orders');

         //get all wheels
         app.get('/wheels', async(req, res) =>{
            const query = {};
            const cursor = wheelCollection.find(query);
            const wheels = await cursor.toArray();
            res.send(wheels);
        });

        //find single wheel via id
        app.get('/wheel/:id', async(req, res) =>{
            const id = req.params.id;
            const query={_id: ObjectId(id)};
            const wheel = await wheelCollection.findOne(query);
            res.send(wheel);
        });

        //post api to create a order
        app.post('/placeOrder', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Wheel Manufacturing LTD server is running')
})

app.listen(port, () => {
    console.log(`Server is running successfully ${port}`)
})

