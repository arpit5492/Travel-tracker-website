import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import pg from "pg";

const app = express();
const port = 3000;

// Connection to Database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "firstDB",
  password: "password",
  port: 5433
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("dev"));

app.get("/", async (req, res) => {
  //Write your code here.
  const result = await db.query("SELECT country_code FROM visited_countries");
  console.log(result.rows);
  let countries = [];
  result.rows.forEach(country => {
    countries.push(country.country_code);
  });
  console.log(countries);
  res.render("index.ejs", {countries: countries, total: countries.length});
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
