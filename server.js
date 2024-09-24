const express = require("express");
const client = require("./client");
const sendNotificationEmail = require('./sendNotificationEmail')
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;

const QUEUE_NAME = "uptime-monitoring-queue";
const STATUS_CHANNEL = "website_status";
const CHECK_INTERVAL = 10000;
const RETRY_COUNT = 5;
const RETRY_DELAY = 10*1000; // 10 sec delay for retrying

const dotenv = require('dotenv');
dotenv.config();

async function main(){
    while(true){
        const websiteCheck = await extractWebsiteFromQueue();
        console.log(websiteCheck);
        if(websiteCheck){
            const { url, userId, userEmail } = websiteCheck;
            console.log(`Checking ${url} for user ${userId}`);
            const isUp = await checkWebsiteUptime(url);
            if (isUp) {
                console.log(`Website ${url} is up`);
                await rescheduleWebsiteCheck(websiteCheck);
                await publishStatusUpdate(url, "up", userId,userEmail);
            } else {
                console.log(`Website ${url} is down`);
                await rescheduleWebsiteCheck(websiteCheck);
                await publishStatusUpdate(url, "down", userId,userEmail);
                await sendNotificationEmail(url,userEmail);
                
            }
        }else {
            console.log("Queue is empty");
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
    }
}

async function publishStatusUpdate(url, status,userId,userEmail) {
    await client.publish(STATUS_CHANNEL, JSON.stringify({ url, status, userId,userEmail }));
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

async function rescheduleWebsiteCheck(check) {
    const nextCheckTime = Date.now() + CHECK_INTERVAL;
  await addWebsiteToQueue({ ...check, nextCheckTime });
}

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Hello from the Node.js backend!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    main().catch(console.error);
});
