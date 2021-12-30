const mongoose = require("mongoose");
const RegeneratingDocument = require("./RegeneratingDocument/RegeneratingDocument");
const RegeneratingTask = require("./models/RegeneratingTask.model");
const Task = require("./models/Task.model");

//connect to server
// require("./db");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost/pudge-pile";

mongoose
  .connect(MONGO_URI)
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);

    const tasks = {};
    const refetchThread = {
        id: 0,
        isActive: false,
    };

    start();
    

    function start() {
        console.log("boop!")
        RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]).then(taskData => {
            if (!refetchThread.isActive && taskData.length === 0) {
                refetchThread.id = setInterval(start, 1000);
                refetchThread.isActive = true;
            }
            else for (const data of taskData) {
                const { text, regenInterval, scheduleDate } = data;
                console.log("Creating Task", data);
                tasks[text] = new RegeneratingDocument({ text }, regenInterval, regenerate, scheduleDate);
            }
        });
    }
    //TODO: load application state, build queues, gather and attempt creating overdue documents
    
    async function regenerate({ text }) {
        //check if there are new documents
            console.log("Regenerate", { text});
        const taskList = await RegeneratingTask.find().select(["-_id", "text", "regenInterval", "scheduleDate"]);
        if (taskList.length === 0) { 
            if (!refetchThread.isActive) {
                refetchThread.id = setInterval(start, 1000);
                refetchThread.isActive = true;
            }
            removeDocument(text);
            console.log("Terminated because empty task list");
        }
        else {
            if(refetchThread.isActive) {
                clearInterval(refetchThread.id);
                refetchThread.isActive = false;
            }
            let found = false;
            for(const task of taskList) {
                console.log(task.text, text);
                if (!tasks[task.text]) {
                    console.log("New task discovered", tasks[task.text])
                    tasks[task.text] = new RegeneratingDocument({ text: task.text }, task.regenInterval, regenerate, task.scheduleDate);
                }
                if (task.text === text) found = true;
            }
            if (!found){ 
                removeDocument(text);
                console.log("Terminated because task deleted");
            }
            else {
                console.log("Updating Task", text);
            }
        }
    }
    
    function removeDocument(id) {
        tasks[id].terminate();
        delete tasks[id];
    }
  })
  // .then((result) => {
  //   console.log("closing");
  //   mongoose.connection.close();
  // })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });


// console.log("ping");
// const test = new RegeneratingDocument({ duck: "quack" }, 2000, (document) => {
//     console.log(document.duck);
// }, Date.now() + 1000);
