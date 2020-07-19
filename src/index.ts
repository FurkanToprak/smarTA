import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
