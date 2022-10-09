const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API-1 Get all movies
const convertDBMovieObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

app.get("/movies/", async (request, response) => {
  const getAllMoviesQuery = `
        SELECT
            movie_name
        FROM
            movie
    `;
  const allMoviesArray = await db.all(getAllMoviesQuery);
  response.send(
    allMoviesArray.map((eachMovie) =>
      convertDBMovieObjectToResponseObject(eachMovie)
    )
  );
});

//API-2 Add a movie
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addAMovieQuery = `
  INSERT INTO
        movie (director_id, movie_name, lead_actor)
    VALUES (
        ${directorId},
        "${movieName}",
        "${leadActor}"
    );
  `;
  const movieData = await db.run(addAMovieQuery);
  const movieId = movieData.lastId;
  response.send("Movie Successfully Added");
});

//API-3 Get a movie
const convertDBMovieDetailsObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetailsQuery = `
        SELECT
            *
        FROM
            movie
        WHERE
            movie_id = ${movieId};
    `;
  const movieDetails = await db.get(getMovieDetailsQuery);
  response.send(convertDBMovieDetailsObjectToResponseObject(movieDetails));
});

//API-4 Update Movie Details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  //   console.log(movieId);
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
        UPDATE
            movie
        SET
            director_id = ${directorId},
            movie_name = "${movieName}",
            lead_actor = "${leadActor}";
        WHERE
            movie_id = ${movieId};
    `;
  const updatedMovieDetails = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API-5 Delete a Movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE
        FROM
            movie
        WHERE
            movie_id = ${movieId}
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API-6 Get all directors
const convertDBDirectorDetailsObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getAllDirectorsQuery = `
        SELECT
            *
        FROM
            director
    `;
  const directorsArray = await db.all(getAllDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDBDirectorDetailsObjectToResponseObject(eachDirector)
    )
  );
});

//API-7 Get Director Movies
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
        SELECT
            movie_name
        FROM
            movie
        WHERE
            director_id = "{${directorId}";
    `;
  const directorMoviesArray = await db.get(getDirectorMoviesQuery);
  response.send(
    directorMoviesArray.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

module.exports = app;
