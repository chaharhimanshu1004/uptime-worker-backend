const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const axios = require("axios")
const client = require("./client");
const { PrismaClient } = require('@prisma/client');
const sendNotificationEmail = require('./sendNotificationEmail')
const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

const REGION = process.env.REGION || "asia";

const QUEUE_NAME = `uptime-monitoring-queue-${REGION}`;
const RECOVERY_SET = `uptime-processing-set-${REGION}`;
const STATUS_CHANNEL = "website_status";
const CHECK_INTERVAL = 10000;
const RETRY_COUNT = 3;
const RETRY_DELAY = 10*1000; // 10 sec delay for retrying
const QUEUE_FETCH_TIME = 5 * 1000
const STALE_PROCESSING_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const API_TIMEOUT = 15000; // 15 seconds



async function main(){
    while(true){
        try {
            const websiteCheck = await extractWebsiteFromQueue();
            if (websiteCheck) {
                console.log(websiteCheck, typeof websiteCheck.id);
                const { url, userId, userEmail, id, isPaused, isFirstCheck } = websiteCheck;
                console.log(`Checking ${url} for user ${userId} for website id: ${id}`);
                if (isPaused) {
                    console.log(`Website ${url} monitoring is paused, skipping check`);
                    await rescheduleWebsiteCheck(websiteCheck);
                    continue;
                }

                const website = await prisma.website.findUnique({
                    where: { id }
                });

                await prisma.website.update({
                    where: { id },
                    data: { lastCheckedAt: new Date() },
                })

                const { isUp, responseTime } = await checkWebsiteUptime(url, isFirstCheck);
                const statusChanged = website.isUp !== isUp;

                if (isUp) {
                    console.log(`Website ${url} is up, response time: ${responseTime}ms`);

                    const updateData = { isUp: true };
                    if (statusChanged) {
                        updateData.lastUpAt = new Date();
                        console.log(`Website ${url} changed status from DOWN to UP`);
                    }

                    await prisma.website.update({
                        where: { id },
                        data: updateData
                    });

                    const openIncident = await prisma.incident.findFirst({
                        where: {
                            websiteId: id,
                            isResolved: false,
                        },
                    })

                    if (openIncident) {
                        const endTime = new Date()
                        const duration = Math.floor((endTime.getTime() - openIncident.startTime.getTime()) / 1000)

                        await prisma.incident.update({
                            where: { id: openIncident.id },
                            data: {
                                endTime,
                                isResolved: true,
                                duration,
                            },
                        })

                        console.log(`Resolved incident for ${url}, duration: ${duration} seconds`)
                    }

                    await rescheduleWebsiteCheck(websiteCheck);
                    await publishStatusUpdate(url, "up", userId, userEmail, id, responseTime);
                } else {
                    console.log(`Website ${url} is down`);

                    const updateData = { isUp: false };
                    if (statusChanged) {
                        updateData.lastDownAt = new Date();
                        console.log(`Website ${url} changed status from UP to DOWN`);
                    }

                    await prisma.website.update({
                        where: { id },
                        data: updateData
                    });

                    const openIncident = await prisma.incident.findFirst({
                        where: {
                            websiteId: id,
                            isResolved: false,
                        },
                    })

                    if (!openIncident) {
                        await prisma.website.update({
                            where: { id },
                            data: { incidentCount: { increment: 1 } },
                        })

                        await prisma.incident.create({
                            data: {
                                websiteId: id,
                                responseTime: responseTime,
                                isResolved: false,
                                region: REGION
                            },
                        })

                        console.log(`Created new incident for ${url}`)
                    }

                    await rescheduleWebsiteCheck(websiteCheck);
                    await publishStatusUpdate(url, "down", userId, userEmail, id, responseTime);
                    await sendNotificationEmail(url, userEmail);
                }
            } else {
                console.log("Queue is empty");
            }
            await new Promise((resolve) => setTimeout(resolve, QUEUE_FETCH_TIME));
        } catch (error) {
            console.error("Error in main loop: ", error);
        }
        
    }
}

async function publishStatusUpdate(url, status,userId,userEmail,id,responseTime) {
    try{
        await prisma.websiteStatus.create({
            data: {
                websiteId: id,
                status: status,
                responseTime: responseTime,
                region: REGION
            }
        })
        await client.publish(STATUS_CHANNEL, JSON.stringify({ url, status, userId, userEmail, id,responseTime, isUp: status === "up" }));
    }catch(err){
        console.log('Error publishing status update:', err);
    }
}

async function checkWebsiteUptime(url, isFirstCheck) {
    for (let i = 0; i < RETRY_COUNT; i++) {
        try {
            const startTime = Date.now();
            const response = await axios.get(url, {timeout: API_TIMEOUT});
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
            } else {
                if (isFirstCheck) {
                    console.log('First time check and the website is down:', url);
                    return {
                        isUp: false,
                        responseTime,
                    }
                }
            }
        } catch (error) {
            console.error(`Error checking website ${url}: ${error.message}`);
            if (error.code === "ENOTFOUND") {
                console.error(`Website ${url} DNS not resolved`);
                if (isFirstCheck || i == RETRY_COUNT - 1) {
                    return {
                        isUp: false,
                        responseTime: 0,
                    }
                }
            }else if(isFirstCheck && error.code === "ECONNABORTED"){
                console.log('First time check and the website is down:', url);
                return {
                    isUp: false,
                    responseTime: 0,
                }
            }
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
    const rawCheck = result[0];
    const check = JSON.parse(rawCheck);
    await client.multi()
        .zrem(QUEUE_NAME, rawCheck)
        .zadd(RECOVERY_SET, now, rawCheck)
        .exec();
    return check;
}

async function rescheduleWebsiteCheck(check) {
    const nextCheckTime = Date.now() + CHECK_INTERVAL;
    const updatedCheck = { ...check, isFirstCheck: false, nextCheckTime };
    const rawCheck = JSON.stringify(updatedCheck);
    await client.multi()
        .zrem(RECOVERY_SET, JSON.stringify(check))
        .zadd(QUEUE_NAME, nextCheckTime, rawCheck)
        .exec();
}


async function requeueStaleProcessingTasks() {
    const now = Date.now();
    const staleTasks = await client.zrangebyscore(RECOVERY_SET, 0, now - STALE_PROCESSING_TIMEOUT);
    console.log('>>websites in recovery set are: ', staleTasks);
    for (const task of staleTasks) {
        console.log("Re-enqueuing the websites into the queue", task);
        await client.zrem(RECOVERY_SET, task);
        await client.zadd(QUEUE_NAME, now, task);
    }
}

setInterval(requeueStaleProcessingTasks, STALE_PROCESSING_TIMEOUT);

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Hello from the Node.js backend!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    main().catch(console.error);
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
    process.exit();
});
