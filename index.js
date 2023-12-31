import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import pg from "pg";

const app = express();
const port = 4000;

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

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}

// GET home page
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

app.post("/add", async(req, res) => {
  const cntry = req.body.country;

  try{
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) like '%' || $1 || '%'", [cntry.toLowerCase()]);

    const code = result.rows[0].country_code;
    try{
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [code]);
      res.redirect("/");
    } catch(err) {
      // console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country name already exists. Please put a different country name"
      });
    }
  } catch(err) {
    // console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Invalid country name. Please try again"
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
