local resultFID = redis.call('SISMEMBER', KEYS[1], ARGV[1]);
if resultFID == 1 then
    return true;
else
    local result = redis.call('SMEMBERS', KEYS[2]);
    return result;
end
