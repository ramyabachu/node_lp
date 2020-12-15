if (redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 1) then
    return true
elseif (redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1) then
    return true
else
    return nil
end