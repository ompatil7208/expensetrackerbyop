const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas connection URL
const mongoURI = 'mongodb+srv://ompatil0542004:7Z3iAdU82FwO84ix@cluster0.zogqpmc.mongodb.net/financial_app?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
const connectToMongoDB = async () => {
  const client = new MongoClient(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    throw error;
  }
};

// Initialize Balance
const initializeBalance = async () => {
  const client = await connectToMongoDB();
  const db = client.db('financial_app');
  const incomeColl = db.collection('income');
  const expensesColl = db.collection('expenses');
  const balanceColl = db.collection('balance');

  try {
    // Clear existing documents from collections
    await incomeColl.deleteMany({});
    await expensesColl.deleteMany({});
    await balanceColl.deleteMany({});

    console.log('Documents cleared from collections');

    // Initialize balance
    let initialBalance = 0;

    // Update or insert balance record
    await balanceColl.updateOne({}, { $set: { balance: initialBalance } }, { upsert: true });

    console.log('Initial balance calculated and updated:', initialBalance);
  } catch (error) {
    console.error('Error initializing balance:', error);
  } finally {
    client.close();
  }
};

// Save income record
app.post('/income/save', async (req, res) => {
  const client = await connectToMongoDB();
  const db = client.db('financial_app');
  const incomeColl = db.collection('income');
  const balanceColl = db.collection('balance');

  try {
    const { amount, source } = req.body;
    const record = { type: 'income', amount: parseFloat(amount), source };
    await incomeColl.insertOne(record);

    // Update balance
    const balanceDoc = await balanceColl.findOne({});
    let currentBalance = balanceDoc ? balanceDoc.balance : 0;
    currentBalance += parseFloat(amount);
    await balanceColl.updateOne({}, { $set: { balance: currentBalance } }, { upsert: true });

    const updatedRecords = await incomeColl.find({}).toArray();
    res.send(updatedRecords);
  } catch (error) {
    console.error('Error saving income record:', error);
    res.status(500).send('Error saving income record');
  } finally {
    client.close();
  }
});

// Save expense record
app.post('/expense/save', async (req, res) => {
  const client = await connectToMongoDB();
  const db = client.db('financial_app');
  const expensesColl = db.collection('expenses');
  const balanceColl = db.collection('balance');

  try {
    const { amount, source } = req.body;
    const record = { type: 'expense', amount: parseFloat(amount), source };
    await expensesColl.insertOne(record);

    // Update balance
    const balanceDoc = await balanceColl.findOne({});
    let currentBalance = balanceDoc ? balanceDoc.balance : 0;
    currentBalance -= parseFloat(amount);
    await balanceColl.updateOne({}, { $set: { balance: currentBalance } }, { upsert: true });

    const updatedRecords = await expensesColl.find({}).toArray();
    res.send(updatedRecords);
  } catch (error) {
    console.error('Error saving expense record:', error);
    res.status(500).send('Error saving expense record');
  } finally {
    client.close();
  }
});

// Get all income records
app.get('/income/all', async (req, res) => {
  const client = await connectToMongoDB();
  const db = client.db('financial_app');
  const incomeColl = db.collection('income');

  try {
    const result = await incomeColl.find({}).toArray();
    res.send(result);
  } catch (error) {
    console.error('Error fetching income records:', error);
    res.status(500).send('Error fetching income records');
  } finally {
    client.close();
  }
});

// Get all expense records
app.get('/expense/all', async (req, res) => {
  const client = await connectToMongoDB();
  const db = client.db('financial_app');
  const expensesColl = db.collection('expenses');

  try {
    const result = await expensesColl.find({}).toArray();
    res.send(result);
  } catch (error) {
    console.error('Error fetching expense records:', error);
    res.status(500).send('Error fetching expense records');
  } finally {
    client.close();
  }
});

// Get current balance
app.get('/balance', async (req, res) => {
  const client = await connectToMongoDB();
  const db = client.db('financial_app');
  const balanceColl = db.collection('balance');

  try {
    const balanceDoc = await balanceColl.findOne({});
    res.send(balanceDoc ? balanceDoc : { balance: 0 });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).send('Error fetching balance');
  } finally {
    client.close();
  }
});

// Initialize balance on server start
initializeBalance().catch(console.error);

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
