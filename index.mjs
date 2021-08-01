import puppeteer from "puppeteer";
import mongodb from "mongodb";

let MongoClient = mongodb.MongoClient;

const config = {
  STARTUP: {
    URL: (page = 0) =>
      `https://www.startupsg.net/api/v0/search/profiles/startup?type=listing&sort=&from=${page}`,
    TOTAL_PAGES: 314,
    STEPS: 10,
  },
  INVESTORS: {
    URL: (page = 0) =>
      `https://www.startupsg.net/api/v0/search/profiles/investor?type=listing&sort=-changed&from=${page}`,
    TOTAL_PAGES: 36,
    STEPS: 10,
  },

  PEOPLE: {
    URL: (page = 0) =>
      `https://www.startupsg.net/api/v0/search/profiles/individual?type=listing&sort=-changed&from=${page}`,
    TOTAL_PAGES: 580,
    STEPS: 10,
  },
};

const getConfig = (collection) => {
  switch (collection) {
    case "startup":
      return config.STARTUP;
    case "investors":
      return config.INVESTORS;
    case "people":
      return config.PEOPLE;
  }
};

const MONGODB = {
  URL: your_mongodb_url, // "mongodb://localhost:27017"
  DB_NAME: your_mongodb_db_name, // "startupsg",
};

(async () => {
  const browser = await puppeteer.launch();

  const mongoClient = await MongoClient.connect(MONGODB.URL);
  console.log("Connected successfully to server");
  const db = mongoClient.db(MONGODB.DB_NAME);

  // SET collection here to check which one to craw;
  const COLLECTION = "startup";
  let PAGE = getConfig(COLLECTION);

  console.log(PAGE);

  const openPage = async (page) => {
    try {
      const tab = await browser.newPage();
      await tab.goto(PAGE.URL(page));

      let jsonString = await tab.evaluate(
        () => document.querySelector("pre").innerText
      );

      const data = JSON.parse(jsonString);

      await Promise.all(
        data.data.map(async (item) => {
          await db.collection(COLLECTION).insertOne(item);
        })
      );

      await tab.close();
    } catch (err) {
      //
    }
  };

  const run = async (page) => {
    page += PAGE.STEPS;

    if (page <= PAGE.TOTAL_PAGES * PAGE.STEPS) {
      console.log(page);
      await openPage(page);
      run(page);
    } else {
      await browser.close();
      await mongoClient.close();
    }
  };

  await run(0);
})();
