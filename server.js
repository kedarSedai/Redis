import express from 'express';
import axios from 'axios';
import redis from 'redis';

const app = express();

const redisPort = 6379;
const client = redis.createClient(redisPort);
client.on("error", err => console.log(err));

const port = process.env.PORT || 3000;

//WITHOUT REDIS
// app.get('/jobs', async(req, res) => {
//     const searchJob = req.query.search;
//     try{
//         const jobs = await axios.get(`https://jobs.github.com/positions.json?search=${searchJob}`);
//         res.status(200).send({jobs: jobs.data});

//     }catch(err){
//         res.status(400).send({message: err.message});
//     }
// });

//WITH REDIS
app.get('/jobs', async(req, res) => {
    const searchJob = req.query.search;
    try{
        client.get(searchJob, async(err, jobs) => {
            if(err) throw err;

            if(jobs){
                res.status(200).send({jobs: JSON.parse(jobs), message: 'Data retrieved from Cache'})
            }else{
                const jobs = await axios.get(`https://jobs.github.com/positions.json?search=${searchJob}`);
                client.setex(searchJob, 600, JSON.stringify(jobs.data));
                res.status(200).send({
                    jobs: jobs.data,
                    message: "cache miss"
                });
            }
        });
    }catch(err){
        res.status(500).send({message: err.message});
    }
});

app.listen(port, () => console.log(`Server is running at ${port}`));



