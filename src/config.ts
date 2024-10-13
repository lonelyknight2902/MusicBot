import dotenv from 'dotenv';

dotenv.config();

const { DISCORD_TOKEN } = process.env;

if(!DISCORD_TOKEN) {
    throw new Error('Discord token is not provided');
}

export default {
    DISCORD_TOKEN
}