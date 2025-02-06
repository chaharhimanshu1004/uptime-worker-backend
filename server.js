const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const client = require("./client");
const { PrismaClient } = require('@prisma/client');
const sendNotificationEmail = require('./sendNotificationEmail')
const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

const QUEUE_NAME = "uptime-monitoring-queue";
const STATUS_CHANNEL = "website_status";
const CHECK_INTERVAL = 10000;
const RETRY_COUNT = 5;
const RETRY_DELAY = 10*1000; // 10 sec delay for retrying
const QUEUE_FETCH_TIME = 5*1000


async function main(){
    while(true){
        const websiteCheck = await extractWebsiteFromQueue();
        if(websiteCheck){
            console.log(websiteCheck , typeof websiteCheck.id);
            const { url, userId, userEmail, id } = websiteCheck;
            console.log(`Checking ${url} for user ${userId} for website id: ${id}`);
            const { isUp, responseTime} = await checkWebsiteUptime(url);
            if (isUp) {
                console.log(`Website ${url} is up, response time: ${responseTime}ms`);
                await rescheduleWebsiteCheck(websiteCheck);
                await publishStatusUpdate(url, "up", userId,userEmail,id,responseTime);
            } else {
                console.log(`Website ${url} is down`);
                await rescheduleWebsiteCheck(websiteCheck);
                await publishStatusUpdate(url, "down", userId,userEmail,id,responseTime);
                await sendNotificationEmail(url,userEmail);
            }
        }else {
            console.log("Queue is empty");
        }
        await new Promise((resolve) => setTimeout(resolve, QUEUE_FETCH_TIME));
        
    }
}

async function publishStatusUpdate(url, status,userId,userEmail,id,responseTime) {
    try{
        await prisma.websiteStatus.create({
            data: {
                websiteId: id,
                status: status,
                responseTime: responseTime
            }
        })
        await client.publish(STATUS_CHANNEL, JSON.stringify({ url, status, userId, userEmail, id,responseTime}));
    }catch(err){
        console.log('Error publishing status update:', err);
    }
}

async function checkWebsiteUptime(url) {
    for (let i = 0; i < RETRY_COUNT; i++) {
        try {
            const startTime = Date.now();
            const response = await fetch(url);
            const responseTime = Date.now() - startTime
            if (response.status >= 200 && response.status < 300) {
                return {
                    isUp: true,
                    responseTime,
                }
            } else if (response.status === 403) {
                console.log(`Website fetching is forbidden by the website's server: ${url}`);
                return {
                    isUp: true,
                    responseTime,
                }
            }
        } catch (error) {
            console.error(`Error checking website ${url}: ${error.message}`);
        }

        if (i < RETRY_COUNT - 1) {
            console.log(`Retrying ${url} in ${RETRY_DELAY / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
    }
    return {
        isUp: false,
        responseTime: 0,
    }
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
