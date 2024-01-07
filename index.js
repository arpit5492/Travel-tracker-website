import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import morgan from "morgan";

const app = express();
const port = 4010;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "firstDB",
  password: "password",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("dev"));

let currentUserId = 7;

let users = [];


async function checkVisisted() {
  const result = await db.query("SELECT visited_countries.country_code FROM users JOIN visited_countries ON users.id = visited_countries.user_id WHERE users.id = $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function checkUserID(){
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  const nowUser = users.find((user) => user.id == currentUserId);
  console.log(nowUser);
  return nowUser;  
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await checkUserID(); // returns an object
  console.log(countries);
  // console.log(users);
  console.log(currentUser);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color
  });
});
app.post("/add", async (req, res) => {
  const currentUser = await checkUserID();
  const userId = currentUser.id;
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    console.log(result.rows);

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, userId]
      );
      res.redirect("/");
    } catch (err) {
      // console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        error: "Country already exists. Please enter a different country",
        color: "teal"
      });
    }
  } catch (err) {
    // console.log(err);
    const countries = await checkVisisted();
    const currentUser = await checkUserID();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      error: "Invalid country. Please try again",
      color: currentUser.color
    });
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add === "new"){
    res.render("new.ejs");
  }
  else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  console.log(req.body);
  const newUserName = req.body.name;
  const newUserColor = req.body.color;
  await db.query("INSERT INTO users (name, color) VALUES ($1, $2)", 
  [newUserName, newUserColor]
  );
  res.redirect("/");

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
