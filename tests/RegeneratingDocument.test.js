const Utilities = require("./TestUtilities");
const RegeneratingDocument = require("../RegeneratingDocument/RegeneratingDocument");

//regendocuments have a document, interval, action, and nextRegenTime

//no db connection required here

describe("RegenDocument tests", () => {
    test("action fires", async () => {
        let actionFired = false;
        const doc = new RegeneratingDocument({}, 2, () => {
            actionFired = true;
        });
        await new Promise((resolve) => {setTimeout(resolve, 5)});
        expect(actionFired).toBe(true);
        doc.terminate();
    });

    test("action fires after regenInterval when scheduled immediately", async () => {
        const REGENTIME = 1000;
        const startTime = Date.now();
        let actualTime = 0;
        const doc = new RegeneratingDocument({}, REGENTIME, () => {
            actualTime = Date.now() - startTime;
        });
        await new Promise((resolve) => {setTimeout(resolve, REGENTIME + 5)});
        const deviation = Math.abs(1 - (actualTime / REGENTIME));
        expect(deviation).toBeCloseTo(0.0, 2);
        doc.terminate();
    });

    test("action fires at schedule date", async () => {
        const SCHEDULE_DATE = Date.now() + 1500;
        const REGENTIME = 1000;
        let firingDate = 0;
        const doc = new RegeneratingDocument({}, REGENTIME, () => {
            firingDate = Date.now();
        }, SCHEDULE_DATE);
        await new Promise((resolve) => {setTimeout(resolve, 1490)});
        expect(firingDate).toBe(0);
        await new Promise((resolve) => {setTimeout(resolve, 20)});
        const deviation = Math.abs(1 - (firingDate / (SCHEDULE_DATE)));
        expect(deviation).toBeCloseTo(0.0, 2);
        doc.terminate();
    });

    test("action fires in time with when past schedule date", async () => {
        const SCHEDULE_DATE = Date.now() - 3000;
        const REGENTIME = 2000;
        const EXPECTED_DATE = SCHEDULE_DATE + 4000;
        let firingDate = 0;
        const doc = new RegeneratingDocument({}, REGENTIME, () => {
            firingDate = Date.now();
        }, SCHEDULE_DATE);
        await new Promise((resolve) => {setTimeout(resolve, 990)});
        expect(firingDate).toBe(0);
        await new Promise((resolve) => {setTimeout(resolve, 20)});
        const deviation = Math.abs(1 - (firingDate / (EXPECTED_DATE)));
        expect(deviation).toBeCloseTo(0.0, 2);
        doc.terminate();
    });
});