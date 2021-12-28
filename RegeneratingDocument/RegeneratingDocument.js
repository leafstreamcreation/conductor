module.exports = class RegeneratingDocument {
    constructor(document, regenFrequency, action, nextRegenTime = Date.now() + regenFrequency) {
        this.document = document;
        this.regenFrequency = regenFrequency;
        this.action = action;
        this.nextRegenTime = nextRegenTime;

        if(Date.now() > nextRegenTime) {
            action(document);
            this.nextRegenTime = Date.now() + regenFrequency;
        }
        setTimeout(() => {
            action(document);
            this.id = setInterval(action, regenFrequency, document);
        }, this.nextRegenTime - Date.now());
    }
    terminate() {
        clearInterval(this.id);
    }
};