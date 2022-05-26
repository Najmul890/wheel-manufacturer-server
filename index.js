const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//verify token
const verifyJWT=(req,res,next)=>{
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'Unauthorized Access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(403).send({message: 'Forbidden Access'});
        }
        req.decoded = decoded;
        next();
    })
    
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pukwa.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
         await client.connect();
         const wheelCollection = client.db('wheelManufacture').collection('wheels');
         const orderCollection= client.db('wheelManufacture').collection('orders');
         const userCollection= client.db('wheelManufacture').collection('users');

         //authentication post api
        app.post('/login', async(req,res)=>{
            const user=req.body;
            const accessToken= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
               expiresIn: '1d' 
            });
            res.send({accessToken});
        })

        //get all users
        app.get('/users', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          });

        //create user api via email
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
          });
      

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

        //get orders for a specific user via user email
        app.get('/myOrders',verifyJWT, async (req, res) => {
            const decodedEmail= req.decoded.email;
            const email=req.query.email;
            
            if(email===decodedEmail){
                const query = {userEmail:email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }else{
                res.status(403).send({message: 'Forbidden Access'});
            }
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

