const mongoose = require("mongoose");
const RegeneratingDocument = require("./RegeneratingDocument/RegeneratingDocument");
const regenTaskSchema = require("./models/RegeneratingTask.model");
const taskSchema = require("./models/Task.model");
require("dotenv/config");


const MS12HOURREFRESH = 1000 * 60 * 60 * 12;

const MONGO_URI = "mongodb://localhost/pudge-pile"; //process.env.MONGODB_URI || 
const MONGO_URI2 = "mongodb://localhost/someotherdb";

const options = {
    minPoolSize: 10,
};

const regenTaskSets = {
    "pudge-pile": {},
    "someotherdb": {},
};

const mongooseConnections = [];

mongooseConnections[0] = mongoose.createConnection(MONGO_URI, options).asPromise().then(async () => {
    initializeAndLoadTasks("pudge-pile");
})
.catch((err) => {
  console.error("Error connecting to mongo: ", err);
});


mongooseConnections[1] = mongoose.createConnection(MONGO_URI2, options).asPromise().then(async () => {
    initializeAndLoadTasks("someotherdb");
})
.catch((err) => {
  console.error("Error connecting to mongo: ", err);
});

Promise.all(mongooseConnections).then(() => {
    setTimeout(() => {
        refresh();
        // setInterval(refresh, MS12HOURREFRESH);
    }, nextRefreshTime());
});


async function initializeAndLoadTasks(name) {
    const connection = mongoose.connections.find(conn => conn.name === name);
    const RegeneratingTask = connection.model("RegeneratingTask", regenTaskSchema);
    connection.model("Task", taskSchema);
    const regenTaskData = await RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]).exec();
    regenTaskSets[name] = regenTaskData;
}



async function refresh() {
    console.log(regenTaskSets);
    for (const set in regenTaskSets) {
        const connection = mongoose.connections.find(conn => conn.name === set);
        console.log(set, connection.modelNames());
    }

    mongoose.connections.forEach(conn => conn.close());
}

function nextRefreshTime() {
    return 1000;
}


//think I might just need to make another connection here; test locally
// mongoose
//   .connect(MONGO_URI)
//   .then((x) => {
//     console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);

//     const tasks = {};
//     const MSDAILYREFRESH = 1000 * 60 * 60 * 24;
//     const refetchThread = {
//         id: 0,
//         isActive: false,
//     };

//     start();
    

//     function start() {
//         RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]).then(taskData => {
//             if (!refetchThread.isActive && taskData.length === 0) {
//                 refetchThread.id = setInterval(start, MSDAILYREFRESH);
//                 refetchThread.isActive = true;
//             }
//             else for (const data of taskData) {
//                 const { text, regenInterval, scheduleDate } = data;
//                 tasks[text] = new RegeneratingDocument({ text }, regenInterval, regenerate, scheduleDate);
//             }
//         });
//     }
    
//     async function regenerate({ text }) {
//         const taskList = await RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]);
//         if (taskList.length === 0) { 
//             if (!refetchThread.isActive) {
//                 refetchThread.id = setInterval(start, MSDAILYREFRESH);
//                 refetchThread.isActive = true;
//             }
//             removeDocument(text);
//         }
//         else {
//             if(refetchThread.isActive) {
//                 clearInterval(refetchThread.id);
//                 refetchThread.isActive = false;
//             }
//             let found = false;
//             for(const task of taskList) {
//                 if (!tasks[task.text]) {
//                     tasks[task.text] = new RegeneratingDocument({ text: task.text }, task.regenInterval, regenerate, task.scheduleDate);
//                 }
//                 if (task.text === text) found = true;
//             }
//             found ? Task.findOneAndUpdate({text}, {text}, {upsert: true}).exec() : removeDocument(text);
//         }
//     }
    
//     function removeDocument(id) {
//         tasks[id].terminate();
//         delete tasks[id];
//     }
//   })
