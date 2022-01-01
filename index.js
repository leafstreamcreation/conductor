const mongoose = require("mongoose");
const RegeneratingDocument = require("./RegeneratingDocument/RegeneratingDocument");
const regenTaskSchema = require("./models/RegeneratingTask.model");
const taskSchema = require("./models/Task.model");
require("dotenv/config");


const MS12HOURREFRESH = 1000 * 60 * 60 * 12;

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost/pudge-pile";
const MONGO_URI2 = process.env.MONGODB_URI_2 || "mongodb://localhost/someotherdb";

const options = {
    minPoolSize: 10,
};

const regenTaskSets = {
};

const mongooseConnections = [];

mongooseConnections[0] = mongoose.createConnection(MONGO_URI, options).asPromise().then(async () => {
    initializeAndLoadTasks(mongoose.connections[1].name);
})
.catch((err) => {
  console.error("Error connecting to mongo: ", err);
});


mongooseConnections[1] = mongoose.createConnection(MONGO_URI2, options).asPromise().then(async () => {
    initializeAndLoadTasks(mongoose.connections[2].name);
})
.catch((err) => {
  console.error("Error connecting to mongo: ", err);
});

Promise.all(mongooseConnections).then(() => {
    // console.log("START: ", regenTaskSets);
    setTimeout(() => {
        refresh();
        setInterval(refresh, MS12HOURREFRESH);
    }, nextRefreshTime());
});


async function initializeAndLoadTasks(name) {
    regenTaskSets[name] = {};
    const connection = mongoose.connections.find(conn => conn.name === name);
    const RegeneratingTask = connection.model("RegeneratingTask", regenTaskSchema);
    const Task = connection.model("Task", taskSchema);
    const regenTaskData = await RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]).exec();
    for (const data of regenTaskData) {
        const { text, regenInterval, scheduleDate } = data;
        regenTaskSets[name][text] = new RegeneratingDocument({ model: Task, data: {text} }, regenInterval, async () => {
            console.log(text);
            Task.findOneAndUpdate({text}, {text}, {upsert: true}).exec();
        }, scheduleDate);
    }
}



async function refresh() {
    // console.log("tick");
    const [_, ...connections] = mongoose.connections;
    for (const connection of connections) {
        const RegeneratingTask = connection.model("RegeneratingTask");
        const Task = connection.model("Task");
        const deletedTasks = Object.assign({}, regenTaskSets[connection.name]);
        const taskList = await RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]).exec();
        for (const task of taskList) {
            const { text, regenInterval, scheduleDate } = task;
            const regenDocForTask = regenTaskSets[connection.name][text];
            //handle a new ongoing task
            if(!regenDocForTask) {
                // console.log("new task");
                regenTaskSets[connection.name][text] = new RegeneratingDocument({ model: Task, data: {text} }, regenInterval, async () => {
                    console.log(text);
                    Task.findOneAndUpdate({text}, {text}, {upsert: true}).exec();
                }, scheduleDate);
            } 
            //handle updating an ongoing task
            else if (deletedTasks[text]) {
                delete deletedTasks[text];
                const sameData = regenDocForTask.hasData(regenInterval, scheduleDate);
                if (!sameData) regenTaskSets[connection.name][text].updateWith(regenInterval, scheduleDate);
            }
        }
        for (const key in deletedTasks) {
            //handle ongoing task deletion
                // console.log("delete task");
            regenTaskSets[connection.name][key].terminate();
            delete regenTaskSets[connection.name][key];
        }
    }
}

function nextRefreshTime() {
    // return 1000;
    const thisHour = new Date().getUTCHours();
    if (thisHour < 9 || thisHour >= 21) return (new Date().setUTCHours(9,0,0,0)) - Date.now();
    else return (new Date().setUTCHours(21,0,0,0)) - Date.now();
}
