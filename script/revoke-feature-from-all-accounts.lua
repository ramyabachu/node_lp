redis.call('SREM', KEYS[1], ARGV[1]);
local response = redis.call('SMEMBERS', KEYS[2]);
for key,result in pairs(response) do
    redis.call('SREM', ARGV[2]..result, ARGV[1]);
    redis.call('SREM', KEYS[2], result);
end
