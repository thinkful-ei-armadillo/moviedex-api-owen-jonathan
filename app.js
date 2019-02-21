require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const movies = require('./movies');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  const api_key = process.env.API_KEY;
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: 'Request header must include Authorization' });
  }

  const auth_key = authHeader.split(' ')[1];
  if (!auth_key) {
    return res
      .status(401)
      .json({ error: 'Authorization header must include API token' });
  }
  if (auth_key != api_key) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
});

function handleSearch(req, res) {
  let results = movies;
  const { search, searchType = 'film_title' } = req.query;

  console.log(
    `req.query is ${
      req.query
    }, search is ${search}, searchType is ${searchType}`
  );

  if (search) {
    if (!['genre', 'country', 'avg_vote', 'film_title'].includes(searchType)) {
      throw new Error('searchType must be "genre", "country", or "avg_vote".');
    }

    if (searchType === 'avg_vote') {
      if (isNaN(+search) && (searchType < 0 || searchType > 10)) {
        throw new Error('avg_vote must search for a number between 0-10');
      }
      results = results.filter(movie => movie.avg_vote >= search);
      return res.send(results);
    } else {
      results = results.filter(movie =>
        movie[searchType].toLowerCase().includes(search.toLowerCase())
      );
    }
  }

  res.send(results);
}

app.get('/movie', handleSearch);

module.exports = app;
