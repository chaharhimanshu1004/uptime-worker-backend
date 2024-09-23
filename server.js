const express = require("express");
const client = require("./client");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;

const QUEUE_NAME = "uptime-monitoring-queue";
const CHECK_INTERVAL = 5*60*1000;
const RETRY_COUNT = 5;
const RETRY_DELAY = 30 * 1000;

async function main(){
    while(true){
        const website = await extractWebsiteFromQueue();
        if(website){
            console.log(`Checking ${website.url}`);
            const isUp = await checkWebsiteUptime(website.url);
            if (isUp) {
                console.log(`Website ${website.url} is up`);
                await rescheduleWebsiteCheck(website.url);
            } else {
                console.log(`Website ${website.url} is down`);
                await sendNotificationEmail(website.url);
            }
        }else {
            console.log("Queue is empty");
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
    }
}

async function checkWebsiteUptime(url) {
    for (let i = 0; i < RETRY_COUNT; i++) {
        try {
            const response = await fetch(url);
            if (response.status >= 200 && response.status < 300) {
                return true; 
            } else if (response.status === 403) {
                console.log(`Website fetching is forbidden by the website's server: ${url}`);
                return true; 
            }
        } catch (error) {
            console.error(`Error checking website ${url}: ${error.message}`);
        }

        if (i < RETRY_COUNT - 1) {
            console.log(`Retrying ${url} in ${RETRY_DELAY / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
    }
    return false; 
}

async function extractWebsiteFromQueue() {

    const now = Date.now();
    const result = await client.zrangebyscore(QUEUE_NAME, 0, now, "LIMIT", 0, 1);

    if (result.length === 0) {
        return null;
    }
    const check = JSON.parse(result[0]);
    await client.zrem(QUEUE_NAME, result[0]);

    return check;
}

async function addWebsiteToQueue(check) {
    await client.zadd(QUEUE_NAME, check.nextCheckTime, JSON.stringify(check));
}

async function rescheduleWebsiteCheck(url) {
    const nextCheckTime = Date.now() + CHECK_INTERVAL;
    await addWebsiteToQueue({ url, nextCheckTime });
}

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Hello from the Node.js backend!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    main().catch(console.error);
});
