module.exports = class RegeneratingDocument {
    constructor(document, regenInterval, action, nextRegenTime = Date.now() + regenInterval) {
        this.document = document;
        this.regenInterval = regenInterval;
        this.action = action;
        this.nextRegenTime = nextRegenTime;

        let nextFiringTime = nextRegenTime;

        if(Date.now() > nextRegenTime) {
            const timeOverdue = Date.now() - nextRegenTime;
            nextFiringTime = Date.now() + regenInterval - (timeOverdue % regenInterval);
        }
        setTimeout(() => {
            action(document);
            this.id = setInterval(action, regenInterval, document);
        }, nextFiringTime - Date.now());
    }
    
    updateWith(regenInterval, nextRegenTime) {
        // console.log("updating");
        this.regenInterval = regenInterval;
        this.nextRegenTime = nextRegenTime;
        clearInterval(this.id);

        //get next start interval
        let nextFiringTime = nextRegenTime;

        if(Date.now() > nextRegenTime) {
            const timeOverdue = Date.now() - nextRegenTime;
            nextFiringTime = Date.now() + regenInterval - (timeOverdue % regenInterval);
        }
        //set timeout to start interval
        setTimeout(() => {
            this.action(this.document);
            this.id = setInterval(this.action, regenInterval, this.document);
        }, nextFiringTime - Date.now());
    }

    hasData(int, time) {
        if (int != this.regenInterval) return false;
        if (time.valueOf() !== this.nextRegenTime.valueOf()) return false;
        return true;
    }

    terminate() {
        clearInterval(this.id);
    }
};