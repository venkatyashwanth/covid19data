const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//
const convDb = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

const convDb1 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API -1
app.get("/states/", async (request, response) => {
  const getStates = `
    SELECT
        * 
    FROM 
        state;
    `;
  const statesArray = await database.all(getStates);
  response.send(statesArray.map((eachState) => convDb(eachState)));

  //   response.send(convDb1(statesArray));
});

//API-2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
    SELECT 
        * 
    FROM 
        state 
    WHERE   
        state_id = ${stateId};
    `;
  const state = await database.get(getQuery);
  response.send(convDb(state));
});

//API-3
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postQuery = `
    INSERT INTO 
        district(district_name, state_id, cases, cured, active, deaths)
    VALUES 
        (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        )    
    `;
  await database.run(postQuery);
  response.send("District Successfully Added");
});

//API-4
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
        SELECT 
            * 
        FROM 
            district 
        WHERE 
            district_id = ${districtId};
    `;
  const district = await database.get(getQuery);
  response.send(convDb1(district));
});

// app.get("/districts/", async (request, response) => {
//   const getQuery = `
//     SELECT
//         *
//     FROM
//         district
//     `;
//   const districts = await database.all(getQuery);
//   response.send(districts);
// });

//API-5
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        district 
    WHERE
        district_id = ${districtId};
    `;
  await database.run(deleteQuery);
  response.send("District Removed");
});

//API-6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
  UPDATE 
        district 
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
   WHERE 
    district_id = ${districtId};
  `;
  await database.run(updateQuery);
  response.send("District Details Updated");
});

//API-7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStats = `
    SELECT 
        SUM(cases) AS totalCases,
        SUM(cured) AS totalCured, 
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
    FROM 
        district 
    WHERE 
        state_id = ${stateId};
    `;
  const stats = await database.get(getStats);
  response.send(stats);
  //   response.send({
  //       totalCase: stats['totalCases'],
  //       totalCured: stats['totalCured'],
  //       totalActive: stats['totalActive'],
  //       totalDeaths: stats['totalDeaths'];
  //   })
});

//API-8:
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
    select 
        state_name 
    FROM 
        district 
        NATURAL JOIN state
    WHERE 
        district_id = ${districtId};
    `;
  const state = await database.get(getQuery);
  response.send({ sateName: state.state_name });
});
