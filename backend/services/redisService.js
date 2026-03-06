const { getRedisClient } = require("../config/redis");

const CACHE_TTL = 60 * 60 * 24;

exports.cacheUrlData = async (alias, urlData) => {
    const client = getRedisClient();
    const payload = JSON.stringify(urlData);
    await client.set(`url:${alias}`, payload, "EX", CACHE_TTL);
};

exports.getCachedUrlData = async (alias) => {
    const client = getRedisClient();
    const data = await client.get(`url:${alias}`);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        await client.del(`url:${alias}`);
        return null;
    }
};

exports.invalidateCache = async (alias) => {
    const client = getRedisClient();
    await client.del(`url:${alias}`);
};
