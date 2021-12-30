const mongoose = require("mongoose");
const RegeneratingDocument = require("./RegeneratingDocument/RegeneratingDocument");
const RegeneratingTask = require("./models/RegeneratingTask.model");
const Task = require("./models/Task.model");


const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost/pudge-pile";

mongoose
  .connect(MONGO_URI)
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);

    const tasks = {};
    const MSDAILYREFRESH = 1000 * 60 * 60 * 24;
    const refetchThread = {
        id: 0,
        isActive: false,
    };

    start();
    

    function start() {
        RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]).then(taskData => {
            if (!refetchThread.isActive && taskData.length === 0) {
                refetchThread.id = setInterval(start, MSDAILYREFRESH);
                refetchThread.isActive = true;
            }
            else for (const data of taskData) {
                const { text, regenInterval, scheduleDate } = data;
                tasks[text] = new RegeneratingDocument({ text }, regenInterval, regenerate, scheduleDate);
            }
        });
    }
    
    async function regenerate({ text }) {
        const taskList = await RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]);
        if (taskList.length === 0) { 
            if (!refetchThread.isActive) {
                refetchThread.id = setInterval(start, MSDAILYREFRESH);
                refetchThread.isActive = true;
            }
            removeDocument(text);
        }
        else {
            if(refetchThread.isActive) {
                clearInterval(refetchThread.id);
                refetchThread.isActive = false;
            }
            let found = false;
            for(const task of taskList) {
                if (!tasks[task.text]) {
                    tasks[task.text] = new RegeneratingDocument({ text: task.text }, task.regenInterval, regenerate, task.scheduleDate);
                }
                if (task.text === text) found = true;
            }
            found ? Task.findOneAndUpdate({text}, {text}, {upsert: true}).exec() : removeDocument(text);
        }
    }
    
    function removeDocument(id) {
        tasks[id].terminate();
        delete tasks[id];
    }
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });
